import { bootCore } from './runtime/boot.browser-entry.js'

/** Initializes PSRT. Call once at app startup before any other SDK API. */
export async function initPsrt(): Promise<void> {
  await bootCore()
}
