import { invokeDocMutation } from '../wasm.js'
import type { MaskPositionFields, PsrtDocument, PsrtMask, PsrtStyle } from '../types.js'

export function setMaskPosition(
  doc: PsrtDocument,
  pageName: string,
  maskIndex: number,
  pos: MaskPositionFields
): PsrtDocument {
  const posBytes = new TextEncoder().encode(JSON.stringify(pos))
  return invokeDocMutation('setMaskPosition', doc, pageName, maskIndex, posBytes)
}

export function addMask(
  doc: PsrtDocument,
  pageName: string,
  mask: PsrtMask,
  beforeIndex = -1,
  afterIndex = -1
): PsrtDocument {
  return invokeDocMutation('addMask', doc, pageName, mask, beforeIndex, afterIndex)
}

export function removeMask(doc: PsrtDocument, pageName: string, maskIndex: number): PsrtDocument {
  return invokeDocMutation('removeMask', doc, pageName, maskIndex)
}

export function setMaskStyle(
  doc: PsrtDocument,
  pageName: string,
  maskIndex: number,
  key: string,
  value: string,
  partial?: PsrtStyle
): PsrtDocument {
  return invokeDocMutation('setMaskStyle', doc, pageName, maskIndex, key, value, partial)
}

export function removeMaskStyleKey(
  doc: PsrtDocument,
  pageName: string,
  maskIndex: number,
  key: string
): PsrtDocument {
  return invokeDocMutation('removeMaskStyleKey', doc, pageName, maskIndex, key)
}
