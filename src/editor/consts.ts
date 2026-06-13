import { invokeDocMutation } from '../wasm.js'
import type { PsrtDocument } from '../types.js'

export function addConst(doc: PsrtDocument, name: string, value: string): PsrtDocument {
  return invokeDocMutation('addConst', doc, name, value)
}

export function removeConst(doc: PsrtDocument, name: string): PsrtDocument {
  return invokeDocMutation('removeConst', doc, name)
}

export function substituteConstReferences(
  doc: PsrtDocument,
  name: string,
  value: string
): PsrtDocument {
  return invokeDocMutation('substituteConstReferences', doc, name, value)
}

export function revertConstReferences(
  doc: PsrtDocument,
  name: string,
  value: string
): PsrtDocument {
  return invokeDocMutation('revertConstReferences', doc, name, value)
}
