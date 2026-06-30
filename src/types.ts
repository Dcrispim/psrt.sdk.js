/** JSON object or compact style string from PSRT. */
export type PsrtStyle = Record<string, unknown> | string

/**
 * Behavioural $CONSTS entry (`@type:render | value`). `type` selects a renderer
 * (link, desc, …); `render` is the inline text; `value` is the handler payload
 * (URL, modal content, …). Consumers interpret `type`/`value` — no core coupling.
 */
export interface InteractiveConst {
  type: string
  render: string
  value: string
}

/** Canonical PSRT document representation. */
export interface PsrtDocument {
  pages: PsrtPage[]
  fonts: string[]
  consts: Record<string, string>
  /** Interactive $CONSTS entries, keyed by the `type:render` reference token. */
  iConst?: Record<string, InteractiveConst>
  /** Embedded assets from $SOURCE block (URL → data URI). */
  sources?: Record<string, string>
}

export type Document = PsrtDocument

export interface PsrtPage {
  name: string
  style: PsrtStyle
  imageUrl: string
  texts: PsrtText[]
  masks?: PsrtMask[]
  pathMasks?: PsrtPathMask[]
}

export type Page = PsrtPage

export interface PsrtText {
  x: number
  y: number
  width: number
  textSize: number
  style: PsrtStyle
  index: number
  content: string
  imageRef?: string
}

/** PSRT text block (>> header), not editor UI model. */
export type TextBlock = PsrtText

export interface PsrtMask {
  x: number
  y: number
  width: number
  height: number
  style: PsrtStyle
  index: number
  imageRef?: string
}

export interface PositionFields {
  x?: number
  y?: number
  width?: number
  textSize?: number
}

export interface MaskPositionFields {
  x?: number
  y?: number
  width?: number
  height?: number
}

/** PSRT path mask block (~~ header): arbitrary SVG-path-shaped coverage. */
export interface PsrtPathMask {
  x: number
  y: number
  width: number
  height: number
  style: PsrtStyle
  index: number
  /** SVG path `d` attribute content, interpreted in a 0-100 local viewBox. */
  path: string
  imageRef?: string
}

export interface PathMaskPositionFields {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface CompileOptions {
  /** Keep original asset URLs instead of embedding data URIs. */
  linksOnly?: boolean
  /** Omit the HTML variant switcher script (Ctrl+L). */
  noScript?: boolean
}

export interface CompileToHtmlPureOptions extends CompileOptions {
  observers?: import('./html/steps.js').CompileStepObservers
  /** Custom fetch for font downloads (Node, tests). Defaults to global fetch. */
  fetch?: typeof fetch
  /** Additional PSRT variants bundled into the same HTML (Ctrl+L to switch). */
  variants?: PsrtVariant[]
}

/** One PSRT document bundled as an HTML variant alongside the primary doc. */
export interface PsrtVariant {
  /** Label shown in the variant switcher hint (defaults to variant-N). */
  label?: string
  doc: PsrtDocument
}

export interface WasmResult {
  ok: boolean
  err?: string
  data?: Uint8Array
}

/** Options for initPsrt() — applied once, when the core boots. */
export interface InitOptions {
  /** Caps how many SVG path commands are written per line in a ~~ block body. Defaults to 20. */
  pathCommandsPerLine?: number
}
