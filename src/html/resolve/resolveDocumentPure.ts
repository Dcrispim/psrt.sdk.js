import type { PsrtDocument } from '../../types.js'
import { constsWithInteractive, expandConsts, expandConstsInStyle } from '../text/expandConsts.js'
import { normalizeTextContent } from '../text/inlineMarkup.js'

/** Expands all @const@ placeholders in styles, content, and URLs. */
export function resolveDocumentPure(doc: PsrtDocument): PsrtDocument {
  const consts = constsWithInteractive(doc.consts, doc.iConst)
  if (!consts || Object.keys(consts).length === 0) return doc

  return {
    ...doc,
    pages: doc.pages.map((p) => ({
      ...p,
      style: expandConstsInStyle(p.style, consts),
      imageUrl: expandConsts(p.imageUrl.trim(), consts),
      texts: (p.texts ?? []).map((t) => ({
        ...t,
        style: expandConstsInStyle(t.style, consts),
        content: normalizeTextContent(expandConsts(t.content, consts)),
        imageRef: expandConsts((t.imageRef ?? '').trim(), consts),
      })),
      masks: (p.masks ?? []).map((m) => ({
        ...m,
        style: expandConstsInStyle(m.style, consts),
        imageRef: expandConsts((m.imageRef ?? '').trim(), consts),
      })),
    })),
  }
}
