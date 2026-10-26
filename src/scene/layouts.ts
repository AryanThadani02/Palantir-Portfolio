import type { CaseStudy } from '../data/content'

/**
 * Shared screen layouts for the middle chapters, in normalised view coordinates (x, y in -1..1 of the viewport,
 * y up). The particle shader and the DOM labels both read these, so dots and text always line up.
 */

/** Where a chapter's particle "visual" lives: right half on desktop (copy on the left), top on phones. */
export function visualRegion(narrow: boolean) {
  return narrow ? { cx: 0, cy: 0.42, s: 0.34 } : { cx: 0.42, cy: -0.04, s: 0.62 }
}

export interface PipeNode {
  x: number
  y: number
  lane: number
  /** Order the wave reaches this node in (0-based, counted across lanes by step). */
  step: number
  label: string
  first: boolean
  last: boolean
}

/** Max nodes per project the shader can hold (uniform array size). */
export const MAX_NODES = 16

/** Node half-size in normalised units (x is in viewport-width units). */
export function nodeHalf(narrow: boolean) {
  return narrow ? { x: 0.27, y: 0.028 } : { x: 0.075, y: 0.052 }
}

/**
 * The project's pipeline as nodes: desktop lanes run left → right across the right two-thirds; phones stack the
 * steps top → bottom per lane, lanes side by side, in the top half.
 */
export function pipelineLayout(cs: CaseStudy, narrow: boolean): PipeNode[] {
  const nodes: PipeNode[] = []
  const lanes = cs.flows.length
  cs.flows.forEach((f, lane) => {
    const n = f.steps.length
    f.steps.forEach((label, i) => {
      let x: number
      let y: number
      if (narrow) {
        const colW = 1.7 / lanes
        x = lanes === 1 ? 0 : -0.85 + colW * (lane + 0.5)
        y = 0.72 - (i / Math.max(1, n - 1)) * 0.6
      } else {
        x = -0.02 + (i / Math.max(1, n - 1)) * 0.88
        const laneGap = 0.36
        y = lanes === 1 ? -0.04 : 0.32 - lane * laneGap
      }
      nodes.push({ x, y, lane, step: i, label, first: i === 0, last: i === n - 1 })
    })
  })
  return nodes.slice(0, MAX_NODES)
}
