/** Mirrors psrt.RenderInlineHTML */

type InlineDelim = { open: string; close: string; tagOpen: string; tagClose: string }

const DELIMS: InlineDelim[] = [
  { open: '***', close: '***', tagOpen: '<strong><em>', tagClose: '</em></strong>' },
  { open: '**', close: '**', tagOpen: '<strong>', tagClose: '</strong>' },
  { open: '*', close: '*', tagOpen: '<em>', tagClose: '</em>' },
  { open: '_', close: '_', tagOpen: '<u>', tagClose: '</u>' },
  { open: '~', close: '~', tagOpen: '<s>', tagClose: '</s>' },
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderSegment(s: string): string {
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      out += escapeHtml(s[i + 1])
      i += 2
      continue
    }
    let matched = false
    for (const d of DELIMS) {
      if (!s.startsWith(d.open, i)) continue
      const innerStart = i + d.open.length
      const closeAt = s.indexOf(d.close, innerStart)
      if (closeAt <= innerStart) continue
      out += d.tagOpen + renderSegment(s.slice(innerStart, closeAt)) + d.tagClose
      i = closeAt + d.close.length
      matched = true
      break
    }
    if (matched) continue
    out += escapeHtml(s[i])
    i += 1
  }
  return out
}

function plainSegment(s: string): string {
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      out += s[i + 1]
      i += 2
      continue
    }
    let matched = false
    for (const d of DELIMS) {
      if (!s.startsWith(d.open, i)) continue
      const innerStart = i + d.open.length
      const closeAt = s.indexOf(d.close, innerStart)
      if (closeAt <= innerStart) continue
      out += plainSegment(s.slice(innerStart, closeAt))
      i = closeAt + d.close.length
      matched = true
      break
    }
    if (matched) continue
    out += s[i]
    i += 1
  }
  return out
}

export function renderInlineHTML(content: string): string {
  if (!content) return ''
  return content.split('\n').map((line) => renderSegment(line)).join('<br/>')
}

export function plainTextForLayout(content: string): string {
  if (!content) return ''
  return content.split('\n').map((line) => plainSegment(line)).join('\n')
}

export function normalizeTextContent(content: string): string {
  return content.replace(/^[\t ]+/, '').replace(/[\t \r\n]+$/, '')
}
