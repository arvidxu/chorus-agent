import { app, dialog, shell } from 'electron'
import electronUpdater from 'electron-updater'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import product from '../../../../product.conf.json'

const { autoUpdater } = electronUpdater

type Feed = { url: string; page: string }
type Metadata = { updateFeeds?: Feed[]; installsUpdatesOnMac?: boolean }

// electron-builder.config.cjs writes the update feeds, and whether a macOS build can install
// updates, into the packaged package.json.
async function readMetadata(): Promise<Metadata> {
  try {
    return JSON.parse(await readFile(join(app.getAppPath(), 'package.json'), 'utf8'))
  } catch {
    return {}
  }
}

// The version the user skipped, the version already downloaded, and whether timed checks are off,
// kept across restarts.
const statePath = () => join(app.getPath('userData'), 'updates.json')

const stateSchema = z.object({
  skippedVersion: z.string().optional(),
  downloadedVersion: z.string().optional(),
  isAutomaticCheckDisabled: z.boolean().optional(),
})

type State = z.infer<typeof stateSchema>

// The file is outside the app bundle, so its content is not assumed to be what saveState wrote.
async function readState(): Promise<State> {
  try {
    const result = stateSchema.safeParse(JSON.parse(await readFile(statePath(), 'utf8')))
    return result.success ? result.data : {}
  } catch {
    return {}
  }
}

async function ask(message: string, buttons: string[]) {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    message,
    buttons,
    defaultId: 0,
    cancelId: 1,
  })
  return buttons[response]
}

/**
 * Checks the feeds in order shortly after start and then at a fixed interval. A new version
 * downloads and installs only after the user agrees; an app that cannot install updates opens the
 * release page instead. Returns the function that turns the timed checks on or off.
 */
export async function startUpdates() {
  let lastSave = Promise.resolve()
  const saveState = (change: State) => {
    lastSave = lastSave
      .then(async () =>
        writeFile(statePath(), JSON.stringify({ ...(await readState()), ...change })),
      )
      .catch((error) => console.error('Could not save the update state:', error))
    return lastSave
  }
  // The next timed check reads the saved choice.
  const setAutomaticChecks = (isEnabled: boolean) =>
    saveState({ isAutomaticCheckDisabled: !isEnabled })

  const { updateFeeds: feeds = [], installsUpdatesOnMac = false } = await readMetadata()
  if (!app.isPackaged || feeds.length === 0) {
    return { setAutomaticChecks }
  }
  const state = await readState()
  // The updater would install the setup version over a portable build.
  const isPortable = process.env.PORTABLE_EXECUTABLE_DIR !== undefined
  const installsUpdates = !isPortable && (process.platform !== 'darwin' || installsUpdatesOnMac)
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  let currentFeed = feeds[0]
  // One dialog at a time, no offer while a download runs, and the restart question once per version
  // in each launch.
  let isAsking = false
  let isDownloading = false
  let restartOfferedFor: string | undefined
  // Later on a new version holds back the next offer for a while; a new launch offers it again.
  let offerAgainAt = 0
  const download = (isUserRequest: boolean) => {
    isDownloading = true
    autoUpdater
      .downloadUpdate()
      .catch((error) => {
        if (isUserRequest) {
          dialog.showErrorBox(`${product.name} could not download the update`, String(error))
        }
      })
      .finally(() => {
        isDownloading = false
      })
  }

  autoUpdater.on('update-available', async ({ version }) => {
    if (isAsking || isDownloading || version === state.skippedVersion) {
      return
    }
    // A version downloaded in an earlier launch is already in the updater's cache.
    if (installsUpdates && version === state.downloadedVersion) {
      if (restartOfferedFor !== version) {
        download(false)
      }
      return
    }
    if (Date.now() < offerAgainAt) {
      return
    }
    isAsking = true
    const answer = await ask(`${product.name} ${version} is available.`, [
      'Download',
      'Later',
      'Skip this version',
    ])
    isAsking = false
    if (answer === 'Skip this version') {
      state.skippedVersion = version
      void saveState({ skippedVersion: version })
    }
    if (answer === 'Later') {
      offerAgainAt = Date.now() + product.updates.laterHours * 60 * 60 * 1000
    }
    if (answer !== 'Download') {
      return
    }
    if (installsUpdates) {
      download(true)
    } else {
      shell
        .openExternal(currentFeed.page)
        .catch((error) => console.error('Could not open the release page:', error))
    }
  })
  autoUpdater.on('update-downloaded', async ({ version }) => {
    state.downloadedVersion = version
    void saveState({ downloadedVersion: version })
    if (isAsking || restartOfferedFor === version) {
      return
    }
    restartOfferedFor = version
    isAsking = true
    const answer = await ask(
      `${product.name} ${version} has been downloaded. Restart to install it.`,
      ['Restart', 'Later'],
    )
    isAsking = false
    if (answer === 'Restart') {
      autoUpdater.quitAndInstall(true, true)
    }
  })
  autoUpdater.on('error', (error) => console.error('Update failed:', error))

  const check = async () => {
    if ((await readState()).isAutomaticCheckDisabled) {
      return
    }
    for (const feed of feeds) {
      currentFeed = feed
      autoUpdater.setFeedURL({ provider: 'generic', url: feed.url })
      try {
        await autoUpdater.checkForUpdates()
        return
      } catch {
        // The error event has logged it; try the next feed.
      }
    }
  }
  setTimeout(() => void check(), product.updates.firstCheckSeconds * 1000)
  setInterval(() => void check(), product.updates.checkIntervalHours * 60 * 60 * 1000)
  return { setAutomaticChecks }
}
