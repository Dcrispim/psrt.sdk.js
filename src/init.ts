import { bootCore } from './runtime/boot.node-entry.js'
import type { InitOptions } from './types.js'

/** Initializes PSRT. Call once at app startup before any other SDK API. */
export async function initPsrt(options?: InitOptions): Promise<void> {
  await bootCore(options)
}
