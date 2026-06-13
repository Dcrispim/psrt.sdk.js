import { invokeDocMutation } from '../wasm.js'
import type { PositionFields, PsrtDocument, PsrtStyle, PsrtText } from '../types.js'

export function setTextStyle(
  doc: PsrtDocument,
  pageName: string,
  textIndex: number,
  key: string,
  value: string,
  partial?: PsrtStyle
): PsrtDocument {
  return invokeDocMutation('setTextStyle', doc, pageName, textIndex, key, value, partial)
}

export function removeTextStyleKey(
  doc: PsrtDocument,
  pageName: string,
  textIndex: number,
  key: string
): PsrtDocument {
  return invokeDocMutation('removeTextStyleKey', doc, pageName, textIndex, key)
}

export function setTextContent(
  doc: PsrtDocument,
  pageName: string,
  index: number,
  newContent: string,
  appendContent = false
): PsrtDocument {
  return invokeDocMutation('setTextContent', doc, pageName, index, newContent, appendContent)
}

export function addText(
  doc: PsrtDocument,
  pageName: string,
  text: PsrtText,
  beforeIndex = -1,
  afterIndex = -1
): PsrtDocument {
  return invokeDocMutation('addText', doc, pageName, text, beforeIndex, afterIndex)
}

export function removeText(doc: PsrtDocument, pageName: string, textIndex: number): PsrtDocument {
  return invokeDocMutation('removeText', doc, pageName, textIndex)
}

export function reorderTextRelative(
  doc: PsrtDocument,
  pageName: string,
  textIndex: number,
  beforeIndex = -1,
  afterIndex = -1
): PsrtDocument {
  return invokeDocMutation('reorderTextRelative', doc, pageName, textIndex, beforeIndex, afterIndex)
}

export function reorderTextTo(
  doc: PsrtDocument,
  pageName: string,
  textIndex: number,
  to: number
): PsrtDocument {
  return invokeDocMutation('reorderTextTo', doc, pageName, textIndex, to)
}

export function reorderTextByDelta(
  doc: PsrtDocument,
  pageName: string,
  textIndex: number,
  delta: number
): PsrtDocument {
  return invokeDocMutation('reorderTextByDelta', doc, pageName, textIndex, delta)
}

export function setTextPosition(
  doc: PsrtDocument,
  pageName: string,
  textIndex: number,
  pos: PositionFields
): PsrtDocument {
  return invokeDocMutation('setTextPosition', doc, pageName, textIndex, pos)
}

export function nudgeTextPosition(
  doc: PsrtDocument,
  pageName: string,
  textIndex: number,
  delta: PositionFields
): PsrtDocument {
  return invokeDocMutation('nudgeTextPosition', doc, pageName, textIndex, delta)
}
