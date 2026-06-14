import type { PsrtStyle } from '../../types.js'
import {
  KeyAlignItems,
  KeyBackground,
  KeyBevel,
  KeyBlur,
  KeyBlurBottom,
  KeyBlurLeft,
  KeyBlurRight,
  KeyBlurTop,
  KeyBorderColor,
  KeyBorderRadius,
  KeyBorderStyle,
  KeyBorderWidth,
  KeyBoxShadow,
  KeyColor,
  KeyFontFamily,
  KeyFontStyle,
  KeyFontWeight,
  KeyGlow,
  KeyHeight,
  KeyLeft,
  KeyLetterSpacing,
  KeyLineHeight,
  KeyMatrix,
  KeyPadding,
  KeyRotate,
  KeyScale,
  KeySkew,
  KeyStroke,
  KeyStrokeColor,
  KeyStrokeWidth,
  KeyTextAlign,
  KeyTextDecoration,
  KeyTextShadow,
  KeyTop,
  KeyTransform,
  KeyTransformOrigin,
  KeyTranslate,
  KeyWidth,
  isBoxKey,
  isTextKey,
  isTransformKey,
} from './keys.js'
import { filterStyleMap } from './values.js'

const aliasToCanonical: Record<string, string> = {
  'border-radius': KeyBorderRadius,
  'border-width': KeyBorderWidth,
  'border-style': KeyBorderStyle,
  'border-color': KeyBorderColor,
  'box-shadow': KeyBoxShadow,
  'text-shadow': KeyTextShadow,
  'text-align': KeyTextAlign,
  'align-items': KeyAlignItems,
  'vertical-align': KeyAlignItems,
  'font-family': KeyFontFamily,
  'font-weight': KeyFontWeight,
  'font-style': KeyFontStyle,
  'line-height': KeyLineHeight,
  'letter-spacing': KeyLetterSpacing,
  'text-decoration': KeyTextDecoration,
  'background-color': KeyBackground,
  'stroke-width': KeyStrokeWidth,
  'stroke-color': KeyStrokeColor,
  'text-stroke': KeyStroke,
  backGround: KeyBackground,
  backgroundColor: KeyBackground,
  br: KeyBorderRadius,
  bw: KeyBorderWidth,
  bc: KeyBorderColor,
  bs: KeyBorderStyle,
  bg: KeyBackground,
  ta: KeyTextAlign,
  ts: KeyTextShadow,
  bsh: KeyBoxShadow,
  blur: KeyBlur,
  'blur-left': KeyBlurLeft,
  'blur-right': KeyBlurRight,
  'blur-top': KeyBlurTop,
  'blur-bottom': KeyBlurBottom,
  ff: KeyFontFamily,
  fw: KeyFontWeight,
  fs: KeyFontStyle,
  pd: KeyPadding,
  sw: KeyStrokeWidth,
  sc: KeyStrokeColor,
  textStroke: KeyStroke,
  textStrokeWidth: KeyStrokeWidth,
  textStrokeColor: KeyStrokeColor,
}

export function registerAlias(alias: string, canonical: string): void {
  aliasToCanonical[alias.trim()] = canonical
}

export function resolveName(raw: string): { canonical: string; ok: boolean } {
  const key = raw.trim()
  if (!key) return { canonical: '', ok: false }

  const mapped = aliasToCanonical[key]
  if (mapped) return { canonical: mapped, ok: true }

  if (key.includes('-')) {
    const camel = kebabToCamel(key)
    const mappedCamel = aliasToCanonical[camel]
    if (mappedCamel) return { canonical: mappedCamel, ok: true }
    const mappedRaw = aliasToCanonical[key]
    if (mappedRaw) return { canonical: mappedRaw, ok: true }
    return { canonical: camel, ok: isKnownCanonical(camel) }
  }

  const mappedAgain = aliasToCanonical[key]
  if (mappedAgain) return { canonical: mappedAgain, ok: true }
  return { canonical: key, ok: isKnownCanonical(key) }
}

