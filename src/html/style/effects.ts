import { applyPercentHandlers, type ImageDims } from './percent.js'
import {
  KeyBevel,
  KeyBoxShadow,
  KeyGlow,
  KeyTextShadow,
} from './keys.js'
import { TypeFilter, type StyleFragment, newFragment, setFragmentValue } from './fragment.js'
import { hasStyleValue, stringifyCSSValue } from './values.js'

export function expandEffects(
  style: Record<string, unknown>,
  dims: ImageDims,
  targetSVG: boolean,
  filterID: string,
): { style: Record<string, unknown>; fragments: StyleFragment[] } {
  if (Object.keys(style).length === 0) return { style, fragments: [] }

  const out = { ...style }
  const extra: StyleFragment[] = []

  if (Object.prototype.hasOwnProperty.call(out, KeyGlow)) {
    const raw = out[KeyGlow]
    const value = stringifyCSSValue(raw)
    delete out[KeyGlow]
    if (hasStyleValue(KeyGlow, raw)) {
      if (targetSVG) {
        extra.push(glowFilterFragment(filterID, value, dims))
      } else {
        mergeShadowKey(out, KeyTextShadow, value)
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(out, KeyBevel)) {
    const raw = out[KeyBevel]
    const value = stringifyCSSValue(raw)
    delete out[KeyBevel]
    if (hasStyleValue(KeyBevel, raw)) {
      if (targetSVG) {
        extra.push(bevelFilterFragment(`${filterID}-bevel`, value))
      } else {
        mergeBoxShadowKey(out, bevelBoxShadows(value))
      }
    }
  }

  return { style: out, fragments: extra }
}

function mergeShadowKey(style: Record<string, unknown>, key: string, add: string): void {
  const existing = stringifyCSSValue(style[key])
  if (!existing) {
    style[key] = add
    return
  }
  style[key] = `${existing}, ${add}`
}

function mergeBoxShadowKey(style: Record<string, unknown>, add: string): void {
  const existing = stringifyCSSValue(style[KeyBoxShadow])
  if (!existing) {
    style[KeyBoxShadow] = add
    return
  }
  style[KeyBoxShadow] = `${existing}, ${add}`
}

function bevelBoxShadows(value: string): string {
  const light = 'inset 1px 1px 0 rgba(255,255,255,0.35)'
  let dark = 'inset -1px -1px 0 rgba(0,0,0,0.35)'
  if (value.trim()) {
    dark = `inset -1px -1px 2px ${value.trim()}`
  }
  return `${light}, ${dark}`
}

function glowFilterFragment(id: string, value: string, dims: ImageDims): StyleFragment {
  const parsed = parseSimpleShadow(value, dims)
  const fragment = newFragment(TypeFilter)
  setFragmentValue(fragment, 'id', id)
  setFragmentValue(fragment, 'feDropShadowDx', parsed.dx.toFixed(3))
  setFragmentValue(fragment, 'feDropShadowDy', parsed.dy.toFixed(3))
  setFragmentValue(fragment, 'feGaussianBlurStd', (parsed.blur / 2).toFixed(3))
  setFragmentValue(fragment, 'floodColor', parsed.color)
  return fragment
}

function bevelFilterFragment(id: string, value: string): StyleFragment {
  const fragment = newFragment(TypeFilter)
  setFragmentValue(fragment, 'id', id)
  setFragmentValue(fragment, 'feDropShadowDx', '-1')
  setFragmentValue(fragment, 'feDropShadowDy', '-1')
  setFragmentValue(fragment, 'feGaussianBlurStd', '0.5')
  const color = value.trim() || 'rgba(0,0,0,0.4)'
  setFragmentValue(fragment, 'floodColor', color)
  setFragmentValue(fragment, 'feDropShadowDx2', '1')
  setFragmentValue(fragment, 'floodColor2', 'rgba(255,255,255,0.35)')
  return fragment
}

function parseSimpleShadow(value: string, dims: ImageDims): { dx: number; dy: number; blur: number; color: string } {
  const trimmed = value.trim()
  if (!trimmed) {
    return { dx: 0, dy: 0, blur: 4, color: 'rgba(0,0,0,0.5)' }
  }

  const resolved = applyPercentHandlers({ textShadow: trimmed }, dims)
  const parts = stringifyCSSValue(resolved.textShadow).split(/\s+/).filter(Boolean)
  let dx = 0
  let dy = 0
  let blur = 0
  let color = ''
  if (parts.length >= 3) {
    dx = parsePxNum(parts[0] ?? '')
    dy = parsePxNum(parts[1] ?? '')
    blur = parsePxNum(parts[2] ?? '')
  }
  if (parts.length >= 4) {
    color = parts[3] ?? ''
  }
  if (!color) color = 'rgba(0,0,0,0.5)'
  return { dx, dy, blur, color }
}

function parsePxNum(value: string): number {
  const parsed = Number.parseFloat(value.trim().replace(/px$/, ''))
  return Number.isFinite(parsed) ? parsed : 0
}
