import { setWasmExports, wireWasmFromGlobal } from '../wasm.js'
import { loadCoreBytesBrowser, loadGoRuntimeBrowser } from './boot.browser.js'

declare class Go {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
}

let bootPromise: Promise<void> | null = null

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

async function startCore(bytes: ArrayBuffer): Promise<void> {
  await loadGoRuntimeBrowser()
  const go = new Go()
  const { instance } = await WebAssembly.instantiate(bytes, go.importObject)
  void go.run(instance)
  await waitForExports()
  wireWasmFromGlobal()
}

/** Loads the PSRT core once (browser). */
export async function bootCore(): Promise<void> {
  if (bootPromise) {
    return bootPromise
  }
  if ((globalThis as { psrtWasm?: unknown }).psrtWasm) {
    wireWasmFromGlobal()
    return
  }
  bootPromise = (async () => {
    const bytes = loadCoreBytesBrowser()
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
