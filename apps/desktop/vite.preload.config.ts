import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  publicDir: false,
  build: {
    outDir: 'out/preload',
    emptyOutDir: true,
    minify: mode === 'production',
    sourcemap: mode === 'development' ? 'inline' : false,
    lib: {
      entry: 'src/preload/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.cjs',
    },
    rolldownOptions: {
      external: ['electron'],
    },
  },
}))
