/** 0..1 progress through a sticky run: 0 when its top reaches the viewport top, 1 when its end does. */
export function runProgress(el: HTMLElement | null) {
  if (!el) return 0
  const r = el.getBoundingClientRect()
  return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
}

/**
 * Maps run progress to a beat index with holds: n beats over 0..1, each beat rests for most of its share and the
 * last third of the way blends into the next. Returns a continuous 0..n-1.
 */
export function beat(p: number, n: number, hold = 0.55) {
  if (n <= 1) return 0
  const x = Math.min(1, Math.max(0, p)) * (n - 1)
  const i = Math.min(n - 2, Math.floor(x))
  const f = x - i
  const a = hold / 2
  const t = Math.min(1, Math.max(0, (f - a) / (1 - hold)))
  return i + t * t * (3 - 2 * t)
}
