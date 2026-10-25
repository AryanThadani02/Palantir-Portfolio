import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { PROFILE } from '../data/ontology'
import { frame } from '../data/graph'

/** Minimum time on screen, so the count reads as an intro rather than a flash. */
const MIN_SECONDS = 1.6
/** Give up waiting on the loading manager after this long. */
const MAX_SECONDS = 6

/** 000 → 100 counter; when assets are in, it lifts away and the portrait fades in beneath it. */
export function Loader() {
  const { progress } = useProgress()
  const progressRef = useRef(0)
  progressRef.current = progress
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const start = performance.now()
    let shown = 0
    let id = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      const target = Math.min(progressRef.current, (t / MIN_SECONDS) * 100, 100)
      shown += (target - shown) * 0.12
      setCount(Math.round(shown))
      const ready = (progressRef.current >= 100 && t >= MIN_SECONDS && shown > 99) || t > MAX_SECONDS
      if (ready) {
        setCount(100)
        setDone(true)
        frame.loadedAt = now / 1000 + 0.7 // as the loader's slide-up is almost done
        return
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`loader ${done ? 'is-done' : ''}`} aria-hidden>
      <div className="loader__top">
        <span>{PROFILE.name}</span>
        <span>Portfolio — {new Date().getFullYear()}</span>
      </div>
      <div className="loader__bottom">
        <div className="loader__bar">
          <span style={{ transform: `scaleX(${count / 100})` }} />
        </div>
        <span className="loader__count">{String(count).padStart(3, '0')}</span>
      </div>
    </div>
  )
}
