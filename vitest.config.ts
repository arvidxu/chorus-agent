import { existsSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const childDirectories = (path: string) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${path}/${entry.name}`)
    : []

// Each package under packages/<domain>/<capability-package> with a package.json is a test project.
const sharedPackages = childDirectories('packages')
  .flatMap(childDirectories)
  .filter((path) => existsSync(`${path}/package.json`))

export default defineConfig({
  test: {
    globalSetup: ['./scripts/test/vitest-global-setup.mjs'],
    projects: [
      {
        test: {
          name: 'desktop-main',
          root: './apps/desktop',
          include: ['src/main/**/*.test.ts', 'src/preload/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'desktop-renderer',
          root: './apps/desktop',
          include: ['src/renderer/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
      {
        test: {
          name: 'scripts',
          include: ['scripts/**/*.test.mjs'],
        },
      },
      ...sharedPackages,
    ],
  },
})
