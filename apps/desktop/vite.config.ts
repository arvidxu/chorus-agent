import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const { name } = JSON.parse(
  readFileSync(new URL('../../product.conf.json', import.meta.url), 'utf8'),
)

// The dev server's scripts carry a nonce instead of allowing every inline script, and its hot reload
// connects over a local WebSocket.
const contentSecurityPolicy = (devServerNonce: string | undefined) =>
  [
    "default-src 'self'",
    devServerNonce === undefined
      ? "script-src 'self'"
      : `script-src 'self' 'nonce-${devServerNonce}'`,
    devServerNonce === undefined ? "style-src 'self'" : "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    devServerNonce === undefined
      ? "connect-src 'self'"
      : "connect-src 'self' ws://localhost:* ws://127.0.0.1:*",
    "object-src 'none'",
    "base-uri 'none'",
  ].join('; ')

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const devServerNonce = command === 'serve' ? randomBytes(16).toString('base64') : undefined
  return {
    root: 'src/renderer',
    html: { cspNonce: devServerNonce },
    base: './',
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      {
        // The window title is the product name from product.conf.json.
        name: 'product-name',
        transformIndexHtml: () => [{ tag: 'title', children: name, injectTo: 'head' }],
      },
      {
        name: 'content-security-policy',
        transformIndexHtml: () => [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: contentSecurityPolicy(devServerNonce),
            },
            injectTo: 'head-prepend',
          },
        ],
      },
    ],
    build: {
      outDir: '../../out/renderer',
      emptyOutDir: true,
    },
  }
})
