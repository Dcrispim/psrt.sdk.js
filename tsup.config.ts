import { defineConfig } from 'tsup'

const shared = {
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: true,
  esbuildOptions(options: { loader?: Record<string, string> }) {
    options.loader = {
      ...options.loader,
      '.wasm': 'binary',
    }
  },
} as const

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    platform: 'node',
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' }
    },
  },
  {
    ...shared,
    entry: { index: 'src/index.browser.ts' },
    format: ['esm'],
    outDir: 'dist/browser',
    platform: 'browser',
    outExtension() {
      return { js: '.js' }
    },
  },
])
