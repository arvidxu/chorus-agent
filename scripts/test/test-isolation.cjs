const { spawn } = require('node:child_process')
const { mkdirSync, mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')

const watchdogSource = `
const { rmSync } = require('node:fs')
const parent = Number(process.argv[1])
const root = process.argv[2]
const timer = setInterval(() => {
  try {
    process.kill(parent, 0)
  } catch (error) {
    if (error.code !== 'ESRCH') {
      return
    }
    clearInterval(timer)
    rmSync(root, { recursive: true, force: true })
  }
}, 1000)
`

function isolateTestEnvironment() {
  const root = mkdtempSync(join(tmpdir(), 'test-isolation-'))
  const home = join(root, 'home')
  const temp = join(root, 't')
  const runtime = join(root, 'run')
  mkdirSync(home)
  mkdirSync(temp)
  mkdirSync(runtime, { mode: 0o700 })

  const isolated = {
    HOME: home,
    USERPROFILE: home,
    APPDATA: join(home, 'AppData', 'Roaming'),
    LOCALAPPDATA: join(home, 'AppData', 'Local'),
    XDG_CONFIG_HOME: join(home, '.config'),
    XDG_DATA_HOME: join(home, '.local', 'share'),
    XDG_CACHE_HOME: join(home, '.cache'),
    XDG_STATE_HOME: join(home, '.local', 'state'),
    XDG_RUNTIME_DIR: runtime,
    TMPDIR: temp,
    TMP: temp,
    TEMP: temp,
  }
  const previous = Object.fromEntries(Object.keys(isolated).map((key) => [key, process.env[key]]))
  Object.assign(process.env, isolated)

  const removeRoot = () => rmSync(root, { recursive: true, force: true })
  process.once('exit', removeRoot)
  const watchdog = spawn(process.execPath, ['-e', watchdogSource, String(process.pid), root], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  watchdog.unref()

  return () => {
    process.removeListener('exit', removeRoot)
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key]
        continue
      }
      process.env[key] = value
    }
    removeRoot()
    watchdog.kill()
  }
}

module.exports = { isolateTestEnvironment }
