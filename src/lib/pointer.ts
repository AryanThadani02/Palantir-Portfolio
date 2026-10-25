/**
 * Window-level pointer position. The 3D scene's own pointer only updates over the canvas,
 * but the hero copy sits on top of it — the portrait reveal must follow the cursor everywhere.
 */
export const pointer = {
  /** Normalised device coordinates, -1..1 (y up). */
  x: 0,
  y: 0,
  /** performance.now() of the last move; 0 = never moved. */
  movedAt: 0,
  /** True for touch-first devices, where the reveal runs on autopilot. */
  coarse: matchMedia('(pointer: coarse)').matches,
}

window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return
  pointer.x = (e.clientX / innerWidth) * 2 - 1
  pointer.y = -((e.clientY / innerHeight) * 2 - 1)
  pointer.movedAt = performance.now()
})
