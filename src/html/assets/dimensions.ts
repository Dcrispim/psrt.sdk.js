export interface Asset {
  bytes: Uint8Array
  mime: string
}

export type AssetMap = Map<string, Asset>

export const DEFAULT_WIDTH = 1080
export const DEFAULT_HEIGHT = 1920

function dimensionsFromStandard(body: Uint8Array): { w: number; h: number } | null {
  if (body.length < 24) return null
  // PNG
  if (
    body[0] === 0x89 &&
    body[1] === 0x50 &&
    body[2] === 0x4e &&
    body[3] === 0x47
  ) {
    const w = (body[16] << 24) | (body[17] << 16) | (body[18] << 8) | body[19]
    const h = (body[20] << 24) | (body[21] << 16) | (body[22] << 8) | body[23]
    if (w > 0 && h > 0) return { w, h }
  }
  // JPEG SOF markers
  if (body[0] === 0xff && body[1] === 0xd8) {
    let i = 2
    while (i + 9 < body.length) {
      if (body[i] !== 0xff) {
        i++
        continue
      }
      const marker = body[i + 1]
      const len = (body[i + 2] << 8) | body[i + 3]
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = (body[i + 5] << 8) | body[i + 6]
        const w = (body[i + 7] << 8) | body[i + 8]
        if (w > 0 && h > 0) return { w, h }
        return null
      }
      i += 2 + len
    }
  }
  // GIF
  if (body[0] === 0x47 && body[1] === 0x49 && body[2] === 0x46) {
    const w = body[6] | (body[7] << 8)
    const h = body[8] | (body[9] << 8)
    if (w > 0 && h > 0) return { w, h }
  }
  return null
}

function isWebP(body: Uint8Array): boolean {
  return (
    body.length >= 12 &&
    body[0] === 0x52 &&
    body[1] === 0x49 &&
    body[2] === 0x46 &&
    body[3] === 0x46 &&
    body[8] === 0x57 &&
    body[9] === 0x45 &&
    body[10] === 0x42 &&
    body[11] === 0x50
  )
}

function webpDimensions(body: Uint8Array): { w: number; h: number } | null {
  if (!isWebP(body)) return null
  let off = 12
  while (off + 8 <= body.length) {
    const chunk = String.fromCharCode(body[off], body[off + 1], body[off + 2], body[off + 3])
    const size = body[off + 4] | (body[off + 5] << 8) | (body[off + 6] << 16) | (body[off + 7] << 24)
    const dataStart = off + 8
    const dataEnd = dataStart + size
    if (size < 0 || dataEnd > body.length) break
    if (chunk === 'VP8X' && size >= 10) {
      const w = body[dataStart + 4] | (body[dataStart + 5] << 8) | (body[dataStart + 6] << 16)
      const h = body[dataStart + 7] | (body[dataStart + 8] << 8) | (body[dataStart + 9] << 16)
      if (w > 0 && h > 0) return { w: w + 1, h: h + 1 }
    }
    if (chunk === 'VP8L' && size >= 5) {
      const b0 = body[dataStart]
      const b1 = body[dataStart + 1]
      const b2 = body[dataStart + 2]
      const b3 = body[dataStart + 3]
      const w = 1 + b0 + (b1 & 0x3f) * 256
      const h = 1 + (b1 >> 6) + (b2 & 0x0f) * 4 + (b3 & 0xfc) * 2
      if (w > 0 && h > 0) return { w, h }
    }
    off = dataEnd + (size & 1)
  }
  return null
}

function isAVIF(body: Uint8Array): boolean {
  if (body.length < 12) return false
  if (String.fromCharCode(body[4], body[5], body[6], body[7]) !== 'ftyp') return false
  const brand = String.fromCharCode(body[8], body[9], body[10], body[11])
  return brand === 'avif' || brand === 'avis' || brand === 'mif1' || brand === 'MA1A'
}

function avifDimensions(body: Uint8Array): { w: number; h: number } | null {
  let found: { w: number; h: number } | null = null
  const walk = (buf: Uint8Array): boolean => {
    for (let off = 0; off + 8 <= buf.length; ) {
      let size = (buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]
      const boxType = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7])
      let header = 8
      if (size === 1 && off + 16 <= buf.length) {
        size = Number(
          (BigInt(buf[off + 8]) << 56n) |
            (BigInt(buf[off + 9]) << 48n) |
            (BigInt(buf[off + 10]) << 40n) |
            (BigInt(buf[off + 11]) << 32n) |
            (BigInt(buf[off + 12]) << 24n) |
            (BigInt(buf[off + 13]) << 16n) |
            (BigInt(buf[off + 14]) << 8n) |
            BigInt(buf[off + 15]),
        )
        header = 16
      }
      if (size < header || off + size > buf.length) break
      const payloadStart = off + header
      const payloadEnd = off + size
      const payload = buf.slice(payloadStart, payloadEnd)
      if (boxType === 'ispe' && payload.length >= 12) {
        const w = (payload[4] << 24) | (payload[5] << 16) | (payload[6] << 8) | payload[7]
        const h = (payload[8] << 24) | (payload[9] << 16) | (payload[10] << 8) | payload[11]
        if (w > 0 && h > 0) {
          found = { w, h }
          return false
        }
      }
      const containers = ['meta', 'iprp', 'moov', 'trak', 'mdia', 'minf', 'stbl', 'stsd', 'ipco']
      if (containers.includes(boxType)) {
        let child = payload
        if (payload.length >= 4) child = payload.slice(4)
        if (!walk(child)) return false
      }
      off += size
    }
    return true
  }
  walk(body)
  return found
}

/** Returns width and height from image bytes, or defaults on failure. */
export function imageDimensions(body: Uint8Array | null, mime: string): { w: number; h: number } {
  if (!body || body.length === 0) return { w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT }
  const std = dimensionsFromStandard(body)
  if (std) return std
  const m = mime.trim().toLowerCase()
  if (m === 'image/webp' || isWebP(body)) {
    const d = webpDimensions(body)
    if (d) return d
  }
  if (m === 'image/avif' || isAVIF(body)) {
    const d = avifDimensions(body)
    if (d) return d
  }
  return { w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT }
}

export function decodeDataUri(uri: string): Asset | null {
  const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/s.exec(uri)
  if (!match) return null
  const mime = match[1] || 'application/octet-stream'
  const data = match[2]
  if (/;base64/i.test(uri.slice(0, uri.indexOf(',') + 1))) {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return { mime, bytes }
  }
  const decoded = decodeURIComponent(data)
  const bytes = new TextEncoder().encode(decoded)
  return { mime, bytes }
}

export function encodeDataUri(mime: string, bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return `data:${mime};base64,${btoa(binary)}`
}
