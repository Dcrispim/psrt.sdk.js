import { invokeCompileToHtml, invokeCompileToSvg } from './wasm.js'
import {
  compileToHtmlPure as compileToHtmlPureImpl,
  compileToHtmlPureAsync as compileToHtmlPureAsyncImpl,
} from './html/compilePure.js'
import type { CompileOptions, CompileToHtmlPureOptions, PsrtDocument } from './types.js'

/** Compiles the document to a self-contained HTML string (WASM). */
export function compileToHtml(doc: PsrtDocument | string, options?: CompileOptions): string {
  return invokeCompileToHtml(doc, options)
}

/** Compiles PsrtDocument to HTML using pure JavaScript (no WASM, no initPsrt). */
export function compileToHtmlPure(doc: PsrtDocument, options?: CompileToHtmlPureOptions): string {
  return compileToHtmlPureImpl(doc, options)
}

/** Like compileToHtmlPure but downloads remote fonts and embeds woff2 as base64. */
export function compileToHtmlPureAsync(
  doc: PsrtDocument,
  options?: CompileToHtmlPureOptions,
): Promise<string> {
  return compileToHtmlPureAsyncImpl(doc, options)
}

export {
  resolveDocumentPure,
  CompileStep,
  notifyObservers,
  type CompileStepContext,
  type CompileStepObserver,
  type CompileStepObservers,
} from './html/compilePure.js'

/** Compiles one page of the document to SVG. */
export function compileToSvg(
  doc: PsrtDocument | string,
  pageName: string,
  options?: CompileOptions
): string {
  return invokeCompileToSvg(doc, pageName, options)
}
