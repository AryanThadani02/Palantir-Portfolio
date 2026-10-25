import { scrollToTarget, stickyEnd } from './scroll'

/** `?film` plays the page hands-free at a steady pace — made for screen-recording a post video. */
export const FILM_MODE = new URLSearchParams(location.search).has('film')

const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000))

/**
 * Portrait (the autopilot paints colour across it) → raw table → particles, then a glide through every
 * `[data-film]` section. `[data-film-run]` sections are pinned: they're scrolled through linearly instead.
 */
export async function playFilm() {
  await wait(5)
  const intro = document.getElementById('intro')
  if (intro) {
    scrollToTarget(stickyEnd(intro), { duration: 10, linear: true })
    await wait(11.5)
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-film], [data-film-run]')) {
    if (el.dataset.filmRun) {
      const run = Number(el.dataset.filmRun)
      scrollToTarget(el, { duration: 2.4 })
      await wait(2.8)
      scrollToTarget(stickyEnd(el), { duration: run, linear: true })
      await wait(run + 1.2)
    } else {
      const hold = Number(el.dataset.film) || 2.6
      scrollToTarget(el, { duration: 2.4 })
      await wait(2.4 + hold)
    }
  }
}

/**
 * Film mode is for recording only: any deliberate input (scroll, click, tap, Esc) drops back to the
 * normal interactive site. Mouse movement alone doesn't, so a nudge mid-recording won't ruin a take.
 */
export function exitFilmOnInput() {
  if (!FILM_MODE) return
  const exit = () => {
    const url = new URL(location.href)
    url.searchParams.delete('film')
    location.replace(url.toString())
  }
  window.addEventListener('wheel', exit, { once: true, passive: true })
  window.addEventListener('mousedown', exit, { once: true })
  window.addEventListener('touchstart', exit, { once: true, passive: true })
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === ' ' || e.key.startsWith('Arrow') || e.key.startsWith('Page')) exit()
  })
}
