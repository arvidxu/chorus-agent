import { app, BrowserWindow, nativeTheme, net, protocol, session } from 'electron'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const rendererRoot = join(__dirname, '../renderer')
const rendererUrl = 'app://bundle/index.html'

const devServerUrl = app.isPackaged ? undefined : process.env.VITE_DEV_SERVER_URL
const allowedNavigationOrigins = [new URL(devServerUrl ?? rendererUrl).origin]

const backgroundColor = () => (nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#fff')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function createWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    backgroundColor: backgroundColor(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
    },
  })

  window.once('ready-to-show', () => window.show())
  window.loadURL(devServerUrl ?? rendererUrl)
}

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event) => {
    const parsedUrl = new URL(event.url)

    if (!allowedNavigationOrigins.includes(parsedUrl.origin)) {
      event.preventDefault()
    }
  })
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { host, pathname } = new URL(request.url)
    if (host !== 'bundle') {
      return new Response('Not found', { status: 404 })
    }

    let decodedPathname: string
    try {
      decodedPathname = decodeURIComponent(pathname)
    } catch {
      return new Response('Bad request', { status: 400 })
    }

    const target = resolve(rendererRoot, `.${decodedPathname}`)
    const relativePath = relative(rendererRoot, target)
    if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return new Response('Bad request', { status: 400 })
    }

    return net
      .fetch(pathToFileURL(target).toString())
      .catch(() => new Response('Not found', { status: 404 }))
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
  session.defaultSession.setPermissionCheckHandler(() => false)

  createWindow()

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
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
