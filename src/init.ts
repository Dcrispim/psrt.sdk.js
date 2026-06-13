import { bootCore } from './runtime/boot.js'

/** Initializes PSRT. Call once at app startup before any other SDK API. */
export async function initPsrt(): Promise<void> {
  await bootCore()
}
