import { useEffect, useRef, useState } from 'react'
import { useCursorLabel } from '../lib/store'
import { FILM_MODE } from '../lib/film'

/** A dot that tracks the pointer and a lagging ring that grows over interactive things. */
export function Cursor() {
  const label = useCursorLabel()
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [overControl, setOverControl] = useState(false)
  // Visibility lives in React state: toggling classes directly would be wiped on the next render.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (FILM_MODE || !matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    const pos = { x: -100, y: -100 }
    const lag = { x: -100, y: -100 }
    let seen = false

    const move = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (!seen) {
        seen = true
        lag.x = pos.x
        lag.y = pos.y
      }
      setVisible(true)
      setOverControl(!!(e.target as Element | null)?.closest?.('a, button'))
    }
    const leave = () => setVisible(false)

    let id = 0
    const tick = () => {
      lag.x += (pos.x - lag.x) * 0.16
      lag.y += (pos.y - lag.y) * 0.16
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  if (FILM_MODE) return null

  return (
    <div
      className={`cursor ${visible ? 'is-visible' : ''} ${overControl || label ? 'is-hover' : ''}`}
      aria-hidden
    >
      <div ref={ring} className="cursor__ring">
        <span className="cursor__label">{label}</span>
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
