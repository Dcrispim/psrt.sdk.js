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
    const { parse, stringify } = await import('./parse.js')
    const fixturePath = join(sdkRoot, '..', '..', 'assets', 'psrts', 'o-home-que-nao-desistia-pt-br.psrt')
    const raw = readFileSync(fixturePath, 'utf8')
    const doc = parse(raw)
    expect(doc.pages.length).toBeGreaterThan(0)
    const out = stringify(doc)
    expect(out).toContain('$START')
    expect(out).toContain('$END')
  })

  it('Transformer chain matches pure functions', async () => {
    const { parse } = await import('./parse.js')
    const { addText, setTextContent } = await import('./editor/text.js')
    const { transform } = await import('./transformer.js')

    const raw = readFileSync(
      join(sdkRoot, '..', '..', 'assets', 'psrts', 'o-home-que-nao-desistia-pt-br.psrt'),
      'utf8'
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
>>10-10-30-3 | {} | 0
text
$END p
`)

    const resolved = resolveDocument(doc)
    expect(resolved.pages[0]?.imageUrl).toBe('https://example.com/a.png')
    expect(resolved.pages[0]?.texts[0]?.content).toBe('text')
  })

  it('parse $SOURCE and hydrate registry', async () => {
    const { parse } = await import('./parse.js')
    const { createAssetRegistry, hydrateSourcesFromDocument, resolveAssetUrl } = await import(
      './assets/registry.js'
    )

    const raw = `$START p | {} | https://cdn.example/img.png
>>10-10-30-3 | {} | 0
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
})
