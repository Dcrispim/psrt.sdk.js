/** Mirrors psrt.ExpandConsts — longer keys first to avoid prefix clashes. */
export function expandConsts(
  content: string,
  consts: Record<string, string> | undefined,
): string {
  if (!consts || !content) return content
  const keys = Object.keys(consts).sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length
    return a.localeCompare(b)
  })
  let out = content
  for (const k of keys) {
    out = out.split(`@${k}@`).join(consts[k])
  }
  return out
}

export function compactJsonString(s: string): string {
  const trimmed = s.trim()
  if (!trimmed) return trimmed
  try {
    return JSON.stringify(JSON.parse(trimmed))
  } catch {
    return trimmed.replace(/\n/g, '').replace(/\r/g, '')
  }
}

export function expandConstsInStyle(
  style: Record<string, unknown> | string,
  consts: Record<string, string> | undefined,
): Record<string, unknown> | string {
  const raw = typeof style === 'string' ? style.trim() : JSON.stringify(style ?? {})
  if (!raw || raw === '{}') return style
  const compact = compactJsonString(raw)
  const expanded = expandConsts(compact, consts)
  try {
    JSON.parse(expanded)
    return expanded
  } catch {
    return style
  }
}
