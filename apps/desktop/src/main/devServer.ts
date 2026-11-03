const loopbackHosts = new Set(['localhost', '127.0.0.1'])

// A development window runs the loaded page with the app's preload script, so the address taken
// from the environment has to stay on this machine.
export function requireLoopbackUrl(url: string) {
  const { hostname } = new URL(url)
  if (!loopbackHosts.has(hostname)) {
    throw new RangeError(
      `VITE_DEV_SERVER_URL must use localhost or 127.0.0.1, but it uses ${hostname}. No page was loaded; point it at the local Vite dev server.`,
    )
  }
}
