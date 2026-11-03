// Settings, paths, and helpers shared by the release steps.
import { execFileSync, execSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export const root = resolve(import.meta.dirname, '../..')

export const desktopDir = join(root, 'apps/desktop')

export const mobileDir = join(root, 'apps/mobile')

export const product = JSON.parse(readFileSync(join(root, 'product.conf.json'), 'utf8'))

export const settings = product.release ?? {}

export const { env } = process

export const tag = env.GITHUB_REF_NAME ?? ''

// Releases go to RELEASES_REPOSITORY when it is set.
export const separateReleases = Boolean(env.RELEASES_REPOSITORY)

export const releasesRepository = env.RELEASES_REPOSITORY || env.GITHUB_REPOSITORY

export const signingDir = () => join(env.RUNNER_TEMP, 'release-signing')

// Built files by destination: desktop installers and signed APKs go to the GitHub release, store
// packages to the stores, and test builds stay in the run's artifacts.
export const outputDir = (kind) => join(env.RUNNER_TEMP, 'release-output', kind)

// Which packages each system can build: Apple packages need macOS.
export const systems = {
  mac: { desktop: 'mac', mobile: 'ios' },
  windows: { desktop: 'windows', mobile: '' },
  linux: { desktop: 'linux', mobile: 'android' },
}

export const append = (file, line) => appendFileSync(file, `${line}\n`)

export const setOutput = (name, value) => append(env.GITHUB_OUTPUT, `${name}=${value}`)

export const setEnv = (name, value) => append(env.GITHUB_ENV, `${name}=${value}`)

export const summary = (message) => append(env.GITHUB_STEP_SUMMARY, message)

export const mask = (value) =>
  console.log(
    `::add-mask::${String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}`,
  )

export const hasAll = (...names) => names.every((name) => env[name])

export const envWithout = (names) =>
  Object.fromEntries(Object.entries(env).filter(([name]) => !names.includes(name)))

export function run(command, args, options = {}) {
  const runOptions = { stdio: 'inherit', ...options }
  // pnpm is a .cmd shim on Windows, which Node only starts through a shell.
  if (process.platform === 'win32') {
    execSync([command, ...args].join(' '), runOptions)
  } else {
    execFileSync(command, args, runOptions)
  }
}

export const capture = (command, args, input) =>
  execFileSync(command, args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] })

export function decodeBase64(name) {
  const value = (env[name] ?? '').replace(/\s+/g, '')
  if (!value || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error(`${name} must contain Base64 file contents; see .env.example`)
  }
  return Buffer.from(value, 'base64')
}

export function writeSecretFile(path, data) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, data, { mode: 0o600 })
}

export const filesIn = (dir, suffix) =>
  existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(suffix)) : []

export function onlyFile(dir, suffix) {
  const files = filesIn(dir, suffix)
  if (files.length !== 1) {
    throw new Error(`Expected one ${suffix} file in ${dir}, found ${files.length}`)
  }
  return join(dir, files[0])
}

export function moveInto(kind, source, name) {
  mkdirSync(outputDir(kind), { recursive: true })
  const target = join(outputDir(kind), name)
  renameSync(source, target)
  return target
}

// Reads release.<path> from product.conf.json and stops when it is missing or invalid.
export function setting(path, isValid) {
  const value = path.split('.').reduce((object, key) => object?.[key], settings)
  if (!isValid(value)) {
    throw new TypeError(`product.conf.json release.${path} is missing or invalid`)
  }
  return value
}

export const isText = (value) => typeof value === 'string' && value.length > 0

export const isPositive = (value) => Number.isInteger(value) && value > 0

export const isTextList = (value) => Array.isArray(value) && value.length > 0 && value.every(isText)

// A staged rollout (inProgress) would also need a user fraction, so only these two are accepted.
export const isPlayStatus = (value) => ['completed', 'draft'].includes(value)

// Machine labels per system from release.runners. The MAC_SELF_HOSTED_RUNNER repository variable
// moves the macOS jobs to the self-hosted machine with that label.
export function runnerLabels() {
  const configured = setting(
    'runners',
    (value) => value && Object.keys(systems).every((name) => isText(value[name])),
  )
  const macSelfHosted = env.MAC_SELF_HOSTED_RUNNER?.trim()
  return macSelfHosted ? { ...configured, mac: ['self-hosted', macSelfHosted] } : configured
}

export function releaseVersion() {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(tag)) {
    throw new Error(`Release tag "${tag}" must be a bare version such as 1.2.3, without a v prefix`)
  }
  return tag
}

export const isPrerelease = () => releaseVersion().split('+', 1)[0].includes('-')

// The published file endings and their labels in the release notes; all but the APK are desktop
// installers.
export const downloadFormats = [
  ['.dmg', 'DMG'],
  ['.zip', 'ZIP'],
  ['-setup.exe', 'Installer'],
  ['-portable.exe', 'Portable'],
  ['.AppImage', 'AppImage'],
  ['.deb', 'DEB'],
  ['.rpm', 'RPM'],
  ['.apk', 'APK'],
]

export const installerPattern = () => {
  const endings = downloadFormats
    .map(([ending]) => ending)
    .filter((ending) => ending !== '.apk')
    .map((ending) => ending.replaceAll('.', '\\.'))
  return new RegExp(`-(?:macos|windows|linux)-.*(?:${endings.join('|')})$`)
}

// electron-builder's update info files, which the desktop app reads to find updates.
export const isUpdateInfoFile = (name) => /^latest.*\.yml$/.test(name)

// The updater downloads only the macOS zip and the Windows installer, so only their blockmaps,
// which let it fetch just the changed parts, are published.
export const isUpdateFile = (name) =>
  isUpdateInfoFile(name) ||
  (/(\.zip|-setup\.exe)\.blockmap$/.test(name) &&
    installerPattern().test(name.slice(0, -'.blockmap'.length)))

// A test-signed APK is never published: an app installed from it cannot be updated by a later
// release signed with the real key.
export const isReleaseFile = (name) =>
  installerPattern().test(name) || /-android-.*(?<!-test)\.apk$/.test(name) || isUpdateFile(name)

// Returns undefined only when the release does not exist; any other failure stops the release.
export function viewRelease() {
  try {
    return JSON.parse(
      capture('gh', ['release', 'view', tag, '--repo', releasesRepository, '--json', 'isDraft']),
    )
  } catch (error) {
    if (String(error.stderr).includes('release not found')) {
      return undefined
    }
    throw new Error(`Could not read release ${tag} from ${releasesRepository}: ${error.stderr}`)
  }
}

export function cleanup() {
  if (env.RUNNER_OS === 'macOS') {
    // Restore the keychain search list from before iOS signing, then delete the temporary keychain.
    if (env.CI_IOS_PREVIOUS_KEYCHAINS) {
      const previousKeychains = JSON.parse(env.CI_IOS_PREVIOUS_KEYCHAINS)
      run('security', ['list-keychains', '-d', 'user', '-s', ...previousKeychains])
    }
    const keychain = join(signingDir(), 'ios.keychain-db')
    if (existsSync(keychain)) {
      run('security', ['delete-keychain', keychain])
    }
    if (env.CI_IOS_PROFILE_PATH) {
      rmSync(env.CI_IOS_PROFILE_PATH, { force: true })
    }
  }
}
