import { describe, expect, test } from 'vitest'
import { requireLoopbackUrl } from '../devServer.ts'

describe('requireLoopbackUrl', () => {
  test('accepts addresses on this machine', () => {
    expect(() => requireLoopbackUrl('http://localhost:5173/')).not.toThrow()
    expect(() => requireLoopbackUrl('http://127.0.0.1:5173/')).not.toThrow()
  })

  test('rejects other hosts, including ones that only look local', () => {
    for (const url of [
      'https://example.com/',
      'http://192.168.1.2:5173/',
      'http://localhost.example.com/',
      'http://127.0.0.1.example.com/',
      'http://localhost@example.com/',
    ]) {
      expect(() => requireLoopbackUrl(url)).toThrow(RangeError)
    }
  })

  test('rejects text that is not a URL', () => {
    expect(() => requireLoopbackUrl('localhost:5173')).toThrow()
    expect(() => requireLoopbackUrl('not a url')).toThrow(TypeError)
  })
})
