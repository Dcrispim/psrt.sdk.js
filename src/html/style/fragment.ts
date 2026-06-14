export const TypeKey = '__type__'

export const TypeMotionDiv = 'div'
export const TypeSpan = 'span'
export const TypeRect = 'rect'
export const TypeForeignObject = 'foreignObject'
export const TypeDiv = 'div'
export const TypeFilter = 'filter'
export const TypeMask = 'mask'
export const TypeG = 'g'

export type StyleFragment = Record<string, unknown> & { __type__: string }

export function newFragment(type: string): StyleFragment {
  return { [TypeKey]: type } as StyleFragment
}

export function mergeFragments(fragments: StyleFragment[]): StyleFragment[] {
  const byType = new Map<string, StyleFragment>()
  const order: string[] = []

  for (const fragment of fragments) {
    if (!fragment) continue
    const type = getFragmentString(fragment, TypeKey)
    if (!type) continue

    const existing = byType.get(type)
    if (existing) {
      for (const [key, value] of Object.entries(fragment)) {
        if (key !== TypeKey) {
          existing[key] = value
        }
      }
      continue
    }

    const copy: StyleFragment = { [TypeKey]: type } as StyleFragment
    for (const [key, value] of Object.entries(fragment)) {
      copy[key] = value
    }
    byType.set(type, copy)
    order.push(type)
  }

  return order.map((type) => byType.get(type)).filter((v): v is StyleFragment => Boolean(v))
}

export function setFragmentValue(fragment: StyleFragment | null | undefined, prop: string, value: unknown): void {
  if (!fragment) return
  fragment[prop] = value
}

export function getFragmentString(fragment: StyleFragment | null | undefined, prop: string): string {
  if (!fragment) return ''
  const value = fragment[prop]
  return typeof value === 'string' ? value : ''
}
