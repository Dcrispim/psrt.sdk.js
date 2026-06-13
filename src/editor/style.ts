import { invokeStyleMutation } from '../wasm.js'
import type { PsrtStyle } from '../types.js'

export function setStyleKey(style: PsrtStyle, key: string, value: string): PsrtStyle {
  return invokeStyleMutation('setStyleKey', style, key, value) as PsrtStyle
}

export function removeStyleKey(style: PsrtStyle, key: string): PsrtStyle {
  return invokeStyleMutation('removeStyleKey', style, key) as PsrtStyle
}

export function mergeStyle(style: PsrtStyle, partial: PsrtStyle): PsrtStyle {
  const partialBytes = new TextEncoder().encode(JSON.stringify(partial))
  return invokeStyleMutation('mergeStyle', style, partialBytes) as PsrtStyle
}
