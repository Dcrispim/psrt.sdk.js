import { KeyStroke, KeyStrokeColor, KeyStrokeWidth } from './keys.js'
import type { StyleFragment } from './fragment.js'
import { setFragmentValue } from './fragment.js'
import { stringifyCSSValue } from './values.js'

export function applyStrokeHTML(span: StyleFragment | null | undefined, style: Record<string, unknown>): void {
  if (!span) return

  const stroke = stringifyCSSValue(style[KeyStroke])
  if (stroke) {
    setFragmentValue(span, 'WebkitTextStroke', stroke)
  }
  const strokeWidth = stringifyCSSValue(style[KeyStrokeWidth])
  if (strokeWidth) {
    setFragmentValue(span, 'WebkitTextStrokeWidth', strokeWidth)
  }
  const strokeColor = stringifyCSSValue(style[KeyStrokeColor])
  if (strokeColor) {
    setFragmentValue(span, 'WebkitTextStrokeColor', strokeColor)
  }
}

export function applyStrokeSVG(host: StyleFragment | null | undefined, style: Record<string, unknown>): void {
  if (!host) return

  const stroke = stringifyCSSValue(style[KeyStroke])
  if (stroke) {
    setFragmentValue(host, '-webkit-text-stroke', stroke)
  }
  const strokeWidth = stringifyCSSValue(style[KeyStrokeWidth])
  if (strokeWidth) {
    setFragmentValue(host, '-webkit-text-stroke-width', strokeWidth)
  }
  const strokeColor = stringifyCSSValue(style[KeyStrokeColor])
  if (strokeColor) {
    setFragmentValue(host, '-webkit-text-stroke-color', strokeColor)
  }
}
