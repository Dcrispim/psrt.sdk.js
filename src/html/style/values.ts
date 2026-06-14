import {
  KeyBlur,
  KeyBlurBottom,
  KeyBlurLeft,
  KeyBlurRight,
  KeyBlurTop,
  KeyBorderBottomLeftRadius,
  KeyBorderBottomRightRadius,
  KeyBorderRadius,
  KeyBorderTopLeftRadius,
  KeyBorderTopRightRadius,
  KeyBorderWidth,
  KeyHeight,
  KeyLetterSpacing,
  KeyLineHeight,
  KeyPadding,
  KeyPaddingBottom,
  KeyPaddingLeft,
  KeyPaddingRight,
  KeyPaddingTop,
  KeyStrokeWidth,
  KeyTextIndent,
  KeyWidth,
  KeyWordSpacing,
} from './keys.js'

export function stringifyCSSValue(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'number') return formatJSONNumber(raw)
  if (typeof raw === 'boolean') return raw ? '1' : '0'
  return JSON.stringify(raw).trim()
}

function formatJSONNumber(value: number): string {
  if (Math.abs(value - Math.trunc(value)) < 1e-9 && Math.abs(value) < 1e12) {
    return String(Math.trunc(value))
  }
  return value.toString()
}

export function sanitizeCSSValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.replaceAll(';', '')
}

export function hasStyleValue(key: string, raw: unknown): boolean {
  if (raw === null || raw === undefined) return false
  if (typeof raw === 'boolean') return raw

  const value = sanitizeCSSValue(stringifyCSSValue(raw))
  if (!value) return false
  if (omitZeroForKey(key) && isZeroLikeCSSValue(value)) return false
  return true
}

function omitZeroForKey(key: string): boolean {
  switch (key) {
    case KeyHeight:
    case KeyWidth:
    case KeyPadding:
    case KeyPaddingTop:
    case KeyPaddingRight:
    case KeyPaddingBottom:
    case KeyPaddingLeft:
    case KeyBorderWidth:
    case KeyStrokeWidth:
    case KeyBorderRadius:
    case KeyBorderTopLeftRadius:
    case KeyBorderTopRightRadius:
    case KeyBorderBottomRightRadius:
    case KeyBorderBottomLeftRadius:
    case KeyLetterSpacing:
    case KeyWordSpacing:
    case KeyLineHeight:
    case KeyTextIndent:
    case KeyBlur:
    case KeyBlurLeft:
    case KeyBlurRight:
    case KeyBlurTop:
    case KeyBlurBottom:
      return true
    default:
      return false
  }
}

function isZeroLikeCSSValue(value: string): boolean {
  const v = value.trim().toLowerCase()
  switch (v) {
    case '0':
    case '0%':
    case '0px':
    case '0em':
    case '0rem':
    case '0pt':
    case '0cqh':
    case '0ch':
    case '0vw':
    case '0vh':
    case '0vmin':
    case '0vmax':
      return true
  }

  const units = ['px', '%', 'em', 'rem', 'pt', 'cqh', 'ch']
  for (const unit of units) {
    if (!v.endsWith(unit)) continue
    const n = Number.parseFloat(v.slice(0, -unit.length))
    if (Number.isFinite(n) && n === 0) return true
  }

  const n = Number.parseFloat(v)
  return Number.isFinite(n) && n === 0
}

export function filterStyleMap(style: Record<string, unknown>): Record<string, unknown> {
  if (Object.keys(style).length === 0) return style
  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(style)) {
    if (hasStyleValue(key, raw)) {
      out[key] = raw
    }
  }
  return out
}

export function pctString(value: number): string {
  return `${value}%`
}

export function pxString(value: number): string {
  return `${value}px`
}
