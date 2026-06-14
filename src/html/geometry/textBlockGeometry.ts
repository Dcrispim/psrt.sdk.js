import type { PsrtText } from '../../types.js'
import { plainTextForLayout } from '../text/inlineMarkup.js'
import {
  explicitHeightPx,
  fontWeightIsBold,
  lineHeightMultiplier,
  paddingHorizontal,
  paddingVertical,
  textBoxInsetsForCanvas,
  textFontSizePx,
  textLayerNeedsComputedHeight,
} from './layoutHelpers.js'

function textBlockWidthPx(widthPct: number, canvasW: number): number {
  const w = Math.round((canvasW * widthPct) / 100)
  return w < 1 ? 1 : w
}

function charsPerLineForWidth(widthPx: number, fontSizePx: number, bold: boolean): number {
  const em = bold ? 0.58 : 0.48
  const cpl = Math.floor(widthPx / (fontSizePx * em))
  return cpl < 1 ? 1 : cpl
}

function estimateTextLines(content: string, widthPx: number, fontSizePx: number, bold: boolean): number {
  if (widthPx < 1) widthPx = 1
  const charsPerLine = charsPerLineForWidth(widthPx, fontSizePx, bold)
  const parts = content.split('\n')
  let total = 0
  for (const part of parts) {
    const n = [...part.trim()].length
    if (n === 0) continue
    total += Math.ceil(n / charsPerLine)
  }
  return total < 1 ? 1 : total
}

export function textBlockGeometry(
  t: PsrtText,
  content: string,
  canvasW: number,
  canvasH: number,
): { x: number; y: number; width: number; height: number } {
  const x = Math.round((canvasW * t.x) / 100)
  const y = Math.round((canvasH * t.y) / 100)
  const outerW = textBlockWidthPx(t.width, canvasW)
  const fontPx = textFontSizePx(t.textSize, canvasW, canvasH)
  const insets = textBoxInsetsForCanvas(t.style, fontPx, canvasW, canvasH)
  const padW = Math.round(paddingHorizontal(insets))
  const padH = Math.round(paddingVertical(insets))
  let contentW = outerW - padW
  if (contentW < 1) contentW = 1
  const plain = plainTextForLayout(content)
  const lines = estimateTextLines(plain, contentW, fontPx, fontWeightIsBold(t.style))
  const lh = lineHeightMultiplier(t.style, fontPx)
  const linePx = fontPx * lh
  let contentH = Math.round(linePx * lines)
  if (contentH < Math.round(linePx)) contentH = Math.round(linePx)
  let width = outerW
  let height = contentH + padH
  const explicit = explicitHeightPx(t.style, canvasW, canvasH, fontPx)
  if (explicit.ok) {
    if (content.trim() === '') height = explicit.px
    else if (explicit.px > height) height = explicit.px
  }
  if (width < 1) width = 1
  if (height < 1) height = 1
  return { x, y, width, height }
}

export function appendTextLayerGeometryCSS(
  boxCSS: string,
  t: PsrtText,
  content: string,
  canvasW: number,
  canvasH: number,
): string {
  if (canvasH < 1 || boxCSS.includes('height:')) return boxCSS
  if (!textLayerNeedsComputedHeight(t.style, canvasW, canvasH, t.textSize)) return boxCSS
  const { height: geomH } = textBlockGeometry(t, content, canvasW, canvasH)
  if (geomH < 1) return boxCSS
  const heightPct = (geomH / canvasH) * 100
  return `${boxCSS}height:${heightPct}%;`
}
