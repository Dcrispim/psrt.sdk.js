import { parse, stringify } from './parse.js'
import type {
  MaskPositionFields,
  PathMaskPositionFields,
  PositionFields,
  PsrtDocument,
  PsrtMask,
  PsrtPage,
  PsrtPathMask,
  PsrtStyle,
  PsrtText,
} from './types.js'
import {
  addConst,
  removeConst,
  substituteConstReferences,
  revertConstReferences,
} from './editor/consts.js'
import { addFont, removeFont } from './editor/fonts.js'
import {
  addPage,
  movePage,
  removePage,
  removePageStyleKey,
  renamePage,
  setPagePath,
  setPageStyle,
} from './editor/pages.js'
import {
  addText,
  nudgeTextPosition,
  removeText,
  removeTextStyleKey,
  reorderTextByDelta,
  reorderTextRelative,
  reorderTextTo,
  setTextContent,
  setTextPosition,
  setTextStyle,
} from './editor/text.js'
import {
  addMask,
  removeMask,
  removeMaskStyleKey,
  setMaskPosition,
  setMaskStyle,
} from './editor/mask.js'
import {
  addPathMask,
  removePathMask,
  removePathMaskStyleKey,
  setPathMaskPath,
  setPathMaskPosition,
  setPathMaskStyle,
} from './editor/pathmask.js'

/** Fluent builder for chained PSRT document edits. */
export class Transformer {
  private _doc: PsrtDocument

  constructor(input: PsrtDocument | string) {
    this._doc = typeof input === 'string' ? parse(input) : structuredClone(input)
  }

  /** Read-only view of the current document state. */
  get document(): Readonly<PsrtDocument> {
    return this._doc
  }

  addConst(name: string, value: string): this {
    this._doc = addConst(this._doc, name, value)
    return this
  }

  removeConst(name: string): this {
    this._doc = removeConst(this._doc, name)
    return this
  }

  substituteConstReferences(name: string, value: string): this {
    this._doc = substituteConstReferences(this._doc, name, value)
    return this
  }

  revertConstReferences(name: string, value: string): this {
    this._doc = revertConstReferences(this._doc, name, value)
    return this
  }

  addFont(url: string): this {
    this._doc = addFont(this._doc, url)
    return this
  }

  removeFont(url: string): this {
    this._doc = removeFont(this._doc, url)
    return this
  }

  renamePage(oldName: string, newName: string): this {
    this._doc = renamePage(this._doc, oldName, newName)
    return this
  }

  setPagePath(pageName: string, path: string): this {
    this._doc = setPagePath(this._doc, pageName, path)
    return this
  }

  setPageStyle(pageName: string, key: string, value: string, partial?: PsrtStyle): this {
    this._doc = setPageStyle(this._doc, pageName, key, value, partial)
    return this
  }

  removePageStyleKey(pageName: string, key: string): this {
    this._doc = removePageStyleKey(this._doc, pageName, key)
    return this
  }

  movePage(pageName: string, before = '', after = ''): this {
    this._doc = movePage(this._doc, pageName, before, after)
    return this
  }

  addPage(page: PsrtPage, before = '', after = ''): this {
    this._doc = addPage(this._doc, page, before, after)
    return this
  }

  removePage(name: string): this {
    this._doc = removePage(this._doc, name)
    return this
  }

  setTextStyle(
    pageName: string,
    textIndex: number,
    key: string,
    value: string,
    partial?: PsrtStyle
  ): this {
    this._doc = setTextStyle(this._doc, pageName, textIndex, key, value, partial)
    return this
  }

  removeTextStyleKey(pageName: string, textIndex: number, key: string): this {
    this._doc = removeTextStyleKey(this._doc, pageName, textIndex, key)
    return this
  }

  setTextContent(pageName: string, index: number, content: string, appendContent = false): this {
    this._doc = setTextContent(this._doc, pageName, index, content, appendContent)
    return this
  }

