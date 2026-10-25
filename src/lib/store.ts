import { useSyncExternalStore } from 'react'

function createSignal<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    set(next: T) {
      if (next === value) return
      value = next
      listeners.forEach((l) => l())
    },
    use() {
      return useSyncExternalStore(
        (l) => {
          listeners.add(l)
          return () => listeners.delete(l)
        },
        () => value,
      )
    },
  }
}

/** Whether the portrait has finished powering on (unlocks scroll, fades in the chrome). */
const introDone = createSignal(false)
export const setIntroDone = introDone.set
export const useIntroDone = introDone.use

/** Text shown next to the custom cursor. */
const cursorLabel = createSignal<string | null>(null)
export const setCursorLabel = cursorLabel.set
export const useCursorLabel = cursorLabel.use

/** The DOM root the scene writes per-frame CSS variables onto (--dissolve, --intro). */
export const overlayRefs: { root: HTMLElement | null } = { root: null }
