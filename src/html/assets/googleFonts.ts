import { decodeDataUri, type Asset } from './dimensions.js'

const WOFF2_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export interface EmbeddedFontFace {
  family: string
  weight: string
  style: string
  mime: string
  bytes: Uint8Array
}

export type FontBundleMap = Map<string, EmbeddedFontFace[]>

export function isGoogleFontUrl(url: string): boolean {
  try {
    const h = new URL(url.trim()).hostname.toLowerCase()
    return h === 'fonts.googleapis.com' || h === 'fonts.google.com'
  } catch {
    return false
  }
}

/** Normalizes Google Fonts download / css2 / @import URLs to a css2 stylesheet URL. */
export function normalizeGoogleFontUrl(url: string): string {
  const trimmed = url.trim()
  try {
    const u = new URL(trimmed)
    const host = u.hostname.toLowerCase()
    if (host === 'fonts.google.com') {
      const family = u.searchParams.get('family')
      if (family) {
        const encoded = family.split(':')[0]?.trim().replace(/\s+/g, '+') ?? family
        return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`
      }
    }
    if (host === 'fonts.googleapis.com') {
      if (!u.searchParams.has('display')) {
        u.searchParams.set('display', 'swap')
      }
      return u.toString()
    }
  } catch {
    /* not a URL */
  }
  return trimmed
}

export function googleFontFamilyFromUrl(url: string): string | null {
  const normalized = normalizeGoogleFontUrl(url)
  try {
    const u = new URL(normalized)
    const family = u.searchParams.get('family')
    if (!family) return null
    return family.split(':')[0]?.replace(/\+/g, ' ').trim() ?? null
  } catch {
    return null
  }
}

function cssProp(block: string, prop: string): string {
  const re = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i')
  const m = re.exec(block)
  return m?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? ''
}

function extractFontFaceBlocks(css: string): string[] {
  const blocks: string[] = []
  const re = /@font-face\s*\{([^}]*)\}/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    if (m[1]) blocks.push(m[1])
  }
  return blocks
}

function woff2UrlFromBlock(block: string): string | null {
  const m = /url\(\s*([^)]+)\s*\)\s*format\(\s*['"]woff2['"]\s*\)/i.exec(block)
  if (!m?.[1]) return null
  return m[1].trim().replace(/^['"]|['"]$/g, '')
}

function mimeFromFontUrl(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('.woff2')) return 'font/woff2'
  if (lower.includes('.woff')) return 'font/woff'
  if (lower.includes('.otf')) return 'font/otf'
  if (lower.includes('.ttf')) return 'font/ttf'
  return 'font/woff2'
}

async function downloadFont(
  url: string,
  fetchFn: typeof fetch,
): Promise<{ mime: string; bytes: Uint8Array }> {
  const res = await fetchFn(url, { headers: { 'User-Agent': WOFF2_USER_AGENT } })
  if (!res.ok) {
    throw new Error(`font download failed (${res.status}): ${url}`)
  }
  const ct = res.headers.get('content-type')?.split(';')[0]?.trim()
  const mime = ct && ct.startsWith('font/') ? ct : mimeFromFontUrl(url)
  return { mime, bytes: new Uint8Array(await res.arrayBuffer()) }
}

async function facesFromStylesheetCss(
  css: string,
  fallbackFamily: string,
  fetchFn: typeof fetch,
): Promise<EmbeddedFontFace[]> {
  const faces: EmbeddedFontFace[] = []
  for (const block of extractFontFaceBlocks(css)) {
    const woff2 = woff2UrlFromBlock(block)
    if (!woff2) continue
    const family = cssProp(block, 'font-family') || fallbackFamily
    const weight = cssProp(block, 'font-weight') || '400'
    const style = cssProp(block, 'font-style') || 'normal'
    const { mime, bytes } = await downloadFont(woff2, fetchFn)
    faces.push({ family, weight, style, mime, bytes })
  }
  return faces
}

async function fetchGoogleFontFaces(
  url: string,
  fetchFn: typeof fetch,
): Promise<EmbeddedFontFace[]> {
  const cssUrl = normalizeGoogleFontUrl(url)
  const fallbackFamily = googleFontFamilyFromUrl(cssUrl) ?? 'Font'
  const res = await fetchFn(cssUrl, { headers: { 'User-Agent': WOFF2_USER_AGENT } })
  if (!res.ok) {
    throw new Error(`Google Fonts CSS failed (${res.status}): ${cssUrl}`)
  }
  return facesFromStylesheetCss(await res.text(), fallbackFamily, fetchFn)
}

async function fetchDirectFontFile(
  url: string,
  fetchFn: typeof fetch,
): Promise<EmbeddedFontFace[]> {
  const { mime, bytes } = await downloadFont(url, fetchFn)
  const family = googleFontFamilyFromUrl(url) ?? 'Font'
  return [{ family, weight: '400', style: 'normal', mime, bytes }]
}

async function facesFromCssAsset(
  asset: Asset,
  fallbackFamily: string,
  fetchFn: typeof fetch,
): Promise<EmbeddedFontFace[]> {
  const css = new TextDecoder().decode(asset.bytes)
  return facesFromStylesheetCss(css, fallbackFamily, fetchFn)
}

/** Downloads and embeds all font faces for one document font URL. */
export async function fetchFontBundle(
  rawUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<EmbeddedFontFace[]> {
  const url = rawUrl.trim()
  if (!url) return []

  if (url.startsWith('data:')) {
    const asset = decodeDataUri(url)
    if (!asset) return []
    if (asset.mime.startsWith('text/css') || asset.mime === 'text/plain') {
      return facesFromCssAsset(asset, 'Font', fetchFn)
    }
    // Binary fonts pre-embedded as data URIs are enriched in compilePure with index-based names.
    return []
  }

  if (isGoogleFontUrl(url)) {
    return fetchGoogleFontFaces(url, fetchFn)
  }

  const lower = url.toLowerCase()
  if (/\.(woff2?|ttf|otf)(\?|$)/.test(lower)) {
    return fetchDirectFontFile(url, fetchFn)
  }

  if (lower.includes('fonts.googleapis.com') || lower.endsWith('.css')) {
    const cssUrl = normalizeGoogleFontUrl(url)
    const res = await fetchFn(cssUrl, { headers: { 'User-Agent': WOFF2_USER_AGENT } })
    if (!res.ok) throw new Error(`font stylesheet failed (${res.status}): ${cssUrl}`)
    const fallback = googleFontFamilyFromUrl(cssUrl) ?? 'Font'
    return facesFromStylesheetCss(await res.text(), fallback, fetchFn)
  }

  return fetchDirectFontFile(url, fetchFn)
}
