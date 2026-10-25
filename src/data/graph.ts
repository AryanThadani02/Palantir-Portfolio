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
   * 0 portrait · 1 raw table · 2 horizon · 3 career skyline · 4 hidden (Work) · 5 hidden (Stack) · 6 colour portrait.
   */
  shape: 0,
  /** 0 dark theme … 1 light theme (eased). */
  light: 0,
  /** Experience skyline: normalised x of the first tower, spacing between towers, and the active tower. */
  trackBase: 0,
  slideW: 1,
  activeTower: 0,
  towerScale: 1,
  /** 0..1 at Contact: the regathered particles resolve into the real photo. */
  reform: 0,
}
