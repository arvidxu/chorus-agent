// Builds the desktop installers and checks the packaged apps.
import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import {
  desktopDir,
  product,
  env,
  releasesRepository,
  signingDir,
  outputDir,
  summary,
  hasAll,
  envWithout,
  run,
  decodeBase64,
  writeSecretFile,
  setting,
  isPositive,
  isText,
  installerPattern,
  isUpdateInfoFile,
  isUpdateFile,
} from './shared.mjs'

const signingSecrets = [
  'CSC_LINK',
  'CSC_KEY_PASSWORD',
  'WIN_CSC_LINK',
  'WIN_CSC_KEY_PASSWORD',
  'APPLE_API_KEY',
  'APPLE_API_KEY_ID',
  'APPLE_API_ISSUER',
]

export async function desktopPackage(platform) {
  const script = setting('desktop.scripts', (value) => isText(value?.[platform]))[platform]
  const certificate = {
    macOS: ['CSC_LINK', 'CSC_KEY_PASSWORD'],
    Windows: ['WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD'],
  }[env.RUNNER_OS]
  const signed = Boolean(certificate && hasAll(...certificate))
  const childEnv = {
    ...envWithout(signingSecrets),
    CSC_IDENTITY_AUTO_DISCOVERY: String(signed),
    RELEASES_REPOSITORY: releasesRepository,
  }
  if (signed) {
    decodeBase64(certificate[0])
    for (const name of certificate) {
      childEnv[name] = env[name]
    }
  } else if (certificate) {
    summary(`${env.RUNNER_OS} signing skipped: certificate or password is missing.`)
  }
  if (env.RUNNER_OS === 'macOS') {
    if (signed && hasAll('APPLE_API_KEY', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER')) {
      const keyPath = join(signingDir(), 'desktop-AuthKey.p8')
      writeSecretFile(keyPath, decodeBase64('APPLE_API_KEY'))
      Object.assign(childEnv, {
        APPLE_API_KEY: keyPath,
        APPLE_API_KEY_ID: env.APPLE_API_KEY_ID,
        APPLE_API_ISSUER: env.APPLE_API_ISSUER,
      })
    } else {
      summary('macOS notarization skipped: signing or Apple API credentials are missing.')
    }
  }
  run('pnpm', ['run', script, '--publish', 'never', `--config.forceCodeSigning=${signed}`], {
    cwd: desktopDir,
    env: childEnv,
  })
  // The notarization key is no longer needed; the check below starts the packaged app.
  rmSync(signingDir(), { recursive: true, force: true })
  await checkDesktop()

  const dist = join(desktopDir, 'dist')
  const installers = readdirSync(dist).filter((name) => installerPattern().test(name))
  if (installers.length === 0) {
    throw new Error('No desktop installers found in apps/desktop/dist')
  }
  mkdirSync(outputDir('desktop'), { recursive: true })
  const blockmaps = installers
    .map((name) => `${name}.blockmap`)
    .filter((name) => isUpdateFile(name) && existsSync(join(dist, name)))
  // The one script builds every architecture, and electron-builder writes a single update info file
  // per system that lists them all.
  const updateInfo = readdirSync(dist).filter(isUpdateInfoFile)
  for (const name of [...installers, ...blockmaps, ...updateInfo]) {
    copyFileSync(join(dist, name), join(outputDir('desktop'), name))
  }
}

// Checks every packaged app before upload: its fuses match electron-builder.config.cjs, and every
// macOS app and the Windows app for this machine's architecture start and keep running.
async function checkDesktop() {
  const { FuseV1Options } = (await import('@electron/fuses')).default
  // The package has no exports map; its constants are the sentinel and states it writes with.
  const { FuseState, SENTINEL } = (await import('@electron/fuses/dist/constants.js')).default
  const { electronFuses, linux } = createRequire(import.meta.url)(
    join(desktopDir, 'electron-builder.config.cjs'),
  )
  const expected = Object.entries(electronFuses)
    .filter(([option]) => option !== 'resetAdHocDarwinSignature')
    .map(([option, isEnabled]) => [option.charAt(0).toUpperCase() + option.slice(1), isEnabled])
  const startupSeconds = setting('desktop.checkStartupSeconds', isPositive)
  const stopSeconds = setting('desktop.checkStopSeconds', isPositive)

  const wrongFuses = (fuseFile) => {
    const binary = readFileSync(fuseFile)
    const wires = []
    for (let at = binary.indexOf(SENTINEL); at !== -1; at = binary.indexOf(SENTINEL, at + 1)) {
      wires.push(at + SENTINEL.length + 2)
    }
    if (wires.length === 0) {
      return ['no fuse wire was found']
    }
    // A universal macOS binary holds one wire per architecture: after the sentinel come a version
    // byte, a length byte, and one state byte per fuse.
    return wires.flatMap((wire, slice) =>
      expected
        .filter(
          ([fuse, isEnabled]) =>
            binary[wire + FuseV1Options[fuse]] !==
            (isEnabled ? FuseState.ENABLE : FuseState.DISABLE),
        )
        .map(
          ([fuse, isEnabled]) =>
            `${fuse} should be ${isEnabled ? 'on' : 'off'} in wire ${slice + 1}`,
        ),
    )
  }

  const stop = (child) => {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      return
    }
    const signal = (name) => {
      try {
        process.kill(-child.pid, name)
      } catch {
        // The process group has already exited.
      }
    }
    signal('SIGTERM')
    setTimeout(() => signal('SIGKILL'), (stopSeconds / 2) * 1000).unref()
  }

  // Resolves with a reason only if the app stopped by itself within startupSeconds.
  const runApp = (executable) =>
    new Promise((resolvePromise, reject) => {
      const child = spawn(executable, [], {
        env: envWithout(signingSecrets),
        stdio: ['ignore', 'ignore', 'pipe'],
        detached: process.platform !== 'win32',
      })
      let errorOutput = ''
      child.stderr.on('data', (chunk) => {
        errorOutput = `${errorOutput}${chunk}`.slice(-2000)
      })
      let isStopping = false
      const startupTimer = setTimeout(() => {
        isStopping = true
        stop(child)
        setTimeout(
          () => reject(new Error(`${executable} kept running after it was asked to stop`)),
          stopSeconds * 1000,
        ).unref()
      }, startupSeconds * 1000)
      child.on('error', (error) => {
        clearTimeout(startupTimer)
        resolvePromise({ reason: error.message, errorOutput })
      })
      child.on('exit', (code, signal) => {
        clearTimeout(startupTimer)
        resolvePromise({
          reason: isStopping ? undefined : (signal ?? `exit code ${code}`),
          errorOutput,
        })
      })
    })

  // electron-builder leaves each unpacked app in dist/. Linux apps are not started: their sandbox
  // helper is set up at install time.
  const dist = join(desktopDir, 'dist')
  const folders = existsSync(dist) ? readdirSync(dist) : []
  let apps
  if (process.platform === 'darwin') {
    apps = folders
      .filter((folder) => folder.startsWith('mac'))
      .map((folder) => join(dist, folder, `${product.name}.app`))
      .filter((app) => existsSync(app))
      .map((app) => ({
        app,
        fuseFile: join(app, 'Contents/Frameworks/Electron Framework.framework/Electron Framework'),
        executable: join(app, 'Contents/MacOS', product.name),
      }))
  } else {
    const [prefix, executable] =
      process.platform === 'win32'
        ? ['win', `${product.name}.exe`]
        : ['linux', linux.executableName]
    const hostFolder =
      process.arch === 'x64' ? `${prefix}-unpacked` : `${prefix}-${process.arch}-unpacked`
    apps = folders
      .filter((folder) => new RegExp(`^${prefix}(-[a-z0-9]+)?-unpacked$`).test(folder))
      .map((folder) => ({
        app: join(dist, folder, executable),
        fuseFile: join(dist, folder, executable),
        executable:
          prefix === 'win' && folder === hostFolder ? join(dist, folder, executable) : undefined,
      }))
  }
  if (apps.length === 0) {
    throw new Error(`No unpacked ${product.name} app was found in ${dist}`)
  }
  for (const { app, fuseFile, executable } of apps) {
    const wrong = wrongFuses(fuseFile)
    if (wrong.length > 0) {
      throw new Error(`${app} does not match electronFuses: ${wrong.join(', ')}`)
    }
    const { reason, errorOutput } = executable === undefined ? {} : await runApp(executable)
    if (reason !== undefined) {
      throw new Error(
        `${app} stopped within ${startupSeconds} seconds of starting (${reason}): ${errorOutput.trim() || '(no error output)'}`,
      )
    }
    summary(
      `${app}: fuses as configured${executable === undefined ? '; not started on this machine' : `; kept running for ${startupSeconds} seconds`}.`,
    )
  }
}
