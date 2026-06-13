import { invokeFormatDocument, invokeParse, invokeStringify } from './wasm.js'
import type { PsrtDocument } from './types.js'

/** Converts a .psrt string into a typed PsrtDocument. */
export function parse(psrtString: string): PsrtDocument {
  return invokeParse(psrtString)
}

/** Converts a PsrtDocument back to normative .psrt text. */
export function stringify(doc: PsrtDocument): string {
  return invokeStringify(doc)
}

/** Formats a document with editor cleanup rules. */
export function formatDocument(doc: PsrtDocument): string {
  return invokeFormatDocument(doc)
}
