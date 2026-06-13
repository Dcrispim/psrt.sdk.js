import { invokeDocQuery, invokeRaw } from '../wasm.js'
import type { PsrtDocument, PsrtMask, PsrtPage, PsrtText } from '../types.js'

export function findPage(doc: PsrtDocument, name: string): PsrtPage {
  return invokeDocQuery<PsrtPage>('findPage', doc, name)
}

export function findPageIndex(doc: PsrtDocument, name: string): number {
  return invokeDocQuery<{ index: number }>('findPageIndex', doc, name).index
}

export function findTextByIndex(doc: PsrtDocument, pageName: string, index: number): PsrtText {
  return invokeDocQuery<PsrtText>('findTextByIndex', doc, pageName, index)
}

export function findMaskByIndex(doc: PsrtDocument, pageName: string, index: number): PsrtMask {
  return invokeDocQuery<PsrtMask>('findMaskByIndex', doc, pageName, index)
}

export function parseTextIndex(s: string): number {
  return invokeRaw<{ index: number }>('parseTextIndex', s).index
}
