import { invokeDocMutation } from '../wasm.js'
import type { PsrtDocument } from '../types.js'

export function addFont(doc: PsrtDocument, url: string): PsrtDocument {
  return invokeDocMutation('addFont', doc, url)
}

export function removeFont(doc: PsrtDocument, url: string): PsrtDocument {
  return invokeDocMutation('removeFont', doc, url)
}