  addText(
    pageName: string,
    text: PsrtText,
    opts?: { beforeIndex?: number; afterIndex?: number }
  ): this {
    this._doc = addText(this._doc, pageName, text, opts?.beforeIndex ?? -1, opts?.afterIndex ?? -1)
    return this
  }

  removeText(pageName: string, textIndex: number): this {
    this._doc = removeText(this._doc, pageName, textIndex)
    return this
  }

  reorderTextRelative(
    pageName: string,
    textIndex: number,
    beforeIndex = 0,
    afterIndex = 0
  ): this {
    this._doc = reorderTextRelative(this._doc, pageName, textIndex, beforeIndex, afterIndex)
    return this
  }

  reorderTextTo(pageName: string, textIndex: number, to: number): this {
    this._doc = reorderTextTo(this._doc, pageName, textIndex, to)
    return this
  }

  reorderTextByDelta(pageName: string, textIndex: number, delta: number): this {
    this._doc = reorderTextByDelta(this._doc, pageName, textIndex, delta)
    return this
  }

  setTextPosition(pageName: string, textIndex: number, pos: PositionFields): this {
    this._doc = setTextPosition(this._doc, pageName, textIndex, pos)
    return this
  }

  nudgeTextPosition(pageName: string, textIndex: number, delta: PositionFields): this {
    this._doc = nudgeTextPosition(this._doc, pageName, textIndex, delta)
    return this
  }

  setMaskPosition(pageName: string, maskIndex: number, pos: MaskPositionFields): this {
    this._doc = setMaskPosition(this._doc, pageName, maskIndex, pos)
    return this
  }

  addMask(
    pageName: string,
    mask: PsrtMask,
    opts?: { beforeIndex?: number; afterIndex?: number }
  ): this {
    this._doc = addMask(this._doc, pageName, mask, opts?.beforeIndex ?? -1, opts?.afterIndex ?? -1)
    return this
  }

  removeMask(pageName: string, maskIndex: number): this {
    this._doc = removeMask(this._doc, pageName, maskIndex)
    return this
  }

  setMaskStyle(
    pageName: string,
    maskIndex: number,
    key: string,
    value: string,
    partial?: PsrtStyle
  ): this {
    this._doc = setMaskStyle(this._doc, pageName, maskIndex, key, value, partial)
    return this
  }

  removeMaskStyleKey(pageName: string, maskIndex: number, key: string): this {
    this._doc = removeMaskStyleKey(this._doc, pageName, maskIndex, key)
    return this
  }

  setPathMaskPosition(pageName: string, maskIndex: number, pos: PathMaskPositionFields): this {
    this._doc = setPathMaskPosition(this._doc, pageName, maskIndex, pos)
    return this
  }

  addPathMask(
    pageName: string,
    mask: PsrtPathMask,
    opts?: { beforeIndex?: number; afterIndex?: number }
  ): this {
    this._doc = addPathMask(this._doc, pageName, mask, opts?.beforeIndex ?? -1, opts?.afterIndex ?? -1)
    return this
  }

  removePathMask(pageName: string, maskIndex: number): this {
    this._doc = removePathMask(this._doc, pageName, maskIndex)
    return this
  }

  setPathMaskStyle(
    pageName: string,
    maskIndex: number,
    key: string,
    value: string,
    partial?: PsrtStyle
  ): this {
    this._doc = setPathMaskStyle(this._doc, pageName, maskIndex, key, value, partial)
    return this
  }

  removePathMaskStyleKey(pageName: string, maskIndex: number, key: string): this {
    this._doc = removePathMaskStyleKey(this._doc, pageName, maskIndex, key)
    return this
  }

  setPathMaskPath(pageName: string, maskIndex: number, path: string): this {
    this._doc = setPathMaskPath(this._doc, pageName, maskIndex, path)
    return this
  }

  /** Returns the accumulated document after the edit chain. */
  build(): PsrtDocument {
    return structuredClone(this._doc)
  }

  /** Shortcut: build() + stringify(). */
  buildPsrt(): string {
    return stringify(this.build())
  }
}

export function transform(input: PsrtDocument | string): Transformer {
  return new Transformer(input)
}
