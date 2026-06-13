import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setWasmExports, wireWasmFromGlobal } from '../wasm.js'

declare class Go {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
}

let bootPromise: Promise<void> | null = null

export function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node)
}

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

function waitForExports(): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const tick = (): void => {
      if ((globalThis as { psrtWasm?: unknown }).psrtWasm) {
        resolve()
        return
      }
      attempts++
      if (attempts > 200) {
        reject(new Error('timeout loading PSRT core'))
        return
      }
      setTimeout(tick, 10)
    }
    tick()
  })
}

async function loadGoRuntime(): Promise<void> {
  if (typeof (globalThis as { Go?: unknown }).Go !== 'undefined') {
    return
  }
  const scriptPath = join(wasmDir(), 'wasm_exec.js')
  await import(pathToFileURL(scriptPath).href)
}

async function loadCoreBytes(): Promise<ArrayBuffer> {
  if (isNodeRuntime()) {
    const bytes = readFileSync(join(wasmDir(), 'psrt.wasm'))
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  }
  const url = new URL('../../wasm/psrt.wasm', import.meta.url).href
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`failed to load PSRT core (${response.status})`)
  }
  return response.arrayBuffer()
}

async function startCore(bytes: ArrayBuffer): Promise<void> {
  await loadGoRuntime()
  const go = new Go()
  const { instance } = await WebAssembly.instantiate(bytes, go.importObject)
  void go.run(instance)
  await waitForExports()
  wireWasmFromGlobal()
}

/** Loads the PSRT core once. */
export async function bootCore(): Promise<void> {
  if (bootPromise) {
    return bootPromise
  }
  if ((globalThis as { psrtWasm?: unknown }).psrtWasm) {
    wireWasmFromGlobal()
    return
  }
  bootPromise = (async () => {
    const bytes = await loadCoreBytes()
    await startCore(bytes)
  })()
  return bootPromise
}

/** @internal Test hook — inject pre-started core exports. */
export function attachCoreExports(
  exports: Record<string, (...args: unknown[]) => unknown>,
): void {
  setWasmExports(exports as Record<string, (...args: unknown[]) => import('../types.js').WasmResult>)
}
