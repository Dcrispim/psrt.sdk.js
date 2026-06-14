import { applyPercentHandlers } from './percent.js'
import {
  KeyAlignItems,
  KeyBackground,
  KeyBorder,
  KeyBorderBottom,
  KeyBorderBottomLeftRadius,
  KeyBorderBottomRightRadius,
  KeyBorderColor,
  KeyBorderLeft,
  KeyBorderRadius,
  KeyBorderRight,
  KeyBorderStyle,
  KeyBorderTop,
  KeyBorderTopLeftRadius,
  KeyBorderTopRightRadius,
  KeyBorderWidth,
  KeyBoxShadow,
  KeyBoxSizing,
  KeyColor,
  KeyFontSize,
  KeyHeight,
  KeyLeft,
  KeyMatrix,
  KeyPadding,
  KeyPaddingBottom,
  KeyPaddingLeft,
  KeyPaddingRight,
  KeyPaddingTop,
  KeyPosition,
  KeyRotate,
  KeyScale,
  KeySkew,
  KeyStroke,
  KeyStrokeColor,
  KeyStrokeWidth,
  KeyTextAlign,
  KeyTop,
  KeyTransform,
  KeyTransformOrigin,
  KeyTranslate,
  KeyWidth,
  isBoxKey,
  isTextKey,
  isTransformKey,
} from './keys.js'
import { normalizeStyle } from './names.js'
import {
  TypeMotionDiv,
  TypeSpan,
  mergeFragments,
  newFragment,
  setFragmentValue,
  getFragmentString,
  type StyleFragment,
} from './fragment.js'
import { expandEffects } from './effects.js'
import { expandBlur } from './blur.js'
import { applyStrokeHTML } from './stroke.js'
import { contextImageDims, fontSizePxOrCompute, type AdaptContext } from './context.js'
import { filterStyleMap, hasStyleValue, pctString, pxString, sanitizeCSSValue, stringifyCSSValue } from './values.js'

export function adaptHTML(ctx: AdaptContext): StyleFragment[] {
  return adapt(ctx, true)
}

function adapt(ctx: AdaptContext, html: boolean): StyleFragment[] {
  let style = normalizeStyle(ctx.text.style)
  if (Object.keys(style).length === 0) {
    style = {}
  }

  const dims = contextImageDims(ctx)
  dims.fontSizePx = fontSizePxOrCompute(ctx)
  if (html && ctx.htmlCompile) {
    dims.preservePercent = true
  }

  style = applyPercentHandlers(style, dims)
  style = filterStyleMap(style)

  const filterID = `psrt-filter-${ctx.pageSlug ?? ''}-${ctx.textIndex ?? 0}`
  const effects = expandEffects(style, dims, !html, filterID)
  const blur = expandBlur(effects.style, dims, html, filterID)

  const fragments = html ? buildHTMLFragments(ctx, blur.style) : []
  return mergeFragments([...fragments, ...effects.fragments, ...blur.fragments])
}

export function buildHTMLFragments(ctx: AdaptContext, style: Record<string, unknown>): StyleFragment[] {
  const box = newFragment(TypeMotionDiv)
  const text = newFragment(TypeSpan)

  applyLayout(box, ctx)
  applyTransform(box, style)

  for (const [key, raw] of Object.entries(style)) {
    if (!hasStyleValue(key, raw)) continue
    const value = sanitizeCSSValue(stringifyCSSValue(raw))
    if (isBoxKey(key)) {
      applyBoxCSS(box, key, value)
      continue
    }
    if (isTextKey(key) && key !== KeyStroke && key !== KeyStrokeWidth && key !== KeyStrokeColor) {
      applyTextCSS(text, key, value)
      continue
    }
    if (isTransformKey(key)) {
      continue
    }
  }

  applyStrokeHTML(text, style)
  applyFontSize(box, ctx, Boolean(ctx.htmlCompile))
  applyTextAlignHTML(box, text, style)
  if (!getFragmentString(text, KeyColor)) {
    const color = textColor(style)
    if (color) {
      setFragmentValue(text, KeyColor, color)
    }
  }

  return [box, text]
}

function applyLayout(box: StyleFragment, ctx: AdaptContext): void {
  setFragmentValue(box, KeyPosition, 'absolute')
  setFragmentValue(box, KeyBoxSizing, 'border-box')
  setFragmentValue(box, KeyLeft, pctString(ctx.text.x))
  setFragmentValue(box, KeyTop, pctString(ctx.text.y))
  setFragmentValue(box, KeyWidth, pctString(ctx.text.width))
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

  if (parts.length === 0) return

  setFragmentValue(target, 'transform', parts.join(' '))
  const origin = stringifyCSSValue(style[KeyTransformOrigin])
  if (origin) {
    setFragmentValue(target, KeyTransformOrigin, origin)
  }
}

