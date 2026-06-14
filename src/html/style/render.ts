import {
  TypeFilter,
  TypeKey,
  TypeMask,
  TypeMotionDiv,
  TypeRect,
  TypeSpan,
  getFragmentString,
  mergeFragments,
  type StyleFragment,
} from './fragment.js'
import { blurFilterKind } from './blur.js'

export function htmlLayerCSS(fragments: StyleFragment[]): { boxCSS: string; textCSS: string } {
  const merged = mergeFragments(fragments)
  let box: StyleFragment | null = null
  let text: StyleFragment | null = null

  for (const fragment of merged) {
    const type = getFragmentString(fragment, TypeKey)
    if (type === TypeMotionDiv) box = fragment
    if (type === TypeSpan) text = fragment
  }

  return { boxCSS: fragmentCSS(box), textCSS: fragmentCSS(text) }
}

export function fragmentsToInlineCSS(fragments: StyleFragment[]): string {
  const merged = mergeFragments(fragments)
  let out = ''
  for (const type of [TypeMotionDiv, TypeSpan]) {
    for (const fragment of merged) {
      if (getFragmentString(fragment, TypeKey) !== type) continue
      out += fragmentCSS(fragment)
    }
  }
  return out
}

export function fragmentCSS(fragment: StyleFragment | null | undefined): string {
  if (!fragment) return ''
  const keys = Object.keys(fragment)
    .filter((key) => key !== TypeKey)
    .sort()
  let out = ''
  for (const key of keys) {
    const raw = fragment[key]
    const value = raw === undefined || raw === null ? '' : String(raw)
    if (!value) continue
    out += `${camelToKebab(key)}:${value};`
  }
  return out
}

export const FragmentCSS = fragmentCSS

export function camelToKebab(value: string): string {
  if (value.startsWith('-')) return value
  let out = ''
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i] ?? ''
    const upper = char >= 'A' && char <= 'Z'
    if (upper) {
      if (i > 0) out += '-'
      out += char.toLowerCase()
      continue
    }
    out += char
  }
  return out
}

export function filterFragmentToSVG(fragment: StyleFragment | null | undefined): string {
  if (!fragment || getFragmentString(fragment, TypeKey) !== TypeFilter) return ''
  const id = getFragmentString(fragment, 'id')
  if (!id) return ''
  if (getFragmentString(fragment, 'filterKind') === blurFilterKind) {
    return blurFilterFragmentToSVG(fragment)
  }

  const dx = getFragmentString(fragment, 'feDropShadowDx')
  const dy = getFragmentString(fragment, 'feDropShadowDy')
  const std = getFragmentString(fragment, 'feGaussianBlurStd') || '1'
  const color = getFragmentString(fragment, 'floodColor')

  let out = `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">`
  out += `<feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${std}" flood-color="${svgEscape(color)}"/>`
  if (fragment.feDropShadowDx2 !== undefined) {
    const dx2 = String(fragment.feDropShadowDx2)
    const color2 = getFragmentString(fragment, 'floodColor2')
    out += `<feDropShadow dx="${dx2}" dy="${dy}" stdDeviation="0.5" flood-color="${svgEscape(color2)}"/>`
  }
  out += '</filter>'
  return out
}

function blurFilterFragmentToSVG(fragment: StyleFragment): string {
  const id = getFragmentString(fragment, 'id')
  const std = getFragmentString(fragment, 'feGaussianBlurStd') || '1'
  const input = getFragmentString(fragment, 'feGaussianBlurIn') || 'SourceGraphic'
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="${svgEscape(input)}" stdDeviation="${std}"/></filter>`
}

export function maskFragmentToSVG(fragment: StyleFragment | null | undefined): string {
  if (!fragment || getFragmentString(fragment, TypeKey) !== TypeMask) return ''
  const id = getFragmentString(fragment, 'id')
  const side = getFragmentString(fragment, 'maskSide')
  if (!id || !side) return ''

  const coords = maskGradientCoords(side)
  let out = `<mask id="${id}" maskUnits="objectBoundingBox">`
  out += `<linearGradient id="${id}-grad" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">`
  out += '<stop offset="0%" stop-color="white" stop-opacity="1"/>'
  out += '<stop offset="100%" stop-color="white" stop-opacity="0"/>'
  out += '</linearGradient>'
  out += `<rect width="100%" height="100%" fill="url(#${id}-grad)"/></mask>`
  return out
}

function maskGradientCoords(side: string): { x1: string; y1: string; x2: string; y2: string } {
  switch (side.toLowerCase()) {
    case 'left':
      return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
    case 'right':
      return { x1: '100%', y1: '0%', x2: '0%', y2: '0%' }
    case 'top':
      return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
    case 'bottom':
      return { x1: '0%', y1: '100%', x2: '0%', y2: '0%' }
    default:
      return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
  }
}

function svgEscape(value: string): string {
  return value.replaceAll('"', '&quot;')
}

export function rectFragmentAttrs(fragment: StyleFragment | null | undefined): string {
  if (!fragment || getFragmentString(fragment, TypeKey) !== TypeRect) return ''
  return rectAttrs(fragment, true)
}

export function rectDecorationAttrs(fragment: StyleFragment | null | undefined): string {
  if (!fragment || getFragmentString(fragment, TypeKey) !== TypeRect) return ''
  return rectAttrs(fragment, false)
}

function rectAttrs(fragment: StyleFragment, includeLayout: boolean): string {
  const keys = includeLayout
    ? ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'rx', 'filter', 'mask']
    : ['fill', 'stroke', 'stroke-width', 'rx', 'filter', 'mask']

  const parts: string[] = []
  for (const key of keys) {
    const raw = fragment[key]
    if (raw === null || raw === undefined) continue
    const value = String(raw)
    if (!value) continue
    parts.push(`${key}="${svgEscape(value)}"`)
  }
  return parts.join(' ')
}
