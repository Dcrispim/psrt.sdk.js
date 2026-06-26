import type { PsrtMask, PsrtPathMask, PsrtText } from '../../types.js'
import type { ImageDims } from './percent.js'

export type AdaptContext = {
  style?: Record<string, unknown>
  text: PsrtText
  mask?: PsrtMask
  pathMask?: PsrtPathMask
  canvasW: number
  canvasH: number
  fontSizePx?: number
  zoom?: number
  htmlCompile?: boolean
  pageSlug?: string
  textIndex?: number
}

export function contextImageDims(ctx: AdaptContext): ImageDims {
  const zoom = ctx.zoom && ctx.zoom > 0 ? ctx.zoom : 1
  return {
    w: ctx.canvasW,
    h: ctx.canvasH,
    fontSizePx: ctx.fontSizePx ?? 0,
    zoom,
  }
}

export function fontSizePxOrCompute(ctx: AdaptContext): number {
  const fontPx = ctx.fontSizePx ?? 0
  if (fontPx > 0) return fontPx
  return textFontSizePx(ctx.text.textSize, ctx.canvasW, ctx.canvasH)
}

function textSizeBasisPx(canvasW: number, canvasH: number): number {
  if (canvasW <= 0 && canvasH <= 0) return 1
  if (canvasW <= 0) return canvasH
  if (canvasH <= 0) return canvasW
  return canvasW < canvasH ? canvasW : canvasH
}

function textFontSizePx(textSizePct: number, canvasW: number, canvasH: number): number {
  const px = (textSizePct / 100) * textSizeBasisPx(canvasW, canvasH)
  return px < 1 ? 1 : px
}
