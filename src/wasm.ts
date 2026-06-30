import type { CompileOptions, InitOptions, PsrtDocument, PsrtStyle, WasmResult } from './types.js'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

let wasmExports: Record<string, (...args: unknown[]) => WasmResult> | null = null

function decodeData(data: Uint8Array): string {
  return decoder.decode(data)
}

function encodeDoc(doc: PsrtDocument): Uint8Array {
  return encoder.encode(JSON.stringify(doc))
}

function encodeInput(input: PsrtDocument | string): Uint8Array | string {
  return typeof input === 'string' ? input : encodeDoc(input)
}

function encodeArg(arg: unknown): unknown {
  if (arg === undefined) {
    return undefined
  }
  if (arg instanceof Uint8Array) {
    return arg
  }
  if (typeof arg === 'object' && arg !== null) {
    return encoder.encode(JSON.stringify(arg))
  }
  return arg
}

function call(name: string, ...args: unknown[]): WasmResult {
  if (!wasmExports) {
    throw new Error('PSRT is not initialized; call initPsrt() first')
  }
  const fn = wasmExports[name]
  if (!fn) {
    throw new Error(`unknown PSRT handler: ${name}`)
  }
  const encoded = args.map(encodeArg)
  return fn(...encoded) as WasmResult
}

function requireBytes(result: WasmResult): Uint8Array {
  if (!result.ok) {
    throw new Error(result.err ?? 'PSRT call failed')
  }
  if (!result.data) {
    throw new Error('PSRT call returned no data')
  }
  return result.data
}

function parseDocResult(result: WasmResult): PsrtDocument {
  return JSON.parse(decodeData(requireBytes(result))) as PsrtDocument
}

function parseTextResult(result: WasmResult): string {
  return decodeData(requireBytes(result))
}

function parseJSONResult<T>(result: WasmResult): T {
  return JSON.parse(decodeData(requireBytes(result))) as T
}

export function invokeDocMutation(
  handler: string,
  doc: PsrtDocument,
  ...extra: unknown[]
): PsrtDocument {
  return parseDocResult(call(handler, encodeDoc(doc), ...extra))
}

export function invokeDocQuery<T>(handler: string, doc: PsrtDocument, ...extra: unknown[]): T {
  return parseJSONResult<T>(call(handler, encodeDoc(doc), ...extra))
}

export function invokeRaw<T>(handler: string, ...args: unknown[]): T {
  return parseJSONResult<T>(call(handler, ...args))
}

export function invokeText(handler: string, ...args: unknown[]): string {
  return parseTextResult(call(handler, ...args))
}

export function invokeStyleMutation(handler: string, style: PsrtStyle, ...extra: unknown[]): PsrtStyle {
  return parseJSONResult<PsrtStyle>(call(handler, style, ...extra))
}

export function invokeParse(psrtString: string): PsrtDocument {
  return parseDocResult(call('parse', psrtString))
}

export function invokeParseFast(psrtString: string): PsrtDocument {
  return parseDocResult(call('parseFast', psrtString))
}

export function invokeLoadSource(raw: string, url: string): string {
  return parseTextResult(call('loadSource', raw, url))
}

export function invokeConvertLegacyDocument(raw: string): string {
  return parseTextResult(call('convertLegacyDocument', raw))
}

export function invokeStringify(doc: PsrtDocument): string {
  return parseTextResult(call('stringify', encodeDoc(doc)))
}

export function invokeFormatDocument(doc: PsrtDocument): string {
  return parseTextResult(call('formatDocument', encodeDoc(doc)))
}

/** Applies process-wide formatting options. Called once by initPsrt() at boot. */
export function invokeConfigure(options?: InitOptions): void {
  const result = call('configure', options ?? {})
  if (!result.ok) {
    throw new Error(result.err ?? 'PSRT configure failed')
  }
}

export function invokeCompileToHtml(
  input: PsrtDocument | string,
  options?: CompileOptions
): string {
  return parseTextResult(call('compileToHtml', encodeInput(input), options ?? {}))
}

export function invokeCompileToSvg(
  input: PsrtDocument | string,
  pageName: string,
  options?: CompileOptions
): string {
  return parseTextResult(call('compileToSvg', encodeInput(input), pageName, options ?? {}))
}

export function wireWasmFromGlobal(): void {
  const exp = (globalThis as { psrtWasm?: Record<string, (...args: unknown[]) => WasmResult> })
    .psrtWasm
  if (!exp) {
    throw new Error('PSRT core exports not found')
  }
  wasmExports = exp
}

/** @internal */
export function setWasmExports(
  exports: Record<string, (...args: unknown[]) => WasmResult>,
): void {
  wasmExports = exports
}
