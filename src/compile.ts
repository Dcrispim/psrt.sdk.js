import { invokeCompileToHtml, invokeCompileToSvg } from './wasm.js'
import type { CompileOptions, PsrtDocument } from './types.js'

/** Compiles the document to a self-contained HTML string. */
export function compileToHtml(doc: PsrtDocument | string, options?: CompileOptions): string {
  return invokeCompileToHtml(doc, options)
}

/** Compiles one page of the document to SVG. */
export function compileToSvg(
  doc: PsrtDocument | string,
  pageName: string,
  options?: CompileOptions
): string {
  return invokeCompileToSvg(doc, pageName, options)
}
