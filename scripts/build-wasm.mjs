#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const wasmDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'wasm')
mkdirSync(wasmDir, { recursive: true })

const build = spawnSync(
  'go',
  ['build', '-ldflags=-s -w', '-o', join(wasmDir, 'psrt.wasm'), './cmd/psrt-wasm'],
  { cwd: root, env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' }, stdio: 'inherit' }
)
if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const goroot = spawnSync('go', ['env', 'GOROOT'], { cwd: root, encoding: 'utf8' })
const gorootPath = goroot.stdout.trim()
const candidates = [
  join(gorootPath, 'lib', 'wasm', 'wasm_exec.js'),
  join(gorootPath, 'misc', 'wasm', 'wasm_exec.js'),
]
let copied = false
for (const src of candidates) {
  try {
    copyFileSync(src, join(wasmDir, 'wasm_exec.js'))
    copied = true
    break
  } catch {
    // try next
  }
}
if (!copied) {
  console.warn('wasm_exec.js not found in GOROOT; download from golang/go lib/wasm if needed')
}

console.log('Built', join(wasmDir, 'psrt.wasm'))