function isKnownCanonical(name: string): boolean {
  return (
    isBoxKey(name) ||
    isTextKey(name) ||
    isTransformKey(name) ||
    name === KeyLeft ||
    name === KeyTop ||
    name === KeyWidth ||
    name === KeyHeight ||
    name === KeyGlow ||
    name === KeyBevel ||
    name === KeyBlur ||
    name === KeyBlurLeft ||
    name === KeyBlurRight ||
    name === KeyBlurTop ||
    name === KeyBlurBottom
  )
}

function kebabToCamel(value: string): string {
  const parts = value.split('-')
  if (parts.length === 0) return value
  let out = ''
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]?.trim()
    if (!part) continue
    if (i === 0) {
      out += part.toLowerCase()
      continue
    }
    out += part[0].toUpperCase() + part.slice(1).toLowerCase()
  }
  return out
}

export function normalizeStyle(style: PsrtStyle): Record<string, unknown> {
  const rawObject = parseStyleObject(style)
  if (!rawObject) return {}

  const out: Record<string, unknown> = {}
  const applyKeys = (vendorOnly: boolean): void => {
    for (const [rawKey, value] of Object.entries(rawObject)) {
      const vendor = isVendorRawKey(rawKey)
      if (vendorOnly !== vendor) continue

      const canonical = canonicalKeyForRaw(rawKey)
      if (!canonical || isVendorKey(canonical)) continue
      if (vendorOnly && Object.prototype.hasOwnProperty.call(out, canonical)) continue

      out[canonical] = value
    }
  }

  applyKeys(false)
  applyKeys(true)
  mergeBackgroundKeys(out)
  return filterStyleMap(out)
}

function parseStyleObject(style: PsrtStyle): Record<string, unknown> | null {
  if (typeof style === 'string') {
    const trimmed = style.trim()
    if (!trimmed || trimmed === '{}') return null
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      return parsed as Record<string, unknown>
    } catch {
      return null
    }
  }

  if (!style || typeof style !== 'object' || Array.isArray(style)) return null
  if (Object.keys(style).length === 0) return null
  return style
}

function canonicalKeyForRaw(rawKey: string): string {
  for (const candidate of expandRawKey(rawKey)) {
    const resolved = resolveName(candidate)
    if (resolved.ok) return resolved.canonical
    if (!isVendorKey(candidate)) return candidate
  }
  return ''
}

function isVendorRawKey(key: string): boolean {
  if (isVendorKey(key)) return true
  return stripVendorPrefix(key).ok
}

function expandRawKey(rawKey: string): string[] {
  const key = rawKey.trim()
  const stripped = stripVendorPrefix(key)
  if (stripped.ok) return [stripped.value, key]
  return [key]
}

function stripVendorPrefix(key: string): { value: string; ok: boolean } {
  const trimmed = key.trim()
  const lower = trimmed.toLowerCase()
  for (const prefix of ['-webkit-', 'webkit-', 'webkit']) {
    if (!lower.startsWith(prefix)) continue
    const rest = trimmed.slice(prefix.length)
    if (!rest) return { value: '', ok: false }
    return { value: decapitalize(rest), ok: true }
  }
  if (trimmed.startsWith('Webkit')) {
    return { value: decapitalize(trimmed.slice(6)), ok: true }
  }
  if (trimmed.startsWith('webkit')) {
    return { value: decapitalize(trimmed.slice(6)), ok: true }
  }
  return { value: '', ok: false }
}

function decapitalize(value: string): string {
  if (!value) return value
  return value[0].toLowerCase() + value.slice(1)
}

function isVendorKey(key: string): boolean {
  return key.startsWith('Webkit') || key.startsWith('webkit') || key.toLowerCase().startsWith('-webkit-')
}

function mergeBackgroundKeys(style: Record<string, unknown>): void {
  if (Object.prototype.hasOwnProperty.call(style, KeyBackground)) {
    style[KeyBackground] = style[KeyBackground]
    delete style.backgroundColor
  }
}

export { isKnownCanonical }
