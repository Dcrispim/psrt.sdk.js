import type { PsrtMask, PsrtPage, PsrtPathMask, PsrtText } from '../../types.js'
import type { AssetMap } from '../assets/dimensions.js'
import { imageDimensions } from '../assets/dimensions.js'
import { googleFontLinkHrefs } from '../assets/fetchFontAssets.js'
import { encodeDataUri } from '../assets/dimensions.js'
import { type FontBundleMap } from '../assets/googleFonts.js'
import {
  assetRef,
  faceFormat,
  fontFamilyNameForURL,
  isAssetReference,
} from '../assets/refs.js'
import { BlockMask, BlockPathMask, BlockText, pageBlocksByIndex } from '../document/pageBlocks.js'
import { appendTextLayerGeometryCSS } from '../geometry/textBlockGeometry.js'
import { backgroundColorFromStyle, textFontSizePx } from '../geometry/layoutHelpers.js'
import { adaptHTML } from '../style/adapter.js'
import { adaptMaskHTML } from '../style/maskAdapter.js'
import { adaptPathMaskHTML } from '../style/pathMaskAdapter.js'
import { TypeKey, TypePath, getFragmentString } from '../style/fragment.js'
import { htmlLayerCSS, pathDecorationAttrs } from '../style/render.js'
import { normalizeTextContent, renderInlineHTML } from '../text/inlineMarkup.js'
import { CompileStep, notifyObservers, type CompileStepObservers } from '../steps.js'
import type { CompileOptions } from '../../types.js'
import {
  type HtmlVariant,
  maskLayerDomId,
  overlayDomId,
  pageByName,
  pathMaskLayerDomId,
  textLayerDomId,
  variantLabels,
} from '../variants.js'
import { baseCSS, escapeHtmlAttr, variantClass, variantSwitcherCSS, writeVariantSwitcher } from './script.js'

function buildFontCSS(
  fontURLs: string[],
  fontBundles: FontBundleMap,
  linksOnly: boolean,
): { fontFacesCSS: string; fontLinkHrefs: string[]; bodyStack: string } {
  const bodyStack = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif'
  const empty = {
    fontFacesCSS: '',
    fontLinkHrefs: [] as string[],
    bodyStack,
  }
  if (fontURLs.length === 0) return empty

  let fb = ''
  for (let i = 0; i < fontURLs.length; i++) {
    const u = fontURLs[i]?.trim() ?? ''
    if (!u) continue
    const name = fontFamilyNameForURL(u, i)
    const faces = fontBundles.get(u)

    if (faces && faces.length > 0) {
      for (const face of faces) {
        const family = face.family || name
        const src = `url(${encodeDataUri(face.mime, face.bytes)})`
        const format = faceFormat(face.mime)
        fb += `@font-face{font-family:'${family}';font-weight:${face.weight};font-style:${face.style};src:${src}${format};font-display:swap;}\n`
      }
      continue
    }

    if (linksOnly) {
      fb += `@font-face{font-family:'${name}';src:url(${u});font-display:swap;}\n`
    }
  }

  const fontLinkHrefs = googleFontLinkHrefs(fontURLs, fontBundles)
  if (!fb && fontLinkHrefs.length === 0) return empty

  return { fontFacesCSS: fb, fontLinkHrefs, bodyStack }
}

function replaceCompiledFontNames(html: string, fontURLs: string[]): string {
  let out = html
  for (let i = 0; i < fontURLs.length; i++) {
    const compiled = `CompiledFont_${i}`
    const name = fontFamilyNameForURL(fontURLs[i]?.trim() ?? '', i)
    if (name !== compiled) {
      out = out.replaceAll(compiled, name)
    }
  }
  return out
}

function pageBackgroundCSS(style: PsrtPage['style']): string {
  const bg = backgroundColorFromStyle(style)
  return bg ? `background:${bg};` : ''
}

