import { defineConfig } from 'vitest/config'

// Windows stay hidden only on a developer's machine, so a run leaves their screen and focus alone.
// CI shows them, and Linux always runs on a virtual display that nobody sees.
const showsWindow = process.platform === 'linux' || Boolean(process.env.CI)

// Launches the built app, so plain `vitest run` and `vitest related` never pick it up. It skips
// the shared test isolation: Electron keeps the machine's directories; the test sets its userData.
export default defineConfig({
  test: {
    name: 'desktop-e2e',
    root: import.meta.dirname,
    include: ['tests/e2e/**/*.test.ts'],
    fileParallelism: false,
    // The test launches the app with these variables.
    env: showsWindow ? {} : { CHORUS_HIDE_WINDOWS: '1' },
    tags: [
      {
        name: 'hidden-window',
        description: 'Checks that the app keeps its window hidden.',
        skip: showsWindow,
      },
      {
        name: 'os-sandbox',
        description: 'Checks the sandbox state the operating system reports for each renderer.',
        // Electron reports whether a process is sandboxed only on macOS and Windows.
        skip: process.platform === 'linux',
      },
    ],
  },
})
