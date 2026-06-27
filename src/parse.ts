import {
  invokeConvertLegacyDocument,
  invokeFormatDocument,
  invokeLoadSource,
  invokeParse,
  invokeParseFast,
  invokeStringify,
} from './wasm.js'
import type { PsrtDocument } from './types.js'

/** Converts a .psrt string into a typed PsrtDocument. */
export function parse(psrtString: string): PsrtDocument {
  return invokeParse(psrtString)
}

/**
 * Rewrites raw .psrt text written before the comma coordinate separator
 * (hyphen-separated >>/==/~~ headers, e.g. `>>50-50-80-2`) into the current
 * grammar (`>>50,50,80,2`), so it can be fed into parse()/parseFast(). The
 * legacy format never supported negative coordinates, so this is a
 * straight separator swap with no sign ambiguity to resolve.
 */
export function convertLegacyDocument(raw: string): string {
  return invokeConvertLegacyDocument(raw)
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
