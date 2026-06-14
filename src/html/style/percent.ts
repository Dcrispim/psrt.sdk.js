interface PercentHandler {
  keys(): string[]
  resolve(key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean }
}

export type ImageDims = {
  w?: number
  h?: number
  W?: number
  H?: number
  fontSizePx?: number
  FontSizePx?: number
  zoom?: number
  Zoom?: number
  preservePercent?: boolean
  PreservePercent?: boolean
}

type ResolvedImageDims = {
  w: number
  h: number
  fontSizePx: number
  zoom: number
  preservePercent: boolean
}

let defaultHandlers: PercentHandler[] = []

export function registerPercentHandler(handler: PercentHandler): void {
  defaultHandlers.push(handler)
}

export function applyPercentHandlers(style: Record<string, unknown>, dims: ImageDims): Record<string, unknown> {
  if (Object.keys(style).length === 0) return style

  const resolvedDims = resolveImageDims(dims)
  const keyHandler = new Map<string, PercentHandler>()
  for (const handler of defaultHandlers) {
    for (const key of handler.keys()) {
      keyHandler.set(key, handler)
    }
  }

  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(style)) {
    const value = stringifyRaw(raw)
    if (resolvedDims.preservePercent && value.includes('%')) {
      out[key] = raw
      continue
    }

    const handler = keyHandler.get(key)
    if (handler && value) {
      const resolved = handler.resolve(key, value, resolvedDims)
      if (resolved.ok) {
        out[key] = resolved.resolved
        continue
      }
    }

    out[key] = raw
  }

  return out
}

function resolveImageDims(dims: ImageDims): ResolvedImageDims {
  const w = dims.W ?? dims.w ?? 0
  const h = dims.H ?? dims.h ?? 0
  const fontSizePx = dims.FontSizePx ?? dims.fontSizePx ?? 0
  const zoom = dims.Zoom ?? dims.zoom ?? 1
  const preservePercent = dims.PreservePercent ?? dims.preservePercent ?? false
  return { w, h, fontSizePx, zoom: zoom > 0 ? zoom : 1, preservePercent }
}

function stringifyRaw(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'string') return raw
  return String(raw)
}

class DimensionHandler implements PercentHandler {
  keys(): string[] {
    return ['height', 'width']
  }

  resolve(key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.includes('%')) return { resolved: value, ok: true }
    const base = key === 'width' ? dims.w : dims.h
    return singlePercentToken(value, base, dims)
  }
}

class PaddingHandler implements PercentHandler {
  keys(): string[] {
    return ['padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
  }

  resolve(key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.includes('%')) return { resolved: value, ok: true }
    const tokens = value.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return { resolved: value, ok: true }

    if (tokens.length === 1 || key !== 'padding') {
      const base = paddingAxisBase(key, tokens.length, 0, dims)
      if (tokens.length === 1) {
        return singlePercentToken(tokens[0], base, dims)
      }
    }

    const bases = shorthandBases(tokens.length)
    const out: string[] = []
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i] ?? ''
      const axis = bases[i] ?? 0
      const base = paddingAxisBase(key, tokens.length, axis, dims)
      const resolved = singlePercentToken(token, base, dims)
      out.push(resolved.resolved)
    }
    return { resolved: out.join(' '), ok: true }
  }
}

function shorthandBases(count: number): number[] {
  switch (count) {
    case 1:
      return [0, 0, 0, 0]
    case 2:
      return [0, 1, 0, 1]
    case 3:
      return [0, 1, 2, 1]
    default:
      return [0, 1, 2, 3]
  }
}

function paddingAxisBase(key: string, count: number, axis: number, dims: ResolvedImageDims): number {
  switch (key) {
    case 'paddingTop':
    case 'paddingBottom':
      return dims.h
    case 'paddingLeft':
    case 'paddingRight':
      return dims.w
  }
  if (count === 1) return max(dims.w, dims.h)
  switch (axis) {
    case 0:
    case 2:
      return dims.h
    case 1:
    case 3:
      return dims.w
    default:
      return dims.w
  }
}

class BorderWidthHandler implements PercentHandler {
  keys(): string[] {
    return ['borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
  }

  resolve(_key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.includes('%')) return { resolved: value, ok: true }
    return singlePercentToken(value, dims.w, dims)
  }
}

