import wasmBytes from '../../wasm/psrt.wasm'
import '../../wasm/wasm_exec.js'

export async function loadGoRuntimeBrowser(): Promise<void> {
  if (typeof globalThis.Go === 'undefined') {
    throw new Error('PSRT Go runtime failed to load')
  }
}

export function loadCoreBytesBrowser(): ArrayBuffer {
  return wasmBytes.buffer.slice(
    wasmBytes.byteOffset,
    wasmBytes.byteOffset + wasmBytes.byteLength,
  )
}
