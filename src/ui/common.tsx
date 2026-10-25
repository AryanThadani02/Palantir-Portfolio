import { useEffect, useRef } from 'react'

export function SectionHead({ index, label, aside }: { index: string; label: string; aside?: string }) {
  return (
    <header className="section-head" data-reveal>
      <span className="section-head__index">({index})</span>
      <span className="section-head__label">{label}</span>
      <span className="section-head__rule" />
      {aside && <span className="section-head__aside">{aside}</span>}
    </header>
  )
}

/** Counts every number in `value` up from zero the first time it's seen ("30–35%" → 0–0% … 30–35%). */
export function CountUp({ value, className = 'stat__value' }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current!
    let id = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1800)
          const e = 1 - Math.pow(1 - t, 4)
          el.textContent = value.replace(/\d+/g, (d) => String(Math.round(Number(d) * e)))
          if (t < 1) id = requestAnimationFrame(tick)
        }
        id = requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(id)
    }
  }, [value])
  return (
    <span ref={ref} className={className}>
      {value.replace(/\d+/g, '0')}
    </span>
  )
}

/** Moves a soft spotlight (--mx/--my, px) under the pointer on any `.spot` card inside `root`. */
export function useSpotlight(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const move = (e: PointerEvent) => {
      el.querySelectorAll<HTMLElement>('.spot').forEach((card) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  }, [root])
}
