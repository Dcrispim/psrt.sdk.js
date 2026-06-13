import { invokeRaw, invokeText } from './wasm.js'
import type { PsrtDocument } from './types.js'

export interface WebPreviewStyle {
  container: Record<string, string>
  text: Record<string, string>
  hasStroke: boolean
}

/** Adapts text/mask entries for live web preview CSS (percent → px, stroke → WebKit, etc.). */
export function adaptEntriesForWeb(
  entriesJSON: string,
  canvasW: number,
  canvasH: number,
  zoom: number,
): WebPreviewStyle[] {
  return invokeRaw<WebPreviewStyle[]>('adaptEntriesForWeb', entriesJSON, canvasW, canvasH, zoom)
}

/** Applies a page PSRT fragment into a full document. */
export function mergePageDocumentPSRT(
  fullDocJSON: string,
  pageName: string,
  psrtText: string,
): PsrtDocument {
  const json = invokeText('mergePageDocumentPSRT', fullDocJSON, pageName, psrtText)
  return JSON.parse(json) as PsrtDocument
}

/** Formats one page plus document fonts and constants as PSRT text. */
export function formatPageDocumentJSON(docJSON: string, pageName: string): string {
  return invokeText('formatPageDocumentJSON', docJSON, pageName)
}
