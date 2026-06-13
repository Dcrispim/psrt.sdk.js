import { invokeDocMutation } from './wasm.js'
import type { PsrtDocument } from './types.js'

/** Expands all @const@ placeholders in styles, content, and URLs. */
export function resolveDocument(doc: PsrtDocument): PsrtDocument {
  return invokeDocMutation('resolveDocument', doc)
}

/** Like resolveDocument but throws on invalid style JSON after expansion. */
export function resolveDocumentStrict(doc: PsrtDocument): PsrtDocument {
  return invokeDocMutation('resolveDocumentStrict', doc)
}
