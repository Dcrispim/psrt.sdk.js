import type { PsrtDocument } from '../types.js'

export const CompileStep = {
  RESOLVE: 'resolve',
  BUILD_ASSETS: 'buildAssets',
  ADAPT_STYLE: 'adaptStyle',
  RENDER_FONTS: 'renderFonts',
  RENDER_HEAD: 'renderHead',
  RENDER_PAGE: 'renderPage',
  RENDER_TEXT: 'renderText',
  RENDER_MASK: 'renderMask',
  RENDER_INLINE: 'renderInline',
  FINALIZE: 'finalize',
} as const

export type CompileStep = (typeof CompileStep)[keyof typeof CompileStep]

export type CompileStepContext =
  | { step: typeof CompileStep.RESOLVE; doc: PsrtDocument }
  | {
      step: typeof CompileStep.BUILD_ASSETS
      assetCount: number
      canvasSizes: Record<string, { w: number; h: number }>
    }
  | {
      step: typeof CompileStep.ADAPT_STYLE
      pageName: string
      blockIndex: number
      kind: 'text' | 'mask' | 'pathMask'
    }
  | { step: typeof CompileStep.RENDER_FONTS; fontCount: number }
  | { step: typeof CompileStep.RENDER_HEAD; title: string }
  | {
      step: typeof CompileStep.RENDER_PAGE
      pageIndex: number
      pageName: string
      canvasW: number
      canvasH: number
    }
  | {
      step: typeof CompileStep.RENDER_TEXT
      pageName: string
      textIndex: number
      contentPreview: string
    }
  | { step: typeof CompileStep.RENDER_MASK; pageName: string; maskIndex: number }
  | {
      step: typeof CompileStep.RENDER_INLINE
      pageName: string
      textIndex: number
      htmlLength: number
    }
  | { step: typeof CompileStep.FINALIZE; htmlLength: number; pageCount: number }

export type CompileStepObserver = (ctx: CompileStepContext) => void

export type CompileStepObservers = Partial<Record<CompileStep, CompileStepObserver[]>>

export function notifyObservers(
  observers: CompileStepObservers | undefined,
  ctx: CompileStepContext,
): void {
  if (!observers) return
  const fns = observers[ctx.step]
  if (!fns?.length) return
  for (const fn of fns) fn(ctx)
}
