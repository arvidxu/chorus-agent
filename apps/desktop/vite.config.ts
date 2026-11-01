import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  root: 'src/renderer',
  base: './',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: 'content-security-policy',
      transformIndexHtml: (_html, { server }) => [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: server
              ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:"
              : "default-src 'self'; script-src 'self'; img-src 'self' data:; font-src 'self' data:",
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
})
