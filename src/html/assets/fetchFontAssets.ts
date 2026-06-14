import type { PsrtDocument } from '../../types.js'
import { resolveAssetReference } from './refs.js'
import {
  fetchFontBundle,
  isGoogleFontUrl,
  normalizeGoogleFontUrl,
  type FontBundleMap,
} from './googleFonts.js'

export type FetchFn = typeof fetch

function collectFontUrls(docs: PsrtDocument[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const doc of docs) {
    const consts = doc.consts ?? {}
    for (const font of doc.fonts ?? []) {
      const u = resolveAssetReference(font, consts)
      if (!u || seen.has(u)) continue
      seen.add(u)
      out.push(u)
    }
  }
  return out
}

/** Downloads every font declared in the documents and returns embedded woff2 faces keyed by resolved URL. */
export async function buildFontBundleMap(
  docs: PsrtDocument | PsrtDocument[],
  linksOnly: boolean,
  fetchFn: FetchFn = fetch,
): Promise<FontBundleMap> {
  const map: FontBundleMap = new Map()
  if (linksOnly) return map

  const list = Array.isArray(docs) ? docs : [docs]
  const urls = collectFontUrls(list)

  await Promise.all(
    urls.map(async (url) => {
      try {
        const faces = await fetchFontBundle(url, fetchFn)
        if (faces.length > 0) map.set(url, faces)
      } catch {
        /* caller may fall back to <link> for Google Fonts */
      }
    }),
  )

  return map
}

export function googleFontLinkHrefs(fontURLs: string[], fontBundles: FontBundleMap): string[] {
  const links: string[] = []
  const seen = new Set<string>()
  for (const raw of fontURLs) {
    const u = raw.trim()
    if (!u || !isGoogleFontUrl(u) || fontBundles.has(u)) continue
    const href = normalizeGoogleFontUrl(u)
    if (seen.has(href)) continue
    seen.add(href)
    links.push(href)
  }
  return links
}
