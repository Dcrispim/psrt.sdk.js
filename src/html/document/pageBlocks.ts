import type { PsrtMask, PsrtPage, PsrtPathMask, PsrtText } from '../../types.js'

export const BlockText = 'text' as const
export const BlockMask = 'mask' as const
export const BlockPathMask = 'pathMask' as const

export type BlockKind = typeof BlockText | typeof BlockMask | typeof BlockPathMask

export interface PageBlockEntry {
  kind: BlockKind
  text?: PsrtText
  mask?: PsrtMask
  pathMask?: PsrtPathMask
}

export function pageBlocksByIndex(page: PsrtPage): PageBlockEntry[] {
  const out: PageBlockEntry[] = []
  for (const t of page.texts ?? []) {
    out.push({ kind: BlockText, text: t })
  }
  for (const m of page.masks ?? []) {
    out.push({ kind: BlockMask, mask: m })
  }
  for (const pm of page.pathMasks ?? []) {
    out.push({ kind: BlockPathMask, pathMask: pm })
  }
  out.sort((a, b) => blockIndex(a) - blockIndex(b))
  return out
}

function blockIndex(e: PageBlockEntry): number {
  if (e.kind === BlockText && e.text) return e.text.index
  if (e.kind === BlockMask && e.mask) return e.mask.index
  if (e.kind === BlockPathMask && e.pathMask) return e.pathMask.index
  return 0
}
