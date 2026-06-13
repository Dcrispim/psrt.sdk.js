import { invokeDocMutation } from '../wasm.js'
import type { PsrtDocument, PsrtPage, PsrtStyle } from '../types.js'

export function renamePage(doc: PsrtDocument, oldName: string, newName: string): PsrtDocument {
  return invokeDocMutation('renamePage', doc, oldName, newName)
}

export function setPagePath(doc: PsrtDocument, pageName: string, path: string): PsrtDocument {
  return invokeDocMutation('setPagePath', doc, pageName, path)
}

export function setPageStyle(
  doc: PsrtDocument,
  pageName: string,
  key: string,
  value: string,
  partial?: PsrtStyle
): PsrtDocument {
  return invokeDocMutation('setPageStyle', doc, pageName, key, value, partial)
}

export function removePageStyleKey(doc: PsrtDocument, pageName: string, key: string): PsrtDocument {
  return invokeDocMutation('removePageStyleKey', doc, pageName, key)
}

export function movePage(
  doc: PsrtDocument,
  pageName: string,
  before = '',
  after = ''
): PsrtDocument {
  return invokeDocMutation('movePage', doc, pageName, before, after)
}

export function addPage(
  doc: PsrtDocument,
  page: PsrtPage,
  before = '',
  after = ''
): PsrtDocument {
  return invokeDocMutation('addPage', doc, page, before, after)
}

export function removePage(doc: PsrtDocument, name: string): PsrtDocument {
  return invokeDocMutation('removePage', doc, name)
}
