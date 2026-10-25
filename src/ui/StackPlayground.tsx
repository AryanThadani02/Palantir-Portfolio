import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Matter from 'matter-js'
import { STACK } from '../data/content'
import { usedIn } from '../data/graph'
import { setCursorLabel } from '../lib/store'
import { pointer } from '../lib/pointer'
import { IconMark } from './Logo'

const { Engine, Bodies, Body, Composite, Constraint, Vector } = Matter

const GROUP_KEYS = ['foundry', 'ai', 'lang', 'data'] as const
const ITEMS = STACK.flatMap((g, gi) => g.items.map((it) => ({ ...it, group: gi })))
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches
/** Cursor repel radius (px) and strength. */
const REPEL_R = 130
const REPEL_K = 0.0016

type Tilt = 'off' | 'ask' | 'on'

/**
 * The stack as a physics playground: every tool is a solid pill that rains in when the section is reached.
 * Drag and throw them, push them with the cursor, make a category leap with the filters, or tilt the phone.
 */
export function StackPlayground() {
  const box = useRef<HTMLDivElement>(null)
  const pills = useRef<(HTMLButtonElement | null)[]>([])
  const api = useRef<{ hop: (group: number | null) => void; tiltOn: () => void } | null>(null)
  const [active, setActive] = useState<number | null>(null)
  const [tilt, setTilt] = useState<Tilt>('off')

  useEffect(() => {
    const el = box.current!
    const engine = Engine.create({ gravity: { x: 0, y: 1.1 }, enableSleeping: false })
    const world = engine.world
    let W = el.clientWidth
    let H = el.clientHeight
    const T = 400

    // Floor, walls and a high ceiling (so thrown pills come back).
    const walls = [
      Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),
      Bodies.rectangle(-T / 2, 0, T, H * 6, { isStatic: true }),
      Bodies.rectangle(W + T / 2, 0, T, H * 6, { isStatic: true }),
      Bodies.rectangle(W / 2, -H * 2.2 - T / 2, W * 3, T, { isStatic: true }),
    ]
    Composite.add(world, walls)
    const placeWalls = () => {
      W = el.clientWidth
      H = el.clientHeight
      Body.setPosition(walls[0], { x: W / 2, y: H + T / 2 })
      Body.setPosition(walls[1], { x: -T / 2, y: 0 })
      Body.setPosition(walls[2], { x: W + T / 2, y: 0 })
      Body.setPosition(walls[3], { x: W / 2, y: -H * 2.2 - T / 2 })
    }

    const bodies: (Matter.Body | null)[] = ITEMS.map(() => null)
    const sizes = ITEMS.map((_, i) => ({ w: pills.current[i]!.offsetWidth, h: pills.current[i]!.offsetHeight }))

    const spawn = (i: number) => {
      const { w, h } = sizes[i]
      const x = w / 2 + 10 + Math.random() * Math.max(1, W - w - 20)
      const y = -h - Math.random() * H * 0.6
      const b = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: h / 2 },
        restitution: 0.32,
        friction: 0.3,
        frictionAir: 0.012,
        density: 0.0016,
        angle: (Math.random() - 0.5) * 0.9,
      })
      bodies[i] = b
      Composite.add(world, b)
      // Inline style, not a class: React re-renders the className on filter clicks and would wipe a class.
      pills.current[i]!.style.opacity = '1'
    }

    // Rain the pills in, group by group, the first time the section is properly in view.
    let started = false
    let visible = false
    const timers: number[] = []
    const start = () => {
      if (started) return
      started = true
      const order = ITEMS.map((_, i) => i)
      order.forEach((i, n) => timers.push(window.setTimeout(() => spawn(i), REDUCED_MOTION ? 0 : n * 85)))
    }
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (e.intersectionRatio > 0.3) start()
      },
      { threshold: [0, 0.3] },
    )
    io.observe(el)

    // Dragging: a spring from the pointer to the grabbed point on the pill.
    let drag: { constraint: Matter.Constraint; id: number } | null = null
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const down = (i: number) => (e: PointerEvent) => {
      const b = bodies[i]
      if (!b) return
      e.preventDefault()
      const p = local(e)
      const constraint = Constraint.create({
        pointA: p,
        bodyB: b,
        pointB: Vector.sub(p, b.position),
        stiffness: 0.16,
        damping: 0.08,
        length: 0,
      })
      Composite.add(world, constraint)
      drag = { constraint, id: e.pointerId }
      // A tiny haptic tick when a pill is grabbed (Android; ignored elsewhere).
      if (e.pointerType === 'touch') navigator.vibrate?.(12)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      el.classList.add('is-dragging')
    }
    const move = (e: PointerEvent) => {
      const p = local(e)
      if (drag && drag.id === e.pointerId) drag.constraint.pointA = p
      mouse.x = p.x
      mouse.y = p.y
      mouse.on = e.pointerType === 'mouse'
    }
    const up = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return
      Composite.remove(world, drag.constraint)
      drag = null
      el.classList.remove('is-dragging')
    }
    const leave = () => (mouse.on = false)
    const mouse = { x: -999, y: -999, on: false }
    const handlers = ITEMS.map((_, i) => down(i))
    handlers.forEach((h, i) => pills.current[i]!.addEventListener('pointerdown', h))
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)

    // Category hop: that group leaps up and spins; "all" gives everyone a smaller hop.
    const hop = (group: number | null) => {
      bodies.forEach((b, i) => {
        if (!b || (group !== null && ITEMS[i].group !== group)) return
        const k = group === null ? 0.6 : 1
        Body.setVelocity(b, { x: (Math.random() - 0.5) * 8 * k, y: -(12 + Math.random() * 8) * k })
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.1 * k)
      })
      if (pointer.coarse) navigator.vibrate?.([8, 40, 8])
    }

    // Phone tilt drives gravity.
    const orient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      engine.gravity.x = Math.max(-1, Math.min(1, e.gamma / 35))
      engine.gravity.y = Math.max(-0.4, Math.min(1.2, e.beta / 45))
    }
    const tiltOn = () => {
      window.addEventListener('deviceorientation', orient)
      setTilt('on')
    }
    api.current = { hop, tiltOn }
    if (pointer.coarse && 'DeviceOrientationEvent' in window) {
      const needsAsk = typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function'
      if (needsAsk) setTilt('ask')
      else tiltOn()
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(1000 / 30, now - last)
      last = now
      if (visible && started) {
        if (mouse.on) {
          for (const b of bodies) {
            if (!b) continue
            const dx = b.position.x - mouse.x
            const dy = b.position.y - mouse.y
            const d = Math.hypot(dx, dy)
            if (d > 1 && d < REPEL_R && (!drag || drag.constraint.bodyB !== b)) {
              const f = REPEL_K * b.mass * (1 - d / REPEL_R)
              Body.applyForce(b, b.position, { x: (dx / d) * f, y: (dy / d) * f })
            }
          }
        }
        Engine.update(engine, dt)
        bodies.forEach((b, i) => {
          if (!b) return
          const { w, h } = sizes[i]
          pills.current[i]!.style.transform =
            `translate3d(${(b.position.x - w / 2).toFixed(1)}px, ${(b.position.y - h / 2).toFixed(1)}px, 0) rotate(${b.angle.toFixed(3)}rad)`
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(placeWalls)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      io.disconnect()
      ro.disconnect()
      handlers.forEach((h, i) => pills.current[i]?.removeEventListener('pointerdown', h))
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('deviceorientation', orient)
      Engine.clear(engine)
    }
  }, [])

  const pick = (group: number | null) => {
    setActive(group)
    api.current?.hop(group)
  }

  const askTilt = async () => {
    try {
      const res = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
      if (res === 'granted') api.current?.tiltOn()
    } catch {
      /* declined */
    }
  }

  return (
    <div className="play">
      <div className="play__bar">
        <div className="play__filters" role="group" aria-label="Filter by category">
          <button className={active === null ? 'is-on' : ''} onClick={() => pick(null)}>
            All <sup>{ITEMS.length}</sup>
          </button>
          {STACK.map((g, gi) => (
            <button
              key={g.group}
              className={`play__filter play__filter--${GROUP_KEYS[gi]} ${active === gi ? 'is-on' : ''}`}
              onClick={() => pick(gi)}
            >
              <i />
              {g.group} <sup>{g.items.length}</sup>
            </button>
          ))}
        </div>
        <p className="play__hint">
          {tilt === 'ask' ? (
            <button className="play__tilt" onClick={askTilt}>
              Enable tilt ↻
            </button>
          ) : tilt === 'on' ? (
            'Tilt your phone · drag to throw'
          ) : (
            'Drag · throw · push'
          )}
        </p>
      </div>
      <div ref={box} className={`play__box ${active !== null ? 'is-filtered' : ''}`}>
        {ITEMS.map((it, i) => {
          const where = it.id ? usedIn(it.id) : []
          return (
            <button
              key={it.label}
              ref={(b) => void (pills.current[i] = b)}
              className={`pill-tool pill-tool--${GROUP_KEYS[it.group]} ${active === it.group ? 'is-hot' : ''}`}
              style={{ '--i': i } as CSSProperties}
              onMouseEnter={() => setCursorLabel(where.length ? `Used at ${where.join(' · ')}` : STACK[it.group].group)}
              onMouseLeave={() => setCursorLabel(null)}
            >
              <IconMark icon={it.icon} className="pill-tool__icon" />
              {it.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
