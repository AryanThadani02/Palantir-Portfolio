import Lenis from 'lenis'

let lenis: Lenis | null = null
let velocity = 0

/** Current scroll velocity (px per frame, signed) — drives marquee speed and the type skew. */
export const getVelocity = () => velocity

export function initScroll() {
  // The page always opens on the portrait, so start at the top.
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
  lenis.stop()

  let id = 0
  const raf = (time: number) => {
    lenis?.raf(time)
    velocity = lenis?.velocity ?? 0
    document.documentElement.style.setProperty('--vel', Math.max(-60, Math.min(60, velocity)).toFixed(2))
    id = requestAnimationFrame(raf)
  }
  id = requestAnimationFrame(raf)

  return () => {
    cancelAnimationFrame(id)
    lenis?.destroy()
    lenis = null
  }
}

/** Unlocks scrolling once the portrait has powered on. */
export function releaseScroll() {
  lenis?.start()
}

export function scrollToTarget(
  target: string | HTMLElement | number,
  { duration = 1.8, offset = 0, linear = false }: { duration?: number; offset?: number; linear?: boolean } = {},
) {
  if (!lenis) return
  lenis.scrollTo(target, {
    duration,
    offset,
    force: true,
    easing: linear ? (t) => t : (t) => 1 - Math.pow(1 - t, 4),
  })
}

/** Scroll position of the bottom edge of an element's sticky run (where its pinned content lets go). */
export function stickyEnd(el: HTMLElement) {
  return el.offsetTop + el.offsetHeight - innerHeight
}
