import { invokeFormatDocument, invokeLoadSource, invokeParse, invokeParseFast, invokeStringify } from './wasm.js'
import type { PsrtDocument } from './types.js'

/** Converts a .psrt string into a typed PsrtDocument. */
export function parse(psrtString: string): PsrtDocument {
  return invokeParse(psrtString)
}

/** Parses without loading $SOURCE payloads (keys only). */
export function parseFast(psrtString: string): PsrtDocument {
  return invokeParseFast(psrtString)
}

/** Loads one embedded asset from raw PSRT text. */
export function loadSource(raw: string, url: string): string {
  return invokeLoadSource(raw, url)
}

/** Converts a PsrtDocument back to normative .psrt text. */
export function stringify(doc: PsrtDocument): string {
  return invokeStringify(doc)
}

/** Formats a document with editor cleanup rules. */
export function formatDocument(doc: PsrtDocument): string {
  return invokeFormatDocument(doc)
}
