import { isAbsolute, relative, resolve, sep } from 'node:path'

export const appProtocolScheme = 'app'
const appProtocolHost = 'bundle'
export const appEntryUrl = `${appProtocolScheme}://${appProtocolHost}/index.html`

export type AppFile = { file: string } | { status: 400 | 404 }

// True only for the app's entry page, the one page a window may show without a dev server.
export function isAppEntry(url: string): boolean {
  if (!URL.canParse(url)) {
    return false
  }
  const parsed = new URL(url)
  return (
    parsed.protocol === `${appProtocolScheme}:` &&
    parsed.host === appProtocolHost &&
    parsed.pathname === '/index.html'
  )
}

// Maps an app:// request to a file in the renderer directory. A path that decodes to a location
// outside that directory is refused, so a page cannot read other files through the protocol.
export function resolveAppFile(rendererDirectory: string, requestUrl: string): AppFile {
  const url = new URL(requestUrl)
  if (url.host !== appProtocolHost) {
    return { status: 404 }
  }
  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return { status: 400 }
  }
  const file = resolve(rendererDirectory, `.${pathname}`)
  const pathFromRoot = relative(rendererDirectory, file)
  if (
    pathFromRoot === '' ||
    pathFromRoot === '..' ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  ) {
    return { status: 400 }
  }
  return { file }
}
