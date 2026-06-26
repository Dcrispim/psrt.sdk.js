/**
 * Lightweight client-side checks for SVG path `d` data, used to fail fast in
 * editor/pathmask.ts before a WASM round-trip. The Go core (svgpath.Parse) is
 * always the source of truth — these are convenience checks only, so they
 * lean on the browser's native path parser instead of re-implementing the
 * SVG path grammar in TypeScript.
 */

/**
 * Validates `d` using the browser's native Path2D constructor, which throws
 * a SyntaxError on malformed path data. No-op outside a browser (Node, SSR):
 * the WASM call still validates server-side, so skipping here is safe.
 */
export function assertValidPathData(d: string): void {
  if (typeof Path2D === 'undefined') return
  try {
    new Path2D(d)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`invalid svg path data: ${message}`)
  }
}

/**
 * Counts top-level moveto commands (M/m). `M`/`m` only ever appear as command
 * letters in path data, never inside a number, so a plain scan is enough —
 * no need for a full path grammar parser just to enforce the single-shape
 * rule (mirrors svgpath.Info.Subpaths in go/svgpath/svgpath.go).
 */
export function countSubpaths(d: string): number {
  const matches = d.match(/[Mm]/g)
  return matches ? matches.length : 0
}

/** Throws if `d` has more than one subpath (PSRT's ~~ single-shape rule). */
export function assertSingleShape(d: string): void {
  if (countSubpaths(d) > 1) {
    throw new Error('path mask must be a single shape (multiple M/m commands found)')
  }
}
