import type { PsrtStyle } from '../../types.js'
import { normalizeStyle } from '../style/names.js'
import { applyPercentHandlers } from '../style/percent.js'

export function textSizeBasisPx(canvasW: number, canvasH: number): number {
  const w = canvasW
  const h = canvasH
  if (w <= 0 && h <= 0) return 1
  if (w <= 0) return h
  if (h <= 0) return w
  return w < h ? w : h
}

export function textFontSizePx(textSizePct: number, canvasW: number, canvasH: number): number {
  const px = (textSizePct / 100) * textSizeBasisPx(canvasW, canvasH)
  return px < 1 ? 1 : px
}

export function pctString(v: number): string {
  return `${v}%`
}

export interface PaddingInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export function paddingHorizontal(p: PaddingInsets): number {
  return p.left + p.right
}

export function paddingVertical(p: PaddingInsets): number {
  return p.top + p.bottom
}

function cssLengthToPx(s: string, refFontPx: number): number {
  s = s.trim().toLowerCase()
  if (!s) return 0
  if (s.endsWith('px')) {
    const v = parseFloat(s.slice(0, -2))
    return Number.isFinite(v) ? Math.max(0, v) : 0
  }
  if (s.endsWith('em')) {
    const v = parseFloat(s.slice(0, -2))
    return Number.isFinite(v) ? Math.max(0, v * refFontPx) : 0
  }
  if (s.endsWith('%')) return 0
  const v = parseFloat(s)
  return Number.isFinite(v) ? Math.max(0, v) : 0
}

function rawStringProp(m: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = m[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
  }
  return ''
}

function cssColorFromRaw(v: unknown): string {
  if (typeof v === 'string' && v.trim()) return v.trim().replace(/;/g, '')
  return ''
}

export function backgroundColorFromStyle(style: PsrtStyle): string {
  const m = normalizeStyle(style)
  if (!m) return ''
  for (const key of ['backGround', 'background', 'backgroundColor']) {
    const c = cssColorFromRaw(m[key])
    if (c) return c
  }
  return ''
}

function parsePaddingCSS(css: string, refFontPx: number): PaddingInsets {
  css = css.trim()
  if (!css) return { top: 0, right: 0, bottom: 0, left: 0 }
  const parts = css.split(/\s+/)
  const vals = parts.map((p) => cssLengthToPx(p, refFontPx))
  switch (vals.length) {
    case 1:
      return { top: vals[0], right: vals[0], bottom: vals[0], left: vals[0] }
    case 2:
      return { top: vals[0], right: vals[1], bottom: vals[0], left: vals[1] }
    case 3:
      return { top: vals[0], right: vals[1], bottom: vals[2], left: vals[1] }
    default:
      return { top: vals[0], right: vals[1], bottom: vals[2], left: vals[3] }
  }
}

export function styleResolvedForCanvas(
  style: PsrtStyle,
  canvasW: number,
  canvasH: number,
  fontPx: number,
): Record<string, unknown> {
  const m = normalizeStyle(style)
  if (!m) return {}
  return applyPercentHandlers(m, { w: canvasW, h: canvasH, fontSizePx: fontPx, zoom: 1 })
}

export function textBoxInsetsForCanvas(
  style: PsrtStyle,
  refFontPx: number,
  canvasW: number,
  canvasH: number,
): PaddingInsets {
  const m = styleResolvedForCanvas(style, canvasW, canvasH, refFontPx)
  const padding = parsePaddingCSS(rawStringProp(m, 'padding'), refFontPx)
  let borderW = rawStringProp(m, 'borderWidth')
  if (!borderW && typeof m.border === 'string') {
    borderW = m.border.split(/\s+/)[0] ?? ''
  }
  const px = cssLengthToPx(borderW, refFontPx)
  const border =
    px > 0 ? { top: px, right: px, bottom: px, left: px } : { top: 0, right: 0, bottom: 0, left: 0 }
  return {
    top: padding.top + border.top,
    right: padding.right + border.right,
    bottom: padding.bottom + border.bottom,
    left: padding.left + border.left,
  }
}

export function explicitHeightPx(
  style: PsrtStyle,
  canvasW: number,
  canvasH: number,
  fontPx: number,
): { px: number; ok: boolean } {
  if (canvasH < 1) return { px: 0, ok: false }
  const m = styleResolvedForCanvas(style, canvasW, canvasH, fontPx)
  const val = rawStringProp(m, 'height')
  if (!val) return { px: 0, ok: false }
  if (val.endsWith('%')) {
    const pct = parseFloat(val.slice(0, -1))
    if (!Number.isFinite(pct) || pct <= 0) return { px: 0, ok: false }
    return { px: Math.round((canvasH * pct) / 100), ok: true }
  }
  if (val.endsWith('px')) {
    const px = parseFloat(val.slice(0, -2))
    if (!Number.isFinite(px) || px < 1) return { px: 0, ok: false }
    return { px: Math.round(px), ok: true }
  }
  if (val.endsWith('em') || val.endsWith('rem')) {
    const suffix = val.endsWith('rem') ? 'rem' : 'em'
    const n = parseFloat(val.slice(0, -suffix.length))
    if (!Number.isFinite(n) || n <= 0 || fontPx <= 0) return { px: 0, ok: false }
    return { px: Math.round(n * fontPx), ok: true }
  }
  const n = parseFloat(val)
  if (Number.isFinite(n) && n > 0) return { px: Math.round(n), ok: true }
  return { px: 0, ok: false }
}

export function textLayerNeedsComputedHeight(
  style: PsrtStyle,
  canvasW: number,
  canvasH: number,
  textSize: number,
): boolean {
  const fontPx = textFontSizePx(textSize, canvasW, canvasH)
  if (explicitHeightPx(style, canvasW, canvasH, fontPx).ok) return true
  return paddingVertical(textBoxInsetsForCanvas(style, fontPx, canvasW, canvasH)) > 0
}

export function fontWeightIsBold(style: PsrtStyle): boolean {
  const m = normalizeStyle(style)
  if (!m) return false
  const w = rawStringProp(m, 'fontWeight', 'font-weight').toLowerCase()
  if (['bold', 'bolder', '600', '700', '800', '900'].includes(w)) return true
  const n = parseInt(w, 10)
  return Number.isFinite(n) && n >= 600
}

export function lineHeightMultiplier(style: PsrtStyle, fontSizePx: number): number {
  const def = 1.2
  const m = normalizeStyle(style)
  if (!m) return def
  const raw = m.lineHeight
  if (typeof raw === 'number' && raw > 0) return raw
  const val = typeof raw === 'string' ? raw.trim() : ''
  if (!val) return def
  if (val.endsWith('%')) {
    const pct = parseFloat(val.slice(0, -1))
    if (Number.isFinite(pct) && pct > 0) return pct / 100
    return def
  }
  if (val.endsWith('px')) {
    const px = parseFloat(val.slice(0, -2))
    if (Number.isFinite(px) && px > 0 && fontSizePx > 0) return px / fontSizePx
    return def
  }
  const v = parseFloat(val)
  return Number.isFinite(v) && v > 0 ? v : def
}
