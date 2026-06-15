import { expandConsts } from '../html/text/expandConsts.js'
import type { PsrtDocument } from '../types.js'

export interface AssetRegistry {
  register(url: string, dataUri: string): void
  has(url: string): boolean
  resolve(url: string): string | undefined
  clear(): void
  keys(): string[]
  toSourcesMap(): Record<string, string>
}

export function createAssetRegistry(): AssetRegistry {
  const map = new Map<string, string>()

  return {
    register(url: string, dataUri: string) {
      const key = url.trim()
      if (!key || !dataUri.trim()) return
      map.set(key, dataUri.trim())
    },
    has(url: string) {
      return map.has(url.trim())
    },
    resolve(url: string) {
      return map.get(url.trim())
    },
    clear() {
      map.clear()
    },
    keys() {
      return [...map.keys()]
    },
    toSourcesMap() {
      return Object.fromEntries(map)
    },
  }
}

function isDataUri(value: string): boolean {
  return value.startsWith('data:')
}

/** Moves $SOURCE payloads into the registry; document keeps URL references only. */
export function hydrateSourcesFromDocument(
  doc: PsrtDocument,
  registry: AssetRegistry = createAssetRegistry(),
): { document: PsrtDocument; registry: AssetRegistry } {
  const sources = doc.sources ?? {}
  for (const [url, dataUri] of Object.entries(sources)) {
    if (url.trim() && isDataUri(dataUri)) {
      registry.register(url, dataUri)
    }
  }
  const { sources: _removed, ...rest } = doc
  return {
    document: { ...rest, sources: {} },
    registry,
  }
}

export interface ResolveAssetUrlOptions {
  registry?: AssetRegistry
  consts?: Record<string, string>
  fetch?: (expandedUrl: string) => Promise<string | undefined>
}

/** Expand @const@ → registry → optional fetch fallback. */
export async function resolveAssetUrl(
  rawUrl: string,
  options: ResolveAssetUrlOptions = {},
): Promise<string> {
  const expanded = expandConsts(rawUrl.trim(), options.consts ?? {})
  if (!expanded) return ''

  if (isDataUri(expanded)) return expanded

  const fromRegistry = options.registry?.resolve(expanded)
  if (fromRegistry) return fromRegistry

  if (options.fetch) {
    const fetched = await options.fetch(expanded)
    if (fetched) return fetched
  }

  return expanded
}

/** Attach registry entries for stringify / $SOURCE output. */
export function attachSourcesToDocument(
  doc: PsrtDocument,
  registry: AssetRegistry,
): PsrtDocument {
  const sources = registry.toSourcesMap()
  if (Object.keys(sources).length === 0) {
    return doc
  }
  return { ...doc, sources }
}
