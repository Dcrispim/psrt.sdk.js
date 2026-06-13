# @psrt/sdk

TypeScript library for parsing, editing, and compiling PSRT documents.

## Install

```bash
npm install @psrt/sdk
```

## Usage

Call `initPsrt()` once at startup, then use the API:

```typescript
import { readFileSync } from 'node:fs'
import { initPsrt, parse, compileToHtml, compileToSvg } from '@psrt/sdk'

await initPsrt()

const psrtString = readFileSync('document.psrt', 'utf8')
const doc = parse(psrtString)

const html = compileToHtml(doc)
const svg = compileToSvg(doc, doc.pages[0]!.name)
```

`initPsrt()` is idempotent — safe to call more than once, but one call at app entry is enough.

## Editor (fluent API)

```typescript
import { initPsrt, parse, stringify, transform } from '@psrt/sdk'

await initPsrt()

const doc = parse(psrtString)
const pageName = doc.pages[0]!.name

const updated = transform(doc)
  .addText(pageName, {
    x: 10,
    y: 20,
    width: 100,
    textSize: 2,
    index: 1,
    content: 'Hello',
    style: {},
  })
  .build()

const out = stringify(updated)
```

## Live preview styles

```typescript
import { initPsrt, adaptEntriesForWeb } from '@psrt/sdk'

await initPsrt()

const styles = adaptEntriesForWeb(entriesJSON, canvasWidth, canvasHeight, zoom)
```

## Exports

- **Init:** `initPsrt`
- **I/O:** `parse`, `stringify`, `formatDocument`, `resolveDocument`, `resolveDocumentStrict`
- **Compile:** `compileToHtml`, `compileToSvg`
- **Preview:** `adaptEntriesForWeb`, `formatPageDocumentJSON`, `mergePageDocumentPSRT`
- **Editor:** `addText`, `setTextContent`, `transform`, …
- **Types:** `PsrtDocument`, `Document`, `Page`, `TextBlock`, …

## React

See [@psrt/react-image](../react-image/README.md). Call `initPsrt()` once in your app entry before rendering.