export function applyBoxCSS(fragment: StyleFragment, key: string, value: string): void {
  switch (key) {
    case KeyBackground:
      setFragmentValue(fragment, 'backgroundColor', value)
      return
    case KeyPadding:
    case KeyPaddingTop:
    case KeyPaddingRight:
    case KeyPaddingBottom:
    case KeyPaddingLeft:
    case KeyBorder:
    case KeyBorderWidth:
    case KeyBorderStyle:
    case KeyBorderColor:
    case KeyBorderTop:
    case KeyBorderRight:
    case KeyBorderBottom:
    case KeyBorderLeft:
    case KeyBorderRadius:
    case KeyBorderTopLeftRadius:
    case KeyBorderTopRightRadius:
    case KeyBorderBottomRightRadius:
    case KeyBorderBottomLeftRadius:
    case KeyBoxShadow:
    case KeyHeight:
      setFragmentValue(fragment, key, value)
      return
    default:
      return
  }
}

function applyTextCSS(fragment: StyleFragment, key: string, value: string): void {
  const cssKey = key === KeyTextAlign ? 'textAlign' : key
  setFragmentValue(fragment, cssKey, value)
}

function applyFontSize(fragment: StyleFragment, ctx: AdaptContext, htmlCompile: boolean): void {
  if (htmlCompile) {
    setFragmentValue(fragment, KeyFontSize, `${ctx.text.textSize}cqmin`)
    return
  }
  setFragmentValue(fragment, KeyFontSize, pxString(fontSizePxOrCompute(ctx)))
}

function applyTextAlignHTML(box: StyleFragment, text: StyleFragment, style: Record<string, unknown>): void {
  let ta = getFragmentString(text, KeyTextAlign).toLowerCase().trim()
  if (!ta) {
    ta = readTextAlignFromStyle(style)
  }
  const va = verticalAlignFromStyle(style)
  if (!ta && !va) return
  if (!ta) ta = 'left'

  setFragmentValue(text, 'display', 'block')
  setFragmentValue(text, KeyWidth, '100%')
  setFragmentValue(text, KeyTextAlign, ta)

  switch (ta) {
    case 'justify':
      setFragmentValue(box, 'display', 'block')
      return
    case 'center':
    case 'right':
    case 'left':
    case 'start': {
      setFragmentValue(box, 'display', 'flex')
      setFragmentValue(box, 'flexDirection', 'column')
      const justify = va || 'center'
      setFragmentValue(box, 'justifyContent', justify)
      let align = 'stretch'
      if (ta === 'center') align = 'center'
      if (ta === 'right') align = 'flex-end'
      if (ta === 'left' || ta === 'start') align = 'flex-start'
      setFragmentValue(box, 'alignItems', align)
      return
    }
    default:
      setFragmentValue(box, 'display', 'block')
  }
}

function readTextAlignFromStyle(style: Record<string, unknown>): string {
  const direct = style[KeyTextAlign]
  if (direct !== undefined) {
    return sanitizeCSSValue(stringifyCSSValue(direct)).toLowerCase()
  }
  for (const key of ['text-align', 'ta']) {
    const value = style[key]
    if (value === undefined) continue
    return sanitizeCSSValue(stringifyCSSValue(value)).toLowerCase()
  }
  return ''
}

function verticalAlignFromStyle(style: Record<string, unknown>): string {
  const direct = style[KeyAlignItems]
  let value = direct !== undefined ? sanitizeCSSValue(stringifyCSSValue(direct)).toLowerCase() : ''
  if (!value) {
    for (const key of ['align-items', 'verticalAlign', 'vertical-align']) {
      const raw = style[key]
      if (raw === undefined) continue
      value = sanitizeCSSValue(stringifyCSSValue(raw)).toLowerCase()
      break
    }
  }

  switch (value) {
    case 'flex-start':
    case 'start':
    case 'top':
      return 'flex-start'
    case 'flex-end':
    case 'end':
    case 'bottom':
      return 'flex-end'
    case 'center':
    case 'middle':
      return 'center'
    default:
      return ''
  }
}

function textColor(style: Record<string, unknown>): string {
  const color = style[KeyColor]
  if (color === undefined) return ''
  return sanitizeCSSValue(stringifyCSSValue(color))
}

export type { StyleFragment, AdaptContext }
