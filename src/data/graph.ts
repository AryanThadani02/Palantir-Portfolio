import { LINKS, OBJECTS, type OntologyObject } from './ontology'

export const OBJECT_BY_ID = new Map(OBJECTS.map((o) => [o.id, o]))

/** Linked objects of `id`, grouped by the link label as seen from `id`. */
export function linkedGroups(id: string): [string, OntologyObject[]][] {
  const groups = new Map<string, OntologyObject[]>()
  for (const l of LINKS) {
    const [label, other] =
      l.from === id ? [l.label, l.to] : l.to === id ? [l.inverse, l.from] : [null, null]
    if (!label || !other) continue
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(OBJECT_BY_ID.get(other)!)
  }
  return [...groups]
}

/** Where a skill was used: companies (for roles) and project names that link to it. */
export function usedIn(skillId: string): string[] {
  const out = new Set<string>()
  for (const l of LINKS) {
    if (l.to !== skillId) continue
    const o = OBJECT_BY_ID.get(l.from)!
    if (o.type === 'role') out.add(o.subtitle!.split(' · ')[0])
    else if (o.type === 'project') out.add(o.title)
  }
  return [...out]
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export const MAX_PILLS = 32
export const PILL_STRIDE = 8

/** Shared per-frame state, written once per frame by the rig and read by the scene and shaders. */
export const frame = {
  /** performance.now()/1000 when the loader lifted; -1 while loading. */
  loadedAt: -1,
  /** 0..1 fade-in of the portrait after load (time-driven). */
  appear: 0,
  /** 0..1 scroll-driven dissolve of the portrait into the raw table. */
  dissolve: 0,
  /** 0..1 scroll-driven collapse of the raw table into the first shape. */
  intro: 0,
  /**
   * Which shape the particles hold, as a continuous value:
   * 0 portrait · 1 raw table · 2 About words · 3 company logos · 4 Work pictograms · 5 hidden (certs) · 6 Stack floor ·
   * 7 colour portrait.
   */
  shape: 0,
  /** 0 dark theme … 1 light theme (eased). */
  light: 0,
  /** About: continuous word index 0..3 (raw data · ontology · pipelines · apps). */
  word: 0,
  /** Experience: continuous logo index 0..4 (oldest → newest). */
  logo: 0,
  /** Work: continuous step index across both projects' pipelines (WORK_STEPS). */
  step: 0,
  /** 0..1 at Contact: the regathered particles resolve into the real photo. */
  reform: 0,
  /** Stack arena: centre + half-size in normalised view units, and its size in CSS px. */
  box: { x: 0, y: 0, hx: 0, hy: 0, w: 1, h: 1 },
  /**
   * Stack pills, PILL_STRIDE floats each, box-local px: centre x, y, half-width, half-height, angle,
   * velocity x, y (px/frame), and `age + 1000 * heat` — seconds since its last impact (99 = none) and its
   * filter heat (0 dimmed · 1 normal · 2 the chosen group). Half-size 0 = not spawned.
   */
  pills: new Float32Array(MAX_PILLS * PILL_STRIDE),
  /** Cursor over the arena, box-local px; z = 1 while it's there. */
  cursor: { x: -999, y: -999, on: 0 },
}