function writeTextLayer(
  parts: string[],
  t: PsrtText,
  assets: AssetMap,
  canvasW: number,
  canvasH: number,
  variantIndex: number,
  linksOnly: boolean,
  pageName: string,
  observers: CompileStepObservers | undefined,
): void {
  const content = normalizeTextContent(t.content)
  const fontPx = textFontSizePx(t.textSize, canvasW, canvasH)
  const frags = adaptHTML({
    text: t,
    canvasW,
    canvasH,
    fontSizePx: fontPx,
    htmlCompile: true,
    pageSlug: pageName,
    textIndex: t.index,
  })
  notifyObservers(observers, {
    step: CompileStep.ADAPT_STYLE,
    pageName,
    blockIndex: t.index,
    kind: 'text',
  })

  let { boxCSS, textCSS } = htmlLayerCSS(frags)
  boxCSS = appendTextLayerGeometryCSS(boxCSS, t, content, canvasW, canvasH)

  const layerId = textLayerDomId(pageName, t.index, variantIndex)
  const classes = `text-layer psrt-text ${variantClass(variantIndex)}`

  parts.push(
    `<div id="${escapeHtmlAttr(layerId)}" class="${classes}" style="${escapeHtmlAttr(boxCSS)}">`,
  )

  const imgRef = (t.imageRef ?? '').trim()
  if (imgRef && isAssetReference(imgRef)) {
    const aa = assets.get(imgRef)
    if (linksOnly || (aa && aa.mime.startsWith('image/'))) {
      const refURI = assetRef(imgRef, aa, linksOnly)
      parts.push(
        `<img class="text-ref-img" src="${escapeHtmlAttr(refURI)}" alt="" style="margin:0 0 .25em 0;display:block;max-width:100%;height:auto"/>`,
      )
    }
  }

  const inlineHTML = renderInlineHTML(content)
  notifyObservers(observers, {
    step: CompileStep.RENDER_INLINE,
    pageName,
    textIndex: t.index,
    htmlLength: inlineHTML.length,
  })

  notifyObservers(observers, {
    step: CompileStep.RENDER_TEXT,
    pageName,
    textIndex: t.index,
    contentPreview: content.slice(0, 80),
  })

  if (textCSS) {
    parts.push(`<span style="${escapeHtmlAttr(textCSS)}">`)
  } else {
    parts.push('<span>')
  }
  parts.push(inlineHTML)
  parts.push('</span></div>')
}

function writeMaskLayer(
  parts: string[],
  m: PsrtMask,
  assets: AssetMap,
  canvasW: number,
  canvasH: number,
  variantIndex: number,
  linksOnly: boolean,
  pageName: string,
  observers: CompileStepObservers | undefined,
): void {
  const frags = adaptMaskHTML({
    text: {
      x: m.x,
      y: m.y,
      width: m.width,
      textSize: 0,
      style: m.style,
      index: m.index,
      content: '',
    },
    mask: m,
    canvasW,
    canvasH,
    htmlCompile: true,
    pageSlug: pageName,
    textIndex: m.index,
  })
  notifyObservers(observers, {
    step: CompileStep.ADAPT_STYLE,
    pageName,
    blockIndex: m.index,
    kind: 'mask',
  })

  let { boxCSS } = htmlLayerCSS(frags)
  const imgRef = (m.imageRef ?? '').trim()
  if (imgRef && isAssetReference(imgRef)) {
    const aa = assets.get(imgRef)
    if (linksOnly || (aa && aa.mime.startsWith('image/'))) {
      const refURI = assetRef(imgRef, aa, linksOnly)
      if (boxCSS && !boxCSS.endsWith(';')) boxCSS += ';'
      boxCSS += `background-image:url(${refURI});background-size:cover;background-position:center;background-repeat:no-repeat;`
    }
  }

  const layerId = maskLayerDomId(pageName, m.index, variantIndex)
  const classes = `text-layer psrt-mask ${variantClass(variantIndex)}`

  notifyObservers(observers, {
    step: CompileStep.RENDER_MASK,
    pageName,
    maskIndex: m.index,
  })

  parts.push(`<div id="${escapeHtmlAttr(layerId)}" class="${classes}" style="${escapeHtmlAttr(boxCSS)}"></div>`)
}

