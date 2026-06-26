import type { PsrtDocument, PsrtPage } from '../types.js'

export interface HtmlVariant {
  label: string
  doc: PsrtDocument
}

/** Sanitizes a page name for use in HTML id attributes. */
export function slugPageName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'page'
}

export function pageByName(doc: PsrtDocument, pageName: string): PsrtPage | undefined {
  return doc.pages.find((p) => p.name === pageName)
}

export function variantLabels(variants: HtmlVariant[]): string[] {
  return variants.map((v, i) => {
    const l = v.label.trim()
    return l || (i === 0 ? 'PSRT' : `variant-${i}`)
  })
}

/** DOM id for a variant overlay on a page. */
export function overlayDomId(pageName: string, variantIndex: number): string {
  return `psrt-overlay-${slugPageName(pageName)}-v${variantIndex}`
}

/** DOM id for a text block (page + index + variant). */
export function textLayerDomId(pageName: string, textIndex: number, variantIndex: number): string {
  return `psrt-text-${slugPageName(pageName)}-${textIndex}-v${variantIndex}`
}

/** DOM id for a mask block (page + index + variant). */
export function maskLayerDomId(pageName: string, maskIndex: number, variantIndex: number): string {
  return `psrt-mask-${slugPageName(pageName)}-${maskIndex}-v${variantIndex}`
}

/** DOM id for a path mask block (page + index + variant). */
export function pathMaskLayerDomId(pageName: string, maskIndex: number, variantIndex: number): string {
  return `psrt-pathmask-${slugPageName(pageName)}-${maskIndex}-v${variantIndex}`
}

export function buildHtmlVariants(
  primary: PsrtDocument,
  extra?: { label?: string; doc: PsrtDocument }[],
): HtmlVariant[] {
  const variants: HtmlVariant[] = [{ label: 'PSRT', doc: primary }]
  for (const item of extra ?? []) {
    const label = item.label?.trim() || `variant-${variants.length}`
    variants.push({ label, doc: item.doc })
  }
  return variants
}
