import { describe, expect, it, vi } from 'vitest'
import { compileToHtmlPureAsync } from '../compile.js'
import {
  googleFontFamilyFromUrl,
  normalizeGoogleFontUrl,
} from '../html/assets/googleFonts.js'

const css2 =
  'https://fonts.googleapis.com/css2?family=Playwrite+AU+VIC+Guides&display=swap'
const download =
  'https://fonts.google.com/download/list?family=Playwrite%20AU%20VIC%20Guides'

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0lEQVQ4T2P8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const tinyPngDataUri = `data:image/png;base64,${tinyPngBase64}`

const mockCss = `@font-face {
  font-family: 'Playwrite AU VIC Guides';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/playwrite.woff2) format('woff2');
}`

const woff2Bytes = new Uint8Array([0x77, 0x4f, 0x46, 0x32])

describe('googleFonts', () => {
  it('normalizes download URL to css2', () => {
    expect(normalizeGoogleFontUrl(download)).toBe(
      'https://fonts.googleapis.com/css2?family=Playwrite+AU+VIC+Guides&display=swap',
    )
  })

  it('extracts family name from all Google URL forms', () => {
    expect(googleFontFamilyFromUrl(css2)).toBe('Playwrite AU VIC Guides')
    expect(googleFontFamilyFromUrl(download)).toBe('Playwrite AU VIC Guides')
  })
})

describe('compileToHtmlPureAsync', () => {
  it('embeds downloaded Google Fonts as base64 @font-face', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('fonts.googleapis.com')) {
        return new Response(mockCss, { status: 200 })
      }
      if (url.includes('fonts.gstatic.com')) {
        return new Response(woff2Bytes, {
          status: 200,
          headers: { 'content-type': 'font/woff2' },
        })
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    const html = await compileToHtmlPureAsync(
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
        fonts: [download],
        consts: {},
      },
      { noScript: true, fetch: fetchMock as typeof fetch },
    )

    expect(html).toContain("@font-face{font-family:'Playwrite AU VIC Guides'")
    expect(html).toContain('data:font/woff2;base64,')
    expect(html).toContain("font-family:Playwrite AU VIC Guides")
    expect(html).not.toContain('CompiledFont_0')
  })
})
