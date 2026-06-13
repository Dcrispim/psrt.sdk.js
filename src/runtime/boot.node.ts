import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

function wasmDir(): string {
  let dir = dirname(fileURLToPath(import.meta.url))
  for (;;) {
    const candidate = join(dir, 'wasm', 'psrt.wasm')
    if (existsSync(candidate)) {
      return join(dir, 'wasm')
    }
    const parent = dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }
  throw new Error('PSRT core binary not found')
}

export async function loadGoRuntimeNode(): Promise<void> {
  if (typeof globalThis.Go !== 'undefined') {
    return
  }
  const scriptPath = join(wasmDir(), 'wasm_exec.js')
  await import(pathToFileURL(scriptPath).href)
}

export async function loadCoreBytesNode(): Promise<ArrayBuffer> {
  const bytes = readFileSync(join(wasmDir(), 'psrt.wasm'))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
