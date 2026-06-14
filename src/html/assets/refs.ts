import { expandConsts } from '../text/expandConsts.js'
import type { PsrtDocument } from '../../types.js'
import { decodeDataUri, encodeDataUri, type Asset, type AssetMap } from './dimensions.js'
import { googleFontFamilyFromUrl, normalizeGoogleFontUrl } from './googleFonts.js'

export function looksLikeHttpUrl(raw: string): boolean {
  const u = raw.trim().toLowerCase()
  return u.startsWith('http://') || u.startsWith('https://')
}

export function isDataUri(raw: string): boolean {
  return raw.startsWith('data:')
}

function hasWindowsDrive(s: string): boolean {
  if (s.length < 2 || s[1] !== ':') return false
  const c = s[0]
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}

export function isLocalAssetRef(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  if (looksLikeHttpUrl(trimmed)) return false
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('file:')) return true
  return trimmed.includes('\\') || trimmed.includes('/') || hasWindowsDrive(trimmed)
}

export function isAssetReference(raw: string): boolean {
  return looksLikeHttpUrl(raw) || isLocalAssetRef(raw) || isDataUri(raw)
}

export function resolveAssetReference(raw: string, consts: Record<string, string>): string {
  return expandConsts(raw.trim(), consts)
}

export function collectAssetUrls(doc: PsrtDocument): string[] {
  const consts = doc.consts ?? {}
  const seen = new Set<string>()
  const out: string[] = []
  const add = (raw: string | undefined) => {
    const u = resolveAssetReference(raw ?? '', consts)
    if (!u || !isAssetReference(u) || seen.has(u)) return
    seen.add(u)
    out.push(u)
  }
  for (const page of doc.pages ?? []) {
    add(page.imageUrl)
    for (const t of page.texts ?? []) add(t.imageRef)
    for (const m of page.masks ?? []) add(m.imageRef)
  }
  for (const f of doc.fonts ?? []) add(f)
  return out
}

export function assetRef(resolvedUrl: string, asset: Asset | undefined, linksOnly: boolean): string {
  if (linksOnly) return resolvedUrl
  if (!asset) return resolvedUrl
  return encodeDataUri(asset.mime, asset.bytes)
}

export function fontSrcUrl(fontUrl: string, asset: Asset | undefined, linksOnly: boolean): string {
  if (linksOnly) return `url(${fontUrl})`
  if (!asset) return `url(${fontUrl})`
  return `url(${encodeDataUri(asset.mime, asset.bytes)})`
}

export function buildAssetMap(docs: PsrtDocument | PsrtDocument[], linksOnly: boolean): AssetMap {
  const list = Array.isArray(docs) ? docs : [docs]
  const map: AssetMap = new Map()
  if (linksOnly) return map
  for (const doc of list) {
    for (const url of collectAssetUrls(doc)) {
      if (isDataUri(url)) {
        const asset = decodeDataUri(url)
        if (asset) map.set(url, asset)
      }
    }
    for (const font of doc.fonts ?? []) {
      const u = resolveAssetReference(font, doc.consts ?? {})
      if (isDataUri(u)) {
        const asset = decodeDataUri(u)
        if (asset) map.set(u, asset)
      }
    }
  }
  return map
}

export function faceFormat(mime: string): string {
  switch (mime.trim().toLowerCase()) {
    case 'font/woff2':
      return " format('woff2')"
    case 'font/woff':
      return " format('woff')"
    case 'font/ttf':
      return " format('truetype')"
    case 'font/otf':
      return " format('opentype')"
    default:
      return ''
  }
}

export function fontFamilyNameForURL(fontURL: string, index: number): string {
  const fromGoogle = googleFontFamilyFromUrl(fontURL)
  if (fromGoogle) return fromGoogle

  try {
    const u = new URL(normalizeGoogleFontUrl(fontURL))
    const family = u.searchParams.get('family')
    if (family) {
      const name = family.split(':')[0]?.replace(/\+/g, ' ')
      if (name) return name
    }
  } catch {
    /* not a URL */
  }
  return `CompiledFont_${index}`
}
