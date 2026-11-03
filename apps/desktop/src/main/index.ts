import { app, BrowserWindow, dialog, nativeTheme, net, protocol, session } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { appEntryUrl, appProtocolScheme, isAppEntry, resolveAppFile } from './appProtocol.ts'
import { requireLoopbackUrl } from './devServer.ts'
import { startUpdates } from './updates.ts'

const rendererRoot = join(__dirname, '../renderer')

const devServerUrl = app.isPackaged ? undefined : process.env.VITE_DEV_SERVER_URL

// Automated runs start the unpackaged app with CHORUS_HIDE_WINDOWS=1 so its windows stay hidden and
// out of the Dock and never take the focus; a packaged app ignores the variable.
const hidesWindows = !app.isPackaged && process.env.CHORUS_HIDE_WINDOWS === '1'
if (hidesWindows) {
  app.dock?.hide()
  // Electron reports an uncaught error in a dialog, which would appear on the screen.
  process.on('uncaughtException', (error) => {
    console.error(error)
    app.exit(1)
  })
}

const backgroundColor = () => (nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#fff')

protocol.registerSchemesAsPrivileged([
  {
    scheme: appProtocolScheme,
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
])

// With a dev server the window shows its pages; without one, only the app's entry page.
function isAppPage(url: string) {
  if (devServerUrl !== undefined) {
    return URL.canParse(url) && new URL(url).origin === new URL(devServerUrl).origin
  }
  return isAppEntry(url)
}

// A window that cannot load leaves nothing on screen, so the app reports the error and exits.
// The dialog would block the exit that the release check relies on in CI.
function reportStartupFailure(error: unknown) {
  console.error(`${app.name} could not open its main window.`, error)
  if (process.env.CI === undefined && !hidesWindows) {
    dialog.showErrorBox(`${app.name} could not start`, String(error))
  }
  app.exit(1)
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    center: true,
    show: false,
    backgroundColor: backgroundColor(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
    },
  })

  window.once('ready-to-show', () => {
    if (!hidesWindows) {
      window.show()
    }
  })
  window.loadURL(devServerUrl ?? appEntryUrl).catch(reportStartupFailure)
}

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event) => {
    if (!isAppPage(event.url)) {
      event.preventDefault()
    }
  })
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

function start() {
  if (devServerUrl !== undefined) {
    requireLoopbackUrl(devServerUrl)
  }

  protocol.handle(appProtocolScheme, (request) => {
    const result = resolveAppFile(rendererRoot, request.url)
    if ('status' in result) {
      return new Response(result.status === 404 ? 'Not found' : 'Bad request', {
        status: result.status,
      })
    }
    return net
      .fetch(pathToFileURL(result.file).toString())
      .catch(() => new Response('Not found', { status: 404 }))
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
  session.defaultSession.setPermissionCheckHandler(() => false)
  // USB, HID and serial devices are denied as well.
  session.defaultSession.setDevicePermissionHandler(() => false)

  createWindow()
  startUpdates().catch((error) => console.error('Could not start update checks:', error))

  nativeTheme.on('updated', () => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.setBackgroundColor(backgroundColor())
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Opening the app again brings the running window to the front instead of starting a second copy.
if (app.requestSingleInstanceLock()) {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (window === undefined) {
      return
    }
    if (window.isMinimized()) {
      window.restore()
    }
    window.focus()
  })
  app.whenReady().then(start).catch(reportStartupFailure)
} else {
  // Another copy holds the lock and has received this launch, so this one exits at once.
  app.exit()
}
