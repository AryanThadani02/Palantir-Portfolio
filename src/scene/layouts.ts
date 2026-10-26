/**
 * Shared screen layouts for the middle chapters, in normalised view coordinates (x, y in -1..1 of the viewport,
 * y up). The particle shader and the DOM copy both read these, so dots and text never collide.
 */

/** Where a chapter's particle "visual" lives: right half on desktop (copy on the left), top on phones. */
export function visualRegion(narrow: boolean) {
  return narrow ? { cx: 0, cy: 0.42, s: 0.34 } : { cx: 0.42, cy: -0.04, s: 0.62 }
}

/** The Work pictogram: a little higher and smaller than the other visuals, leaving room for the step name below. */
export function stepRegion(narrow: boolean) {
  return narrow ? { cx: 0, cy: 0.46, s: 0.3 } : { cx: 0.42, cy: 0.1, s: 0.5 }
}

/** The About words: centred, `s` = half the word's width as a fraction of the viewport half-width. */
export function wordLayout(narrow: boolean) {
  return narrow ? { cx: 0, cy: 0.16, s: 0.92 } : { cx: 0, cy: 0.1, s: 0.84 }
}
