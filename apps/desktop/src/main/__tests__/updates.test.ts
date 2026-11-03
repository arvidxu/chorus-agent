import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = await vi.hoisted(async () => {
  const { EventEmitter } = await import('node:events')
  return {
    app: {
      isPackaged: true,
      getAppPath: vi.fn(),
      getPath: vi.fn(),
    },
    dialog: { showMessageBox: vi.fn(), showErrorBox: vi.fn() },
    shell: { openExternal: vi.fn() },
    autoUpdater: Object.assign(new EventEmitter(), {
      downloadUpdate: vi.fn(),
      checkForUpdates: vi.fn(),
      setFeedURL: vi.fn(),
      quitAndInstall: vi.fn(),
    }),
  }
})

// Electron cannot load in plain Node, so these stand in for it; real updates need a packaged app.
vi.mock('electron', () => ({ app: mocks.app, dialog: mocks.dialog, shell: mocks.shell }))
vi.mock('electron-updater', () => ({ default: { autoUpdater: mocks.autoUpdater } }))

const { startUpdates } = await import('../updates.ts')

const feeds = [
  { url: 'https://first.example/download', page: 'https://first.example/page' },
  { url: 'https://second.example/download', page: 'https://second.example/page' },
]

const flush = () => new Promise((resolve) => setImmediate(resolve))

let directory: string

const realPlatform = process.platform

const setPlatform = (platform: string) =>
  Object.defineProperty(process, 'platform', { value: platform })

const writeMetadata = (installsUpdatesOnMac = true) =>
  writeFile(
    join(directory, 'package.json'),
    JSON.stringify({ updateFeeds: feeds, installsUpdatesOnMac }),
  )

function answer(button: number) {
  mocks.dialog.showMessageBox.mockResolvedValueOnce({ response: button })
}

async function offer(version = '2.0.0') {
  mocks.autoUpdater.emit('update-available', { version })
  await flush()
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })
  mocks.app.isPackaged = true
  mocks.autoUpdater.removeAllListeners()
  mocks.autoUpdater.downloadUpdate.mockResolvedValue(undefined)
  mocks.autoUpdater.checkForUpdates.mockResolvedValue(undefined)
  mocks.shell.openExternal.mockResolvedValue(undefined)
  directory = await mkdtemp(join(tmpdir(), 'updates-'))
  mocks.app.getAppPath.mockReturnValue(directory)
  mocks.app.getPath.mockReturnValue(directory)
  await writeMetadata()
})

afterEach(async () => {
  setPlatform(realPlatform)
  vi.useRealTimers()
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

describe('startUpdates', () => {
  test('does nothing in an unpackaged app', async () => {
    mocks.app.isPackaged = false
    await startUpdates()
    expect(mocks.autoUpdater.listenerCount('update-available')).toBe(0)
  })

  test('tries the next feed when one does not answer', async () => {
    mocks.autoUpdater.checkForUpdates.mockRejectedValueOnce(new Error('offline'))
    await startUpdates()
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.waitFor(() =>
      expect(mocks.autoUpdater.setFeedURL.mock.calls.map(([{ url }]) => url)).toEqual(
        feeds.map(({ url }) => url),
      ),
    )
  })

  test('downloads a version only after the user agrees', async () => {
    await startUpdates()
    answer(0)
    await offer()
    await vi.waitFor(() => expect(mocks.autoUpdater.downloadUpdate).toHaveBeenCalledOnce())
  })

  test('tells the user when a download fails', async () => {
    mocks.autoUpdater.downloadUpdate.mockRejectedValueOnce(new Error('disk full'))
    await startUpdates()
    answer(0)
    await offer()
    await vi.waitFor(() =>
      expect(mocks.dialog.showErrorBox).toHaveBeenCalledWith(
        expect.stringContaining('could not download'),
        'Error: disk full',
      ),
    )
  })

  test('stays quiet when a download nobody asked for fails', async () => {
    await writeFile(join(directory, 'updates.json'), JSON.stringify({ downloadedVersion: '2.0.0' }))
    mocks.autoUpdater.downloadUpdate.mockRejectedValueOnce(new Error('disk full'))
    await startUpdates()
    await offer()
    await vi.waitFor(() => expect(mocks.autoUpdater.downloadUpdate).toHaveBeenCalledOnce())
    await flush()
    expect(mocks.dialog.showErrorBox).not.toHaveBeenCalled()
  })

  test('does not offer a skipped version again', async () => {
    await startUpdates()
    answer(2)
    await offer()
    await offer()
    expect(mocks.dialog.showMessageBox).toHaveBeenCalledOnce()
    expect(mocks.autoUpdater.downloadUpdate).not.toHaveBeenCalled()
  })

  test('holds back the offer after Later', async () => {
    await startUpdates()
    answer(1)
    await offer()
    await offer()
    expect(mocks.dialog.showMessageBox).toHaveBeenCalledOnce()
  })

  test('opens the release page from a portable build', async () => {
    vi.stubEnv('PORTABLE_EXECUTABLE_DIR', 'C:\\Apps')
    await startUpdates()
    answer(0)
    await offer()
    expect(mocks.shell.openExternal).toHaveBeenCalledWith(feeds[0].page)
    expect(mocks.autoUpdater.downloadUpdate).not.toHaveBeenCalled()
  })

  test('opens the release page from a macOS build that cannot install updates', async () => {
    setPlatform('darwin')
    await writeMetadata(false)
    await startUpdates()
    answer(0)
    await offer()
    expect(mocks.shell.openExternal).toHaveBeenCalledWith(feeds[0].page)
    expect(mocks.autoUpdater.downloadUpdate).not.toHaveBeenCalled()
  })
})
