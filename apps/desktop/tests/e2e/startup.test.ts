import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, type ElectronApplication, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { appEntryUrl } from '../../src/main/appProtocol.ts'

const appRoot = join(import.meta.dirname, '../..')

let userData: string | undefined
let app: ElectronApplication
let page: Page
const rendererErrors: string[] = []

beforeAll(async () => {
  // The app keeps its data and its single-instance lock here, apart from any copy the developer runs.
  // The temporary directory is reached through a symbolic link on macOS; the app reports the real path.
  userData = realpathSync(mkdtempSync(join(tmpdir(), 'desktop-e2e-')))
  app = await electron.launch({
    // Electron starts the built main script directly, as Playwright-tested apps do. It gets
    // process.env, which vitest.e2e.config.ts sets up.
    args: [join(appRoot, 'out/main/index.cjs'), `--user-data-dir=${userData}`],
  })
  page = await app.firstWindow()
  page.on('pageerror', (error) => rendererErrors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      rendererErrors.push(message.text())
    }
  })
  await page.waitForLoadState('load')
}, 60_000)

// A run must not leave the app behind, so one that does not quit when asked is killed.
afterAll(async () => {
  const child = app?.process()
  let timer: NodeJS.Timeout | undefined
  const hasQuit = await Promise.race([
    app?.close().then(
      () => true,
      () => false,
    ),
    new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), 10_000)
    }),
  ])
  clearTimeout(timer)
  if (hasQuit !== true) {
    child?.kill('SIGKILL')
  }
  if (userData !== undefined) {
    rmSync(userData, { recursive: true, force: true })
  }
}, 60_000)

describe('desktop app startup', () => {
  test('opens one window on the app entry page', () => {
    expect(app.windows()).toHaveLength(1)
    expect(page.url()).toBe(appEntryUrl)
  })

  test('renders without errors', () => {
    expect(rendererErrors).toEqual([])
  })

  test('keeps its data in the directory the run gave it', async () => {
    await expect(
      app.evaluate(({ app: electronApp }) => electronApp.getPath('userData')),
    ).resolves.toBe(userData)
  })

  test('stays hidden and out of the Dock', { tags: ['hidden-window'] }, async () => {
    const state = await app.evaluate(({ app: electronApp, BrowserWindow }) => ({
      visibleWindows: BrowserWindow.getAllWindows().filter((window) => window.isVisible()).length,
      focusedWindows: BrowserWindow.getAllWindows().filter((window) => window.isFocused()).length,
      isInDock: electronApp.dock?.isVisible() ?? false,
    }))
    expect(state).toEqual({ visibleWindows: 0, focusedWindows: 0, isInDock: false })
  })

  test('runs the renderer in a sandboxed process', { tags: ['os-sandbox'] }, async () => {
    const renderers = await app.evaluate(({ app: electronApp }) =>
      electronApp
        .getAppMetrics()
        .filter((metric) => metric.type === 'Tab')
        .map((metric) => metric.sandboxed),
    )
    expect(renderers.length).toBeGreaterThan(0)
    expect(renderers.every((isSandboxed) => isSandboxed === true)).toBe(true)
  })

  test('runs the renderer without Node.js', async () => {
    const access = await page.evaluate(() => ({
      require: typeof globalThis.require,
      process: typeof globalThis.process,
    }))
    expect(access).toEqual({ require: 'undefined', process: 'undefined' })
  })

  test('refuses to navigate away from the entry page and to open new windows', async () => {
    // The target is served by the app itself, so only the navigation guard keeps the page here.
    const elsewhere = new URL('/elsewhere.html', appEntryUrl).href
    // Records whether the guard cancelled the next navigation; this listener runs after the guard.
    await app.evaluate(({ BrowserWindow }) => {
      const [window] = BrowserWindow.getAllWindows()
      const state = globalThis as unknown as { navigationCancelled?: Promise<boolean> }
      state.navigationCancelled = new Promise((resolve) => {
        window?.webContents.once('will-navigate', (event) => resolve(event.defaultPrevented))
      })
    })
    await page.evaluate((url) => {
      window.open(url)
      window.location.href = url
    }, elsewhere)
    const navigationCancelled = await app.evaluate(
      () =>
        (globalThis as unknown as { navigationCancelled?: Promise<boolean> }).navigationCancelled,
    )
    expect(navigationCancelled).toBe(true)
    expect(page.url()).toBe(appEntryUrl)
    expect(app.windows()).toHaveLength(1)
  })
})
