import { applyPercentHandlers } from './percent.js'
import { normalizeStyle } from './names.js'
import {
  TypeMotionDiv,
  mergeFragments,
  newFragment,
  setFragmentValue,
  type StyleFragment,
} from './fragment.js'
import { applyBoxCSS } from './adapter.js'
import { expandEffects } from './effects.js'
import { expandBlur } from './blur.js'
import { contextImageDims, type AdaptContext } from './context.js'
import {
  KeyBoxSizing,
  KeyHeight,
  KeyLeft,
  KeyMatrix,
  KeyPosition,
  KeyRotate,
  KeyScale,
  KeySkew,
  KeyTop,
  KeyTransform,
  KeyTransformOrigin,
  KeyTranslate,
  KeyWidth,
  isBoxKey,
} from './keys.js'
import { filterStyleMap, hasStyleValue, pctString, sanitizeCSSValue, stringifyCSSValue } from './values.js'

export function adaptMaskHTML(ctx: AdaptContext): StyleFragment[] {
  const mask = ctx.mask
  if (!mask) return []

  let style = normalizeStyle(mask.style)
  if (Object.keys(style).length === 0) {
    style = {}
  }

  const dims = contextImageDims(ctx)
  if (ctx.htmlCompile) {
    dims.preservePercent = true
  }
  style = applyPercentHandlers(style, dims)
  style = filterStyleMap(style)

  const filterID = maskFilterID(ctx)
  const effects = expandEffects(style, dims, false, filterID)
  const blur = expandBlur(effects.style, dims, true, filterID)

  const fragments = buildMaskHTMLFragments(ctx, blur.style)
  return mergeFragments([...fragments, ...effects.fragments, ...blur.fragments])
}

function maskFilterID(ctx: AdaptContext): string {
  const index = ctx.mask?.index ?? ctx.textIndex ?? 0
  return `psrt-filter-${ctx.pageSlug ?? ''}-${index}`
}

function buildMaskHTMLFragments(ctx: AdaptContext, style: Record<string, unknown>): StyleFragment[] {
  const box = newFragment(TypeMotionDiv)
  applyMaskLayout(box, ctx)
  applyTransform(box, style)

  for (const [key, raw] of Object.entries(style)) {
    if (!hasStyleValue(key, raw)) continue
    const value = sanitizeCSSValue(stringifyCSSValue(raw))
    if (isBoxKey(key)) {
      applyBoxCSS(box, key, value)
    }
  }

  if (!box['background-size']) {
    setFragmentValue(box, 'background-size', 'cover')
  }
  return [box]
}

function applyMaskLayout(box: StyleFragment, ctx: AdaptContext): void {
  const mask = ctx.mask
  if (!mask) return
  setFragmentValue(box, KeyPosition, 'absolute')
  setFragmentValue(box, KeyBoxSizing, 'border-box')
  setFragmentValue(box, KeyLeft, pctString(mask.x))
  setFragmentValue(box, KeyTop, pctString(mask.y))
  setFragmentValue(box, KeyWidth, pctString(mask.width))
  setFragmentValue(box, KeyHeight, pctString(mask.height))
}

function applyTransform(target: StyleFragment, style: Record<string, unknown>): void {
  const parts: string[] = []
  const transform = stringifyCSSValue(style[KeyTransform])
  if (transform) parts.push(transform)
  for (const key of [KeyTranslate, KeyRotate, KeyScale, KeySkew, KeyMatrix]) {
    const value = stringifyCSSValue(style[key])
    if (!value) continue
    parts.push(`${key}(${value})`)
  }
  if (parts.length > 0) {
    setFragmentValue(target, KeyTransform, parts.join(' '))
  }
  const origin = stringifyCSSValue(style[KeyTransformOrigin])
  if (origin) {
    setFragmentValue(target, KeyTransformOrigin, origin)
  }
}
