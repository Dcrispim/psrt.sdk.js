import { applyPercentHandlers } from './percent.js'
import { normalizeStyle } from './names.js'
import {
  TypeMotionDiv,
  TypePath,
  mergeFragments,
  newFragment,
  setFragmentValue,
  getFragmentString,
  type StyleFragment,
} from './fragment.js'
import { expandEffects } from './effects.js'
import { applyBlurSVGRect, expandBlur } from './blur.js'
import { contextImageDims, type AdaptContext } from './context.js'
import {
  KeyBackground,
  KeyBorder,
  KeyBorderBottomLeftRadius,
  KeyBorderBottomRightRadius,
  KeyBorderColor,
  KeyBorderRadius,
  KeyBorderTopLeftRadius,
  KeyBorderTopRightRadius,
  KeyBorderWidth,
  KeyBoxShadow,
  KeyBoxSizing,
  KeyHeight,
  KeyLeft,
  KeyPosition,
  KeyTop,
  KeyWidth,
  isBoxKey,
} from './keys.js'
import { filterStyleMap, hasStyleValue, pctString, sanitizeCSSValue, stringifyCSSValue } from './values.js'

/** Mirrors go/styleadapter/pathmask.go:AdaptPathMaskHTML — the ~~ block is
 * always rendered as an inline <svg><path>, in both the HTML and SVG
 * pipelines, so decoration always targets SVG presentation attributes. */
export function adaptPathMaskHTML(ctx: AdaptContext): StyleFragment[] {
  const mask = ctx.pathMask
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

  const filterID = pathMaskFilterID(ctx)
  const effects = expandEffects(style, dims, true, filterID)
  const blur = expandBlur(effects.style, dims, false, filterID)

  const box = newFragment(TypeMotionDiv)
  applyPathMaskLayout(box, ctx)

  const fragments = [...buildPathMaskFragments(blur.style, blur.meta), box]
  return mergeFragments([...fragments, ...effects.fragments, ...blur.fragments])
}

function pathMaskFilterID(ctx: AdaptContext): string {
  const index = ctx.pathMask?.index ?? ctx.textIndex ?? 0
  return `psrt-filter-${ctx.pageSlug ?? ''}-${index}`
}

function applyPathMaskLayout(box: StyleFragment, ctx: AdaptContext): void {
  const mask = ctx.pathMask
  if (!mask) return
  setFragmentValue(box, KeyPosition, 'absolute')
  setFragmentValue(box, KeyBoxSizing, 'border-box')
  setFragmentValue(box, KeyLeft, pctString(mask.x))
  setFragmentValue(box, KeyTop, pctString(mask.y))
  setFragmentValue(box, KeyWidth, pctString(mask.width))
  setFragmentValue(box, KeyHeight, pctString(mask.height))
}

function buildPathMaskFragments(
  style: Record<string, unknown>,
  blurMeta: { filterID: string; maskID: string }
): StyleFragment[] {
  const path = newFragment(TypePath)
  let hasDecoration = false

  for (const [key, raw] of Object.entries(style)) {
    if (!hasStyleValue(key, raw)) continue
    if (isBorderRadiusKey(key)) continue // contour already comes from the path itself
    if (!isBoxKey(key)) continue
    const value = sanitizeCSSValue(stringifyCSSValue(raw))
    hasDecoration = applyBoxSVG(path, key, value) || hasDecoration
  }

  if (blurMeta.filterID) {
    applyBlurSVGRect(path, blurMeta)
    hasDecoration = true
  }
  if (!hasDecoration && !getFragmentString(path, 'fill')) {
    return []
  }
  return [path]
}

function isBorderRadiusKey(key: string): boolean {
  switch (key) {
    case KeyBorderRadius:
    case KeyBorderTopLeftRadius:
    case KeyBorderTopRightRadius:
    case KeyBorderBottomRightRadius:
    case KeyBorderBottomLeftRadius:
      return true
    default:
      return false
  }
}

function applyBoxSVG(fragment: StyleFragment, key: string, value: string): boolean {
  switch (key) {
    case KeyBackground:
      setFragmentValue(fragment, 'fill', value)
      return true
    case KeyBorder:
    case KeyBorderColor:
      setFragmentValue(fragment, 'stroke', extractBorderColor(value))
      return true
    case KeyBorderWidth:
      setFragmentValue(fragment, 'stroke-width', value)
      return true
    case KeyBoxShadow:
      return true
    default:
      return false
  }
}

function extractBorderColor(border: string): string {
  const parts = border.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 3) return parts.slice(2).join(' ')
  if (parts.length === 2) return parts[1] ?? ''
  return border
}
