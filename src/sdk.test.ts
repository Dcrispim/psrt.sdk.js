import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

const sdkRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

beforeAll(async () => {
  const { initPsrt } = await import('./init.js')
  await initPsrt()
})

describe('@psrt/sdk', () => {
  it('parse/stringify round-trip', async () => {
    const { parse, stringify, convertLegacyDocument } = await import('./parse.js')
    const fixturePath = join(sdkRoot, 'assets', 'o-home-que-nao-desistia-pt-br.psrt')
    // This fixture predates the comma coordinate separator (hyphen-separated
    // >>/== headers); convert it before parsing, same as any real legacy
    // .psrt would need.
    const raw = convertLegacyDocument(readFileSync(fixturePath, 'utf8'))
    const doc = parse(raw)
    expect(doc.pages.length).toBeGreaterThan(0)
    const out = stringify(doc)
    expect(out).toContain('$START')
    expect(out).toContain('$END')
  })

  it('Transformer chain matches pure functions', async () => {
    const { parse, convertLegacyDocument } = await import('./parse.js')
    const { addText, setTextContent } = await import('./editor/text.js')
    const { transform } = await import('./transformer.js')

    const raw = convertLegacyDocument(
      readFileSync(join(sdkRoot, 'assets', 'o-home-que-nao-desistia-pt-br.psrt'), 'utf8')
    )
    const base = parse(raw)
    const pageName = base.pages[0]?.name
    expect(pageName).toBeTruthy()

    const text = {
      x: 10,
      y: 20,
      width: 30,
      textSize: 2,
      index: 9999,
      content: 'teste',
      style: {},
    }

    const chained = transform(base)
      .addText(pageName!, text)
      .setTextContent(pageName!, 9999, 'teste editado')
      .build()

    let manual = addText(base, pageName!, text)
    manual = setTextContent(manual, pageName!, 9999, 'teste editado')

    expect(chained.pages[0]?.texts.some((t) => t.index === 9999 && t.content === 'teste editado')).toBe(true)
    expect(manual.pages[0]?.texts.some((t) => t.index === 9999 && t.content === 'teste editado')).toBe(true)
  })

  it('resolveDocument expands const placeholders', async () => {
    const { parse } = await import('./parse.js')
    const { resolveDocument } = await import('./resolve.js')

    const doc = parse(`$CONSTS
@img | https://example.com/a.png
$ENDCONSTS
$START p | {} | @img@
>>10,10,30,3 | {} | 0
text
$END p
`)

    const resolved = resolveDocument(doc)
    expect(resolved.pages[0]?.imageUrl).toBe('https://example.com/a.png')
    expect(resolved.pages[0]?.texts[0]?.content).toBe('text')
  })

  it('parse/stringify round-trip for ~~ path mask', async () => {
    const { parse, stringify } = await import('./parse.js')

    const raw = `$START p | {} | https://example.com/a.png
~~10,10,30,20 | {"background":"#eee9b2"} | 0
M10,50 C10,25 30,10 50,10 C70,10 90,25 90,50 Z
$END p
`
    const doc = parse(raw)
    const pathMasks = doc.pages[0]?.pathMasks
    expect(pathMasks?.length).toBe(1)
    expect(pathMasks?.[0]?.path).toContain('M10,50')
    expect(pathMasks?.[0]?.index).toBe(0)

    const out = stringify(doc)
    expect(out).toContain('~~10,10,30,20')
    expect(out).toContain('M10,50')
  })

  it('Transformer chain matches pure functions for path masks', async () => {
    const { parse } = await import('./parse.js')
    const {
      addPathMask,
      removePathMask,
      removePathMaskStyleKey,
      setPathMaskPath,
      setPathMaskPosition,
      setPathMaskStyle,
    } = await import('./editor/pathmask.js')
    const { transform } = await import('./transformer.js')

    const raw = `$START p | {} | https://example.com/a.png
$END p
`
    const base = parse(raw)
    const pageName = base.pages[0]?.name
    expect(pageName).toBeTruthy()

    const mask = {
      x: 5,
      y: 5,
      width: 50,
      height: 30,
      index: 9999,
      path: 'M0,0 L100,0 L100,100 Z',
      style: {},
    }

    const chained = transform(base)
      .addPathMask(pageName!, mask)
      .setPathMaskPosition(pageName!, 9999, { x: 12 })
      .setPathMaskStyle(pageName!, 9999, 'background', '"#fff"')
      .removePathMaskStyleKey(pageName!, 9999, 'background')
      .setPathMaskPath(pageName!, 9999, 'M0,0 L50,0 L50,50 Z')
      .build()

    let manual = addPathMask(base, pageName!, mask)
    manual = setPathMaskPosition(manual, pageName!, 9999, { x: 12 })
    manual = setPathMaskStyle(manual, pageName!, 9999, 'background', '"#fff"')
    manual = removePathMaskStyleKey(manual, pageName!, 9999, 'background')
    manual = setPathMaskPath(manual, pageName!, 9999, 'M0,0 L50,0 L50,50 Z')

    for (const doc of [chained, manual]) {
      const m = doc.pages[0]?.pathMasks?.find((pm) => pm.index === 9999)
      expect(m?.x).toBe(12)
      expect(m?.path).toBe('M0,0 L50,0 L50,50 Z')
      expect(m?.style).toEqual({})
    }

    const removed = transform(chained).removePathMask(pageName!, 9999).build()
    expect(removed.pages[0]?.pathMasks?.some((pm) => pm.index === 9999) ?? false).toBe(false)
  })

  it('parse $SOURCE and hydrate registry', async () => {
    const { parse } = await import('./parse.js')
    const { createAssetRegistry, hydrateSourcesFromDocument, resolveAssetUrl } = await import(
      './assets/registry.js'
    )

    const raw = `$START p | {} | https://cdn.example/img.png
>>10,10,30,3 | {} | 0
hi
$END p

$SOURCE
https://cdn.example/img.png | data:image/png;base64,QUFB
$ENDSOURCE
`
    const doc = parse(raw)
    expect(doc.sources?.['https://cdn.example/img.png']).toContain('base64')

    const { document, registry } = hydrateSourcesFromDocument(doc)
    expect(document.sources).toEqual({})
    expect(registry.has('https://cdn.example/img.png')).toBe(true)

    const resolved = await resolveAssetUrl('https://cdn.example/img.png', { registry })
    expect(resolved).toBe('data:image/png;base64,QUFB')
  })

  it('convertLegacyDocument rewrites hyphen coords to commas', async () => {
    const { parse, convertLegacyDocument } = await import('./parse.js')

    const legacy = `$START p | {} | https://example.com/a.png
>>50-50-80-2 | {"color":"#fff"} | 0
hello
==6.58-6.17-22.37-1.89 | {"bg":"#eee9b2"} | 1
~~10-10-20-5 | {"bg":"#fff"} | 2
M10,50 L20,50 Z
$END p
`
    const converted = convertLegacyDocument(legacy)
    expect(converted).toContain('>>50,50,80,2')
    expect(converted).toContain('==6.58,6.17,22.37,1.89')
    expect(converted).toContain('~~10,10,20,5')
    // Path body content (which legitimately contains commas) must be left untouched.
    expect(converted).toContain('M10,50 L20,50 Z')

    const doc = parse(converted)
    const page = doc.pages[0]!
    expect(page.texts[0]?.x).toBe(50)
    expect(page.masks?.[0]?.width).toBe(22.37)
    expect(page.pathMasks?.[0]?.height).toBe(5)
  })

  it('convertLegacyDocument rejects a malformed legacy header', async () => {
    const { convertLegacyDocument } = await import('./parse.js')
    expect(() => convertLegacyDocument('>>50-50-80 | {} | 0\nhi\n')).toThrow()
  })
})
