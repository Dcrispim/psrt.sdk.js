import { applyPercentHandlers, type ImageDims } from './percent.js'
import {
  KeyBlur,
  KeyBlurBottom,
  KeyBlurLeft,
  KeyBlurRight,
  KeyBlurTop,
} from './keys.js'
import {
  TypeFilter,
  TypeMask,
  TypeMotionDiv,
  type StyleFragment,
  newFragment,
  setFragmentValue,
} from './fragment.js'
import { hasStyleValue, stringifyCSSValue } from './values.js'

export const blurFilterKind = 'blur'

export type BlurAdapt = {
  filterID: string
  maskID: string
}

type BlurSpec = {
  amountPx: number
  side: '' | 'left' | 'right' | 'top' | 'bottom'
}

const blurSideKeys: Array<{ key: string; side: BlurSpec['side'] }> = [
  { key: KeyBlurLeft, side: 'left' },
  { key: KeyBlurRight, side: 'right' },
  { key: KeyBlurTop, side: 'top' },
  { key: KeyBlurBottom, side: 'bottom' },
]

export function expandBlur(
  style: Record<string, unknown>,
  dims: ImageDims,
  html: boolean,
  filterID: string,
): { style: Record<string, unknown>; meta: BlurAdapt; fragments: StyleFragment[] } {
  if (Object.keys(style).length === 0) {
    return { style, meta: { filterID: '', maskID: '' }, fragments: [] }
  }

  const parsed = parseBlurFromStyle(style, dims)
  if (!parsed.ok) {
    return { style, meta: { filterID: '', maskID: '' }, fragments: [] }
  }

  const spec = parsed.spec
  const out = { ...style }
  for (const sideKey of blurSideKeys) {
    delete out[sideKey.key]
  }
  delete out[KeyBlur]

  const meta: BlurAdapt = { filterID: `${filterID}-blur`, maskID: '' }
  if (html) {
    const patch = newFragment(TypeMotionDiv)
    applyBlurHTML(patch, spec)
    return { style: out, meta, fragments: [patch] }
  }

  const fragments: StyleFragment[] = [blurFilterFragment(meta.filterID, spec)]
  if (spec.side) {
    meta.maskID = `${meta.filterID}-mask`
    fragments.push(blurMaskFragment(meta.maskID, spec.side))
  }
  return { style: out, meta, fragments }
}

function parseBlurFromStyle(style: Record<string, unknown>, dims: ImageDims): { spec: BlurSpec; ok: boolean } {
  for (const side of blurSideKeys) {
    const raw = style[side.key]
    if (!hasStyleValue(side.key, raw)) continue
    const amount = parseBlurAmount(stringifyCSSValue(raw), dims)
    if (!amount.ok || amount.amount <= 0) return { spec: { amountPx: 0, side: '' }, ok: false }
    return { spec: { amountPx: amount.amount, side: side.side }, ok: true }
  }

  const raw = style[KeyBlur]
  if (!hasStyleValue(KeyBlur, raw)) return { spec: { amountPx: 0, side: '' }, ok: false }
  return parseBlurCSSValue(stringifyCSSValue(raw), dims)
}

function parseBlurCSSValue(value: string, dims: ImageDims): { spec: BlurSpec; ok: boolean } {
  const trimmed = value.trim()
  if (!trimmed) return { spec: { amountPx: 0, side: '' }, ok: false }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { spec: { amountPx: 0, side: '' }, ok: false }

  let side: BlurSpec['side'] = ''
  const amountParts: string[] = []
  for (const part of parts) {
    const lower = part.toLowerCase()
    if ((lower === 'left' || lower === 'right' || lower === 'top' || lower === 'bottom') && !side) {
      side = lower
      continue
    }
    amountParts.push(part)
  }

  let amountString = amountParts.join(' ')
  if (!amountString && side && parts.length >= 2) {
    for (let i = 0; i < parts.length; i += 1) {
      const current = parts[i]?.toLowerCase()
      if (current !== side) continue
      amountString = parts.slice(i + 1).join(' ')
      break
    }
  }
  if (!amountString) {
    amountString = trimmed
    side = ''
  }

  const amount = parseBlurAmount(amountString, dims)
  if (!amount.ok || amount.amount <= 0) return { spec: { amountPx: 0, side: '' }, ok: false }
  return { spec: { amountPx: amount.amount, side }, ok: true }
}

function parseBlurAmount(value: string, dims: ImageDims): { amount: number; ok: boolean } {
  let trimmed = value.trim()
  if (!trimmed) return { amount: 0, ok: false }
  if (trimmed.includes('%')) {
    const resolved = applyPercentHandlers({ [KeyBlur]: trimmed }, dims)
    trimmed = stringifyCSSValue(resolved[KeyBlur])
  }
  const px = parsePxNum(trimmed)
  return { amount: px, ok: px > 0 }
}

function applyBlurHTML(box: StyleFragment, spec: BlurSpec): void {
  if (spec.amountPx <= 0) return

  const px = `${spec.amountPx.toFixed(3)}px`
  const blurValue = `blur(${px})`
  setFragmentValue(box, 'backdropFilter', blurValue)
  setFragmentValue(box, 'WebkitBackdropFilter', blurValue)
  if (!spec.side) return

  const mask = blurMaskCSS(spec.side)
  setFragmentValue(box, 'maskImage', mask)
  setFragmentValue(box, 'WebkitMaskImage', mask)
  setFragmentValue(box, 'maskSize', '100% 100%')
  setFragmentValue(box, 'WebkitMaskSize', '100% 100%')
}

function blurMaskCSS(side: BlurSpec['side']): string {
  switch (side) {
    case 'left':
      return 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
    case 'right':
      return 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
    case 'top':
      return 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
    case 'bottom':
      return 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
    default:
      return ''
  }
}

function blurFilterFragment(id: string, spec: BlurSpec): StyleFragment {
  const fragment = newFragment(TypeFilter)
  setFragmentValue(fragment, 'id', id)
  setFragmentValue(fragment, 'filterKind', blurFilterKind)
  let std = spec.amountPx / 2
  if (std < 0.5) std = 0.5
  setFragmentValue(fragment, 'feGaussianBlurStd', std.toFixed(3))
  setFragmentValue(fragment, 'feGaussianBlurIn', 'SourceGraphic')
  return fragment
}

function blurMaskFragment(id: string, side: BlurSpec['side']): StyleFragment {
  const fragment = newFragment(TypeMask)
  setFragmentValue(fragment, 'id', id)
  setFragmentValue(fragment, 'maskSide', side)
  return fragment
}

export function applyBlurSVGRect(rect: StyleFragment, meta: BlurAdapt): void {
  if (!meta.filterID) return
  setFragmentValue(rect, 'filter', `url(#${meta.filterID})`)
  if (meta.maskID) {
    setFragmentValue(rect, 'mask', `url(#${meta.maskID})`)
  }
}

function parsePxNum(value: string): number {
  const trimmed = value.trim().replace(/px$/, '')
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : 0
}