function writePathMaskLayer(
  parts: string[],
  m: PsrtPathMask,
  assets: AssetMap,
  canvasW: number,
  canvasH: number,
  variantIndex: number,
  linksOnly: boolean,
  pageName: string,
  observers: CompileStepObservers | undefined,
): void {
  const frags = adaptPathMaskHTML({
    text: { x: m.x, y: m.y, width: m.width, textSize: 0, style: m.style, index: m.index, content: '' },
    pathMask: m,
    canvasW,
    canvasH,
    htmlCompile: true,
    pageSlug: pageName,
    textIndex: m.index,
  })
  notifyObservers(observers, {
    step: CompileStep.ADAPT_STYLE,
    pageName,
    blockIndex: m.index,
    kind: 'pathMask',
  })

  const { boxCSS } = htmlLayerCSS(frags)
  const pathFrag = frags.find((f) => getFragmentString(f, TypeKey) === TypePath)
  const pathAttrs = pathDecorationAttrs(pathFrag)

  const layerId = pathMaskLayerDomId(pageName, m.index, variantIndex)
  const classes = `text-layer psrt-mask psrt-path-mask ${variantClass(variantIndex)}`

  notifyObservers(observers, {
    step: CompileStep.RENDER_MASK,
    pageName,
    maskIndex: m.index,
  })

  parts.push(`<div id="${escapeHtmlAttr(layerId)}" class="${classes}" style="${escapeHtmlAttr(boxCSS)}">`)

  const clipID = `psrt-pathmask-${pageName}-${variantIndex}-${m.index}-clip`
  const d = escapeHtmlAttr(m.path)
  parts.push('<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">')
  parts.push(`<defs><clipPath id="${escapeHtmlAttr(clipID)}"><path d="${d}"/></clipPath></defs>`)
  parts.push(pathAttrs ? `<path d="${d}" ${pathAttrs}/>` : `<path d="${d}" fill="transparent"/>`)

  const imgRef = (m.imageRef ?? '').trim()
  if (imgRef && isAssetReference(imgRef)) {
    const aa = assets.get(imgRef)
    if (linksOnly || (aa && aa.mime.startsWith('image/'))) {
      const refURI = assetRef(imgRef, aa, linksOnly)
      parts.push(
        `<image x="0" y="0" width="100" height="100" href="${escapeHtmlAttr(refURI)}" clip-path="url(#${escapeHtmlAttr(clipID)})" preserveAspectRatio="xMidYMid slice"/>`,
      )
    }
  }

  parts.push('</svg></div>')
}

function writeVariantOverlay(
  parts: string[],
  variantPage: PsrtPage,
  variantIndex: number,
  multiVariant: boolean,
  assets: AssetMap,
  canvasW: number,
  canvasH: number,
  linksOnly: boolean,
  observers: CompileStepObservers | undefined,
): void {
  const overlayId = overlayDomId(variantPage.name, variantIndex)
  let overlayClasses = `slide-overlay psrt-overlay ${variantClass(variantIndex)}`
  if (multiVariant && variantIndex > 0) {
    overlayClasses += ' psrt-hidden'
  }

  parts.push(`<div id="${escapeHtmlAttr(overlayId)}" class="${overlayClasses}">`)

  for (const entry of pageBlocksByIndex(variantPage)) {
    if (entry.kind === BlockText && entry.text) {
      writeTextLayer(
        parts,
        entry.text,
        assets,
        canvasW,
        canvasH,
        variantIndex,
        linksOnly,
        variantPage.name,
        observers,
      )
    } else if (entry.kind === BlockMask && entry.mask) {
      writeMaskLayer(
        parts,
        entry.mask,
        assets,
        canvasW,
        canvasH,
        variantIndex,
        linksOnly,
        variantPage.name,
        observers,
      )
    } else if (entry.kind === BlockPathMask && entry.pathMask) {
      writePathMaskLayer(
        parts,
        entry.pathMask,
        assets,
        canvasW,
        canvasH,
        variantIndex,
        linksOnly,
        variantPage.name,
        observers,
      )
    }
  }

  parts.push('</div>')
}

