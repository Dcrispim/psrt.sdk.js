import { describe, expect, it } from 'vitest'
import {
  CompileStep,
  compileToHtmlPure,
  compileToHtmlPureAsync,
  resolveDocumentPure,
} from '../compile.js'

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0lEQVQ4T2P8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const tinyPngDataUri = `data:image/png;base64,${tinyPngBase64}`

function snippet(html: string, sub: string): string {
  const i = html.indexOf(sub)
  if (i < 0) return ''
  return html.slice(i, Math.min(i + 120, html.length))
}

function cssRule(html: string, selector: string): string {
  const i = html.indexOf(selector)
  if (i < 0) return ''
  const j = html.indexOf('}', i)
  return j < 0 ? html.slice(i) : html.slice(i, j + 1)
}

function extractStyleProp(html: string, className: string, prop: string): string {
  const re = new RegExp(`class="${className}[^"]*" style="([^"]*)"`)
  const m = re.exec(html)
  if (!m?.[1]) return ''
  const part = m[1].split(';').find((s) => s.trim().startsWith(`${prop}:`))
  return part?.split(':')[1]?.trim() ?? ''
}

describe('compileToHtmlPure', () => {
  it('resolveDocumentPure expands const placeholders', () => {
    const doc = resolveDocumentPure({
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: '@img@',
          texts: [{ x: 10, y: 10, width: 30, textSize: 3, index: 0, style: {}, content: 'text' }],
        },
      ],
      fonts: [],
      consts: { img: 'https://example.com/a.png' },
    })
    expect(doc.pages[0]?.imageUrl).toBe('https://example.com/a.png')
  })

  it('resolveDocumentPure strips interactive consts to their render text', () => {
    const doc = resolveDocumentPure({
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: 'x',
          texts: [
            { x: 1, y: 1, width: 1, textSize: 1, index: 0, style: {}, content: 'Join @link:Discord@' },
          ],
        },
      ],
      fonts: [],
      consts: {},
      iConst: { 'link:Discord': { type: 'link', render: 'Discord', value: 'https://d.example' } },
    })
    expect(doc.pages[0]?.texts?.[0]?.content).toBe('Join Discord')
  })

  it('embeds pre-resolved font data URIs from doc.fonts (sync compile)', () => {
    const woff2 = new Uint8Array([0x77, 0x4f, 0x46, 0x32])
    let binary = ''
    for (let i = 0; i < woff2.length; i++) binary += String.fromCharCode(woff2[i]!)
    const fontDataUri = `data:font/woff2;base64,${btoa(binary)}`

    const html = compileToHtmlPure(
      {
        pages: [
          {
            name: 'p',
            style: {},
            imageUrl: tinyPngDataUri,
            texts: [
              {
                x: 10,
                y: 10,
                width: 80,
                textSize: 12,
                index: 0,
                style: { 'font-family': 'Playwrite AU VIC Guides' },
                content: 'Hello',
              },
            ],
          },
        ],
        fonts: [fontDataUri],
        consts: {},
      },
      { noScript: true },
    )

    expect(html).toContain('@font-face')
    expect(html).toContain('data:font/woff2;base64,')
    expect(html).toContain('body{font-family:-apple-system')
    expect(html).toContain('font-family:Playwrite AU VIC Guides')
  })

  it('stacks slides and uses cqmin font-size', () => {
    const doc = {
      pages: [
        {
          name: 'a',
          style: { backGround: '#000' },
          imageUrl: tinyPngDataUri,
          texts: [
            {
              x: 10,
              y: 20,
              width: 80,
              textSize: 12,
              index: 0,
              style: { color: '#fff' },
              content: 'Hello',
            },
          ],
        },
        {
          name: 'b',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc, { noScript: true })
    expect(html).toContain('flex-direction:column')
    expect(cssRule(html, '.slide{')).not.toContain('container-type')
    expect(html).toContain('container-type:size;container-name:slide')
    expect(html).toContain('slide-overlays')
    expect(html).toContain('psrt-overlay psrt-v-0')
    expect(html).toContain('position:absolute')
    expect(html).toContain('font-size:12cqmin')
    expect(html).toContain('class="slide" style="width:1px')
    expect(html).toContain('>Hello<')
    expect(html.match(/class="slide"/g)?.length).toBe(2)
  })

  it('renders text-align right and justify', () => {
    const doc = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [
            {
              x: 5,
              y: 5,
              width: 90,
              textSize: 5,
              index: 0,
              style: { color: '#fff', textAlign: 'right' },
              content: 'Right',
            },
            {
              x: 5,
              y: 20,
              width: 90,
              textSize: 5,
              index: 1,
              style: { color: '#fff', textAlign: 'justify' },
              content: 'Justify me now',
            },
          ],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc, { noScript: true })
    expect(html).toContain('text-align:right')
    expect(html).toContain('text-align:justify')
  })

  it('short label without computed height', () => {
    const doc = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [
            {
              x: 46.19,
              y: 38.69,
              width: 6.22,
              textSize: 1.32,
              index: 13,
              style: {
                textAlign: 'center',
                color: '#000000',
                fontWeight: '700',
                background: '#ff0000',
              },
              content: 'Perdidos!',
            },
          ],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc, { noScript: true })
    expect(extractStyleProp(html, 'text-layer', 'height')).toBe('')
    expect(html).toContain('>Perdidos!<')
  })

  it('renders text box background', () => {
    const doc = {
      pages: [
        {
          name: 'intro',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [
            {
              x: 10,
              y: 20,
              width: 80,
              textSize: 5,
              index: 1,
              style: { background: '#000000ff', color: '#fff', textAlign: 'center' },
              content: 'Title',
            },
          ],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc, { noScript: true })
    expect(html).toContain('background-color:#000000ff')
  })

  it('renders a path mask as a clipped inline svg', () => {
    const doc = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [],
          pathMasks: [
            {
              x: 10,
              y: 10,
              width: 30,
              height: 20,
              index: 0,
              style: { background: '#eee9b2', border: '1px solid #000' },
              path: 'M10,50 C10,25 30,10 50,10 Z',
            },
          ],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc, { noScript: true })
    expect(html).toContain('class="text-layer psrt-mask psrt-path-mask psrt-v-0"')
    expect(html).toContain('id="psrt-pathmask-p-0-v0"')
    expect(html).toContain('viewBox="0 0 100 100"')
    expect(html).toContain('<clipPath id="psrt-pathmask-p-0-0-clip">')
    expect(html).toContain('<path d="M10,50 C10,25 30,10 50,10 Z"/>')
    expect(html).toContain('fill="#eee9b2"')
    expect(html).toContain('stroke="#000"')
    expect(extractStyleProp(html, 'text-layer', 'left')).toBe('10%')
  })

  it('renders page background color', () => {
    const doc = {
      pages: [
        {
          name: 'capa',
          style: { backGround: '#1C1C26' },
          imageUrl: tinyPngDataUri,
          texts: [],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc, { noScript: true })
    expect(html).toContain('background:#1C1C26')
  })

  it('works without observers', () => {
    const doc = {
      pages: [{ name: 'p', style: {}, imageUrl: tinyPngDataUri, texts: [] }],
      fonts: [],
      consts: {},
    }
    const a = compileToHtmlPure(doc, { noScript: true })
    const b = compileToHtmlPure(doc, { noScript: true, observers: {} })
    expect(a).toBe(b)
  })

  it('invokes observers in order and propagates errors', () => {
    const doc = {
      pages: [{ name: 'p', style: {}, imageUrl: tinyPngDataUri, texts: [] }],
      fonts: [],
      consts: {},
    }
    const order: string[] = []
    compileToHtmlPure(doc, {
      noScript: true,
      observers: {
        [CompileStep.RENDER_PAGE]: [() => order.push('page')],
        [CompileStep.FINALIZE]: [
          () => order.push('finalize-a'),
          () => order.push('finalize-b'),
        ],
      },
    })
    expect(order).toEqual(['page', 'finalize-a', 'finalize-b'])

    expect(() =>
      compileToHtmlPure(doc, {
        noScript: true,
        observers: {
          [CompileStep.FINALIZE]: [() => { throw new Error('observer fail') }],
        },
      }),
    ).toThrow('observer fail')
  })

  it('linksOnly accepts http URLs without embedded assets', () => {
    const doc = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: 'https://example.com/bg.png',
          texts: [],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc, { linksOnly: true, noScript: true })
    expect(html).toContain('src="https://example.com/bg.png"')
  })

  it('single variant omits variant switcher script', () => {
    const doc = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [{ x: 10, y: 10, width: 50, textSize: 5, index: 0, style: {}, content: 'A' }],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(doc)
    expect(html).not.toContain('PSRT HTML — variant switcher')
    expect(html).not.toContain('psrt-variant-hint')
    expect(html).toContain('id="psrt-text-p-0-v0"')
    expect(html).toContain('class="text-layer psrt-text psrt-v-0"')
    expect(html).not.toContain('psrt-hidden')
  })

  it('bundles multiple variants with overlays, ids, and Ctrl+L script', () => {
    const docA = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [{ x: 10, y: 10, width: 50, textSize: 5, index: 0, style: {}, content: 'A' }],
        },
      ],
      fonts: [],
      consts: {},
    }
    const docB = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [{ x: 10, y: 10, width: 50, textSize: 5, index: 0, style: {}, content: 'B' }],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(docA, {
      variants: [{ label: 'b.psrt', doc: docB }],
    })

    expect(html).toContain('psrt-text psrt-v-0')
    expect(html).toContain('psrt-text psrt-v-1')
    expect(html).toContain('id="psrt-text-p-0-v0"')
    expect(html).toContain('id="psrt-text-p-0-v1"')
    expect(html).toContain('id="psrt-overlay-p-v0"')
    expect(html).toContain('id="psrt-overlay-p-v1"')
    expect(html).toContain('>A<')
    expect(html).toContain('>B<')
    expect(html).toContain('psrt-hidden')
    expect(html).toContain('PSRT HTML — variant switcher')
    expect(html).toContain("event.key.toLowerCase() !== 'l'")
    expect(html).toContain("VARIANT_LABELS.push('')")
    expect(html.match(/class="slide-overlay psrt-overlay psrt-v-0"/g)?.length).toBe(1)
    expect(html.match(/class="slide-overlay psrt-overlay psrt-v-1 psrt-hidden"/g)?.length).toBe(1)
  })

  it('multi variant with noScript omits script but keeps hidden overlays', () => {
    const docA = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [{ x: 10, y: 10, width: 50, textSize: 5, index: 0, style: {}, content: 'A' }],
        },
      ],
      fonts: [],
      consts: {},
    }
    const docB = {
      pages: [
        {
          name: 'p',
          style: {},
          imageUrl: tinyPngDataUri,
          texts: [{ x: 10, y: 10, width: 50, textSize: 5, index: 0, style: {}, content: 'B' }],
        },
      ],
      fonts: [],
      consts: {},
    }
    const html = compileToHtmlPure(docA, {
      noScript: true,
      variants: [{ label: 'alt', doc: docB }],
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('psrt-overlay psrt-v-1 psrt-hidden')
  })
})
