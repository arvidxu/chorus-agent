import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { isAppEntry, resolveAppFile } from '../appProtocol.ts'

const rendererDirectory = resolve('/', 'Applications', 'Chorus.app', 'out', 'renderer')

describe('resolveAppFile', () => {
  test('maps app:// paths to files in the renderer directory', () => {
    expect(resolveAppFile(rendererDirectory, 'app://bundle/index.html')).toEqual({
      file: resolve(rendererDirectory, 'index.html'),
    })
    expect(resolveAppFile(rendererDirectory, 'app://bundle/assets/index%20a.js')).toEqual({
      file: resolve(rendererDirectory, 'assets', 'index a.js'),
    })
  })

  test('rejects paths that decode to a location outside the renderer directory', () => {
    expect(resolveAppFile(rendererDirectory, 'app://bundle/..%2F..%2Fsecret.txt')).toEqual({
      status: 400,
    })
    expect(resolveAppFile(rendererDirectory, 'app://bundle/')).toEqual({ status: 400 })
  })

  test('rejects other hosts and undecodable paths', () => {
    expect(resolveAppFile(rendererDirectory, 'app://other/index.html')).toEqual({ status: 404 })
    expect(resolveAppFile(rendererDirectory, 'app://bundle/%E0%A4%A')).toEqual({ status: 400 })
  })
})

describe('isAppEntry', () => {
  test('accepts only the entry page of the app protocol', () => {
    expect(isAppEntry('app://bundle/index.html')).toBe(true)
    expect(isAppEntry('app://bundle/other.html')).toBe(false)
    expect(isAppEntry('app://other/index.html')).toBe(false)
    expect(isAppEntry('https://example.com/index.html')).toBe(false)
    expect(isAppEntry('http://a%20b/')).toBe(false)
  })
})