function writeSlide(
  parts: string[],
  page: PsrtPage,
  variants: HtmlVariant[],
  assets: AssetMap,
  opts: CompileOptions,
  pageIndex: number,
  multiVariant: boolean,
  observers: CompileStepObservers | undefined,
): void {
  const bg = pageBackgroundCSS(page.style)
  const imgURL = page.imageUrl.trim()
  const a = assets.get(imgURL)
  if (!opts.linksOnly && !a) {
    throw new Error(`missing fetched asset for page image "${imgURL}"`)
  }
  const src = assetRef(imgURL, a, !!opts.linksOnly)
  let canvasW: number
  let canvasH: number
  if (a) {
    const dims = imageDimensions(a.bytes, a.mime)
    canvasW = dims.w
    canvasH = dims.h
  } else {
    const dims = imageDimensions(null, '')
    canvasW = dims.w
    canvasH = dims.h
  }

  notifyObservers(observers, {
    step: CompileStep.RENDER_PAGE,
    pageIndex,
    pageName: page.name,
    canvasW,
    canvasH,
  })

  let slideStyle = `width:${canvasW}px`
  if (bg) slideStyle += `;${bg}`

  parts.push(`<div class="slide" style="${escapeHtmlAttr(slideStyle)}">`)
  parts.push(`<img class="slide-img" src="${escapeHtmlAttr(src)}" alt=""/>`)
  parts.push('<div class="slide-overlays">')

  for (let vi = 0; vi < variants.length; vi++) {
    const variantPage = pageByName(variants[vi].doc, page.name)
    if (!variantPage) continue
    writeVariantOverlay(
      parts,
      variantPage,
      vi,
      multiVariant,
      assets,
      canvasW,
      canvasH,
      !!opts.linksOnly,
      observers,
    )
  }

  parts.push('</div></div>')
}

export function renderHtmlBundle(
  variants: HtmlVariant[],
  assets: AssetMap,
  fontBundles: FontBundleMap,
  opts: CompileOptions,
  observers?: CompileStepObservers,
): string {
  if (variants.length === 0) {
    throw new Error('no variants')
  }

  const primary = variants[0].doc
  const labels = variantLabels(variants)
  const multiVariant = variants.length > 1
  const includeVariantUI = multiVariant && !opts.noScript

  const { fontFacesCSS, fontLinkHrefs, bodyStack } = buildFontCSS(
    primary.fonts ?? [],
    fontBundles,
    !!opts.linksOnly,
  )

  notifyObservers(observers, {
    step: CompileStep.RENDER_FONTS,
    fontCount: primary.fonts?.length ?? 0,
  })

  let title = 'PSRT'
  if (primary.pages.length > 0 && primary.pages[0]?.name.trim()) {
    title = primary.pages[0].name.trim()
  }

  notifyObservers(observers, {
    step: CompileStep.RENDER_HEAD,
    title,
  })

  const parts: string[] = []
  parts.push(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtmlAttr(title)}</title>
${fontLinkHrefs.map((href) => `<link rel="stylesheet" href="${escapeHtmlAttr(href)}"/>`).join('\n')}
<style>`)
  parts.push(baseCSS(fontFacesCSS))
  if (multiVariant) parts.push(variantSwitcherCSS())
  parts.push(`
body{font-family:${bodyStack};margin:0;padding:0;background:#111;overflow-x:auto;}
</style>
</head>
<body>
<main class="slides-wrap">
`)

  for (let i = 0; i < primary.pages.length; i++) {
    writeSlide(parts, primary.pages[i], variants, assets, opts, i, multiVariant, observers)
  }

  parts.push(`
</main>
`)
  if (includeVariantUI) parts.push(writeVariantSwitcher(labels))
  parts.push(`
</body>
</html>`)

  const html = replaceCompiledFontNames(parts.join(''), primary.fonts ?? [])
  notifyObservers(observers, {
    step: CompileStep.FINALIZE,
    htmlLength: html.length,
    pageCount: primary.pages.length,
  })
  return html
}
