import { invokeDocMutation } from '../wasm.js'
import { assertSingleShape, assertValidPathData } from '../svgPath.js'
import type { PathMaskPositionFields, PsrtDocument, PsrtPathMask, PsrtStyle } from '../types.js'

export function setPathMaskPosition(
  doc: PsrtDocument,
  pageName: string,
  maskIndex: number,
  pos: PathMaskPositionFields
): PsrtDocument {
  const posBytes = new TextEncoder().encode(JSON.stringify(pos))
  return invokeDocMutation('setPathMaskPosition', doc, pageName, maskIndex, posBytes)
}

export function addPathMask(
  doc: PsrtDocument,
  pageName: string,
  mask: PsrtPathMask,
  beforeIndex = -1,
  afterIndex = -1
): PsrtDocument {
  assertValidPathData(mask.path)
  assertSingleShape(mask.path)
  return invokeDocMutation('addPathMask', doc, pageName, mask, beforeIndex, afterIndex)
}

export function removePathMask(doc: PsrtDocument, pageName: string, maskIndex: number): PsrtDocument {
  return invokeDocMutation('removePathMask', doc, pageName, maskIndex)
}

export function setPathMaskStyle(
  doc: PsrtDocument,
  pageName: string,
  maskIndex: number,
  key: string,
  value: string,
  partial?: PsrtStyle
): PsrtDocument {
  return invokeDocMutation('setPathMaskStyle', doc, pageName, maskIndex, key, value, partial)
}

export function removePathMaskStyleKey(
  doc: PsrtDocument,
  pageName: string,
  maskIndex: number,
  key: string
): PsrtDocument {
  return invokeDocMutation('removePathMaskStyleKey', doc, pageName, maskIndex, key)
}

export function setPathMaskPath(
  doc: PsrtDocument,
  pageName: string,
  maskIndex: number,
  path: string
): PsrtDocument {
  assertValidPathData(path)
  assertSingleShape(path)
  return invokeDocMutation('setPathMaskPath', doc, pageName, maskIndex, path)
}
