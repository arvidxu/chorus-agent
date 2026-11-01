import { builtinModules } from 'node:module'
import { defaultServerConditions, defaultServerMainFields, defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  publicDir: false,
  resolve: {
    conditions: [...defaultServerConditions],
    mainFields: [...defaultServerMainFields],
  },
  build: {
    outDir: 'out/main',
    emptyOutDir: true,
    minify: mode === 'production',
    sourcemap: mode === 'development' ? 'inline' : false,
    lib: {
      entry: 'src/main/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.cjs',
    },
    rolldownOptions: {
      external: ['electron', ...builtinModules.flatMap((name) => [name, `node:${name}`])],
    },
  },
}))
