/** JSON object or compact style string from PSRT. */
export type PsrtStyle = Record<string, unknown> | string

/** Canonical PSRT document representation. */
export interface PsrtDocument {
  pages: PsrtPage[]
  fonts: string[]
  consts: Record<string, string>
}

export type Document = PsrtDocument

export interface PsrtPage {
  name: string
  style: PsrtStyle
  imageUrl: string
  texts: PsrtText[]
  masks?: PsrtMask[]
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

export interface CompileOptions {
  /** Keep original asset URLs instead of embedding data URIs. */
  linksOnly?: boolean
  /** Omit the HTML variant switcher script (Ctrl+L). */
  noScript?: boolean
}

export interface WasmResult {
  ok: boolean
  err?: string
  data?: Uint8Array
}
