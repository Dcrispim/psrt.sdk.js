import type { CompileToHtmlPureOptions, PsrtDocument } from '../types.js'
import { buildFontBundleMap } from './assets/fetchFontAssets.js'
import type { EmbeddedFontFace, FontBundleMap } from './assets/googleFonts.js'
import { buildAssetMap, fontFamilyNameForURL, resolveAssetReference } from './assets/refs.js'
import { imageDimensions, type AssetMap } from './assets/dimensions.js'
import { resolveDocumentPure } from './resolve/resolveDocumentPure.js'
import { renderHtmlBundle } from './render/html.js'
import { CompileStep, notifyObservers } from './steps.js'
import { buildHtmlVariants, type HtmlVariant } from './variants.js'

function buildAssetMapWithSizes(
  variants: HtmlVariant[],
  linksOnly: boolean,
): { assets: AssetMap; canvasSizes: Record<string, { w: number; h: number }> } {
  const docs = variants.map((v) => v.doc)
  const assets = buildAssetMap(docs, linksOnly)
  const canvasSizes: Record<string, { w: number; h: number }> = {}
  for (const doc of docs) {
    for (const page of doc.pages) {
      const url = page.imageUrl.trim()
      if (canvasSizes[url]) continue
      const asset = assets.get(url)
      if (asset) {
        canvasSizes[url] = imageDimensions(asset.bytes, asset.mime)
      } else if (linksOnly) {
        canvasSizes[url] = imageDimensions(null, '')
      }
    }
  }
  return { assets, canvasSizes }
}

function isFontMime(mime: string): boolean {
  const m = mime.trim().toLowerCase()
  return (
    m.startsWith('font/') ||
    m === 'application/font-woff2' ||
    m === 'application/font-woff' ||
    m === 'application/x-font-ttf' ||
    m === 'application/vnd.ms-fontobject'
  )
}

/** Merges data-URI fonts from buildAssetMap (e.g. pre-embedded by the editor) into font bundles. */
function enrichFontBundlesFromAssets(
  docs: PsrtDocument[],
  assets: AssetMap,
  fontBundles: FontBundleMap,
): FontBundleMap {
  const out: FontBundleMap = new Map(fontBundles)
  for (const doc of docs) {
    const consts = doc.consts ?? {}
    const fonts = doc.fonts ?? []
    for (let i = 0; i < fonts.length; i++) {
      const u = resolveAssetReference(fonts[i] ?? '', consts).trim()
      if (!u) continue
      const existing = out.get(u)
      if (existing?.some((face) => face.family && face.family !== 'Font')) continue
      const asset = assets.get(u)
      if (!asset || !isFontMime(asset.mime)) continue
      const face: EmbeddedFontFace = {
        family: fontFamilyNameForURL(u, i),
        weight: '400',
        style: 'normal',
        mime: asset.mime,
        bytes: asset.bytes,
      }
      out.set(u, [face])
    }
  }
  return out
}

/** Compiles PsrtDocument to HTML using pure JavaScript (no WASM). HTTP fonts are not fetched; use compileToHtmlPureAsync. */
export function compileToHtmlPure(
  doc: PsrtDocument,
  options?: CompileToHtmlPureOptions,
): string {
  return compileToHtmlPureWithFonts(doc, options, new Map())
}

/** Downloads remote fonts, embeds woff2 as base64, then compiles HTML. */
export async function compileToHtmlPureAsync(
  doc: PsrtDocument,
  options?: CompileToHtmlPureOptions,
): Promise<string> {
  const opts = options ?? {}
  const primary = resolveDocumentPure(doc)
  const extraResolved = (opts.variants ?? []).map((v) => ({
    label: v.label,
    doc: resolveDocumentPure(v.doc),
  }))
  const htmlVariants = buildHtmlVariants(primary, extraResolved)
  const docs = htmlVariants.map((v) => v.doc)
  const fontBundles = await buildFontBundleMap(docs, !!opts.linksOnly, opts.fetch)
  return compileToHtmlPureWithFonts(doc, options, fontBundles)
}

function compileToHtmlPureWithFonts(
  doc: PsrtDocument,
  options: CompileToHtmlPureOptions | undefined,
  fontBundles: FontBundleMap,
): string {
  const opts = options ?? {}
  const primary = resolveDocumentPure(doc)
  notifyObservers(opts.observers, { step: CompileStep.RESOLVE, doc: primary })

  const extraResolved = (opts.variants ?? []).map((v) => ({
    label: v.label,
    doc: resolveDocumentPure(v.doc),
  }))

  const htmlVariants = buildHtmlVariants(primary, extraResolved)

  const { assets, canvasSizes } = buildAssetMapWithSizes(htmlVariants, !!opts.linksOnly)
  const docs = htmlVariants.map((v) => v.doc)
  const mergedFonts = enrichFontBundlesFromAssets(docs, assets, fontBundles)
  notifyObservers(opts.observers, {
    step: CompileStep.BUILD_ASSETS,
    assetCount: assets.size,
    canvasSizes,
  })

  return renderHtmlBundle(htmlVariants, assets, mergedFonts, opts, opts.observers)
}

export { resolveDocumentPure } from './resolve/resolveDocumentPure.js'
export {
  CompileStep,
  notifyObservers,
  type CompileStepContext,
  type CompileStepObserver,
  type CompileStepObservers,
} from './steps.js'