class LineHeightHandler implements PercentHandler {
  keys(): string[] {
    return ['lineHeight']
  }

  resolve(_key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.trim().endsWith('%')) return { resolved: value, ok: true }
    return singlePercentToken(value, dims.h, dims)
  }
}

class StrokeWidthHandler implements PercentHandler {
  keys(): string[] {
    return ['strokeWidth']
  }

  resolve(_key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.includes('%')) return { resolved: value, ok: true }
    const base = dims.fontSizePx > 0 ? dims.fontSizePx : 1
    return singlePercentToken(value, base, dims)
  }
}

class BlurHandler implements PercentHandler {
  keys(): string[] {
    return ['blur', 'blurLeft', 'blurRight', 'blurTop', 'blurBottom']
  }

  resolve(_key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.includes('%')) return { resolved: value, ok: true }
    let base = dims.w
    if (dims.h > 0 && dims.h < dims.w) base = dims.h
    return singlePercentToken(value, base, dims)
  }
}

class TextShadowHandler implements PercentHandler {
  keys(): string[] {
    return ['textShadow']
  }

  resolve(_key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.includes('%')) return { resolved: value, ok: true }
    return { resolved: resolveShadowList(value, dims), ok: true }
  }
}

class BoxShadowHandler implements PercentHandler {
  keys(): string[] {
    return ['boxShadow']
  }

  resolve(_key: string, value: string, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
    if (!value.includes('%')) return { resolved: value, ok: true }
    return { resolved: resolveShadowList(value, dims), ok: true }
  }
}

function resolveShadowList(value: string, dims: ResolvedImageDims): string {
  const parts = value.split(',')
  for (let i = 0; i < parts.length; i += 1) {
    const shadow = parts[i]?.trim() ?? ''
    parts[i] = resolveShadowOne(shadow, dims)
  }
  return parts.join(', ')
}

function resolveShadowOne(shadow: string, dims: ResolvedImageDims): string {
  if (!shadow) return shadow
  const tokens = shadow.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return shadow

  const colorIndex = findColorTokenIndex(tokens)
  const numericEnd = colorIndex < 0 ? tokens.length : colorIndex
  for (let i = 0; i < numericEnd && i < 3; i += 1) {
    const token = tokens[i]
    if (token) tokens[i] = resolveShadowToken(token, i, dims)
  }
  return tokens.join(' ')
}

function findColorTokenIndex(tokens: string[]): number {
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i] ?? ''
    if (token.startsWith('#') || token.toLowerCase().startsWith('rgb')) return i
  }
  return -1
}

function resolveShadowToken(token: string, index: number, dims: ResolvedImageDims): string {
  if (!token.endsWith('%')) return token
  const pct = Number.parseFloat(token.slice(0, -1))
  if (!Number.isFinite(pct)) return token

  const z = dims.zoom > 0 ? dims.zoom : 1
  let base = 0
  switch (index) {
    case 0:
      base = dims.w * z
      break
    case 1:
      base = dims.h * z
      break
    case 2:
      base = max(dims.w, dims.h) * z
      break
    default:
      return token
  }
  return `${((pct / 100) * base).toFixed(3)}px`
}

function percentToPx(percentString: string, base: number, zoom: number): string {
  const pct = Number.parseFloat(percentString.trim().replace(/%$/, ''))
  if (!Number.isFinite(pct)) return percentString
  const z = zoom > 0 ? zoom : 1
  return `${((pct / 100) * base * z).toFixed(3)}px`
}

function singlePercentToken(value: string, base: number, dims: ResolvedImageDims): { resolved: string; ok: boolean } {
  const v = value.trim()
  if (!v.endsWith('%')) return { resolved: v, ok: true }
  return { resolved: percentToPx(v, base, dims.zoom), ok: true }
}

function max(a: number, b: number): number {
  return a > b ? a : b
}

defaultHandlers = [
  new TextShadowHandler(),
  new BoxShadowHandler(),
  new BlurHandler(),
  new BorderWidthHandler(),
  new StrokeWidthHandler(),
  new LineHeightHandler(),
  new PaddingHandler(),
  new DimensionHandler(),
]
