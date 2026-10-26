import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils } from 'three'
import type { PerspectiveCamera } from 'three'
import { frame, smoothstep } from '../data/graph'
import { ABOUT_WORDS, EXPERIENCE, WORK_STEPS } from '../data/content'
import { beat, runProgress } from '../lib/runs'

import { releaseScroll } from '../lib/scroll'
import { overlayRefs, setIntroDone } from '../lib/store'
import { FILM_MODE, playFilm } from '../lib/film'
import { pointer } from '../lib/pointer'
import { CAMERA_POS, TABLE_CENTER, updatePortrait } from './portrait'
import { Particles } from './Particles'
import { PortraitEnd } from './PortraitEnd'
import { PortraitHero } from './PortraitHero'

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches

/** Seconds the portrait takes to fade in after the loader lifts. */
const APPEAR_SECONDS = 2.2

export function Scene() {
  return (
    <>
      <Rig />
      <PortraitHero />
      <Particles />
      <PortraitEnd />
    </>
  )
}

const clamp01 = (v: number) => MathUtils.clamp(v, 0, 1)

interface Els {
  intro: HTMLElement | null
  exp: HTMLElement | null
  aboutRun: HTMLElement | null
  numbers: HTMLElement | null
  work: HTMLElement | null
  contact: HTMLElement | null
  about: HTMLElement | null
  shapes: HTMLElement[]
  themes: HTMLElement[]
}

/**
 * Reads the page every frame — intro progress, which section is in view, the experience track — and turns it
 * into scene state. Mounted first so the portrait and particles see this frame's values.
 */
function Rig() {
  const { camera, size } = useThree()
  const st = useRef({ introDone: false, intro: 0, collapse: 0, contactP: 0, sway: { x: 0, y: 0 }, theme: '', els: null as Els | null })

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.1)
    const s = st.current
    const vh = innerHeight

    const now = performance.now() / 1000
    frame.appear = frame.loadedAt < 0 ? 0 : REDUCED_MOTION ? 1 : clamp01((now - frame.loadedAt) / APPEAR_SECONDS)
    // Name, chrome and scrolling arrive as the face is uncovered, not after the whole reveal.
    if (frame.appear >= 0.4 && !s.introDone) {
      s.introDone = true
      setIntroDone(true)
      releaseScroll()
      if (FILM_MODE) playFilm()
    }

    if (!s.els) {
      s.els = {
        intro: document.getElementById('intro'),
        exp: document.getElementById('experience'),
        aboutRun: document.querySelector('.about__run'),
        numbers: document.getElementById('numbers'),
        work: document.getElementById('work'),
        contact: document.getElementById('contact'),
        about: document.getElementById('about'),
        shapes: [...document.querySelectorAll<HTMLElement>('[data-shape]')],
        themes: [...document.querySelectorAll<HTMLElement>('[data-theme]')],
      }
    }
    const els = s.els

    // Intro: a sticky run whose progress dissolves the portrait into the raw table. The table then collapses
    // into the horizon *while About scrolls in*, so the screen is never left empty between the two.
    let p = 0
    if (els.intro) {
      const r = els.intro.getBoundingClientRect()
      p = clamp01(-r.top / Math.max(1, r.height - vh))
    }
    s.intro = MathUtils.damp(s.intro, p, 7, step)
    frame.dissolve = clamp01((s.intro - 0.04) / 0.62)
    const collapse = els.about ? smoothstep(vh * 1.05, vh * 0.25, els.about.getBoundingClientRect().top) : 0
    s.collapse = MathUtils.damp(s.collapse, collapse, 7, step)
    frame.intro = s.collapse

    // Each [data-shape] section morphs the particles into its shape as it rises into view.
    let shape = frame.dissolve + frame.intro
    for (const el of els.shapes) shape += smoothstep(vh * 0.95, vh * 0.2, el.getBoundingClientRect().top)

    // Contact is a sticky run of its own, paced like the hero: the particles regather into the portrait over
    // the first part of the run, then the real photo resolves over the next.
    if (els.contact) {
      const top = els.contact.getBoundingClientRect().top
      const cp = clamp01((vh - top) / (vh * 2.4))
      s.contactP = MathUtils.damp(s.contactP, cp, 6, step)
      shape += smoothstep(0, 0.6, s.contactP)
      frame.reform = smoothstep(0.62, 0.95, s.contactP)
    }
    frame.shape = shape

    // Each pinned chapter scrubs its own sub-shape; damped so scroll jitter never reaches the dots.
    const d = (cur: number, to: number) => MathUtils.damp(cur, to, 6, step)
    frame.word = d(frame.word, beat(runProgress(els.aboutRun), ABOUT_WORDS.length))
    frame.stat = d(frame.stat, beat(runProgress(els.numbers), 4))
    frame.logo = d(frame.logo, beat(runProgress(els.exp), EXPERIENCE.length))
    frame.step = d(frame.step, beat(runProgress(els.work), WORK_STEPS.length))

    // Theme: whichever section owns the middle of the viewport.
    let theme = 'dark'
    for (const el of els.themes) {
      const r = el.getBoundingClientRect()
      if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) {
        theme = el.dataset.theme!
        break
      }
    }
    if (theme !== s.theme) {
      s.theme = theme
      document.documentElement.dataset.theme = theme
    }
    frame.light = MathUtils.damp(frame.light, theme === 'light' ? 1 : 0, 5, step)

    // Fixed camera with a little pointer sway once past the portrait (the portrait has its own depth tilt).
    const narrow = size.width / size.height < 0.85
    // No sway while dots draw diagrams under DOM labels (stats → pipelines), so they stay registered.
    const live = FILM_MODE || frame.intro < 1 || (frame.shape > 2.6 && frame.shape < 5.9) ? 0 : 1
    s.sway.x = MathUtils.damp(s.sway.x, pointer.x * live, 2, step)
    s.sway.y = MathUtils.damp(s.sway.y, pointer.y * live, 2, step)
    camera.position.set(CAMERA_POS.x + s.sway.x * 0.25, CAMERA_POS.y + s.sway.y * 0.18, CAMERA_POS.z)
    camera.lookAt(TABLE_CENTER)
    updatePortrait(camera as PerspectiveCamera, CAMERA_POS.z - TABLE_CENTER.z, narrow)

    const root = overlayRefs.root
    if (root) {
      root.style.setProperty('--dissolve', frame.dissolve.toFixed(3))
      root.style.setProperty('--intro', frame.intro.toFixed(3))
    }
  })

  return null
}
