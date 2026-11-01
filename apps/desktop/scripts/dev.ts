import { type ChildProcess, spawn } from 'node:child_process'
import electronPath from 'electron'
import { build, createServer } from 'vite'

const server = await createServer({ configFile: 'vite.config.ts' })
await server.listen()

const devServerUrl = server.resolvedUrls?.local[0]
if (devServerUrl === undefined) {
  await server.close()
  throw new Error('The Vite dev server did not report a local URL, so Electron was not started.')
}
process.env.VITE_DEV_SERVER_URL = devServerUrl

let electron: ChildProcess | undefined

const stop = async (code = 0) => {
  electron?.removeAllListeners('exit')
  electron?.kill()
  await server.close()
  process.exit(code)
}

const restartElectron = () => {
  electron?.removeAllListeners('exit')
  electron?.kill()
  electron = spawn(String(electronPath), ['.'], { stdio: 'inherit' })
  electron.on('exit', (code) => stop(code ?? 1))
  electron.on('error', (error) => {
    console.error(error)
    stop(1)
  })
}

const watch = (configFile: string, onBuild: () => void) =>
  new Promise<void>((resolve, reject) => {
    build({
      configFile,
      mode: 'development',
      build: { watch: {} },
      plugins: [
        {
          name: 'on-build',
          writeBundle() {
            onBuild()
            resolve()
          },
        },
      ],
    }).catch(reject)
  })

await watch('vite.preload.config.ts', () => server.ws.send({ type: 'full-reload' }))
await watch('vite.main.config.ts', restartElectron)

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
