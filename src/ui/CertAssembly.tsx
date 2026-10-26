import { useEffect, useRef } from 'react'

/** Points sampled off the certificate (more = sharper while assembling, slower to draw). */
const POINTS = 7000
/** Inset of the certificate inside the card, px. */
const PAD = 12
/** Seconds for the full assembly (dots in + the sharp image resolving). */
const ASSEMBLE = 2.6
/** Each dot's flight, as a fraction of the whole assembly. */
const FLIGHT = 0.46

interface Dot {
  x: number
  y: number
  sx: number
  sy: number
  delay: number
  color: string
}

/** A drawn stand-in until the real certificate image is in public/certs. */
function placeholder(title: string, date: string) {
  const c = document.createElement('canvas')
  c.width = 1200
  c.height = 850
  const g = c.getContext('2d')!
  g.fillStyle = '#f6f6f3'
  g.fillRect(0, 0, 1200, 850)
  g.strokeStyle = '#1b2333'
  g.lineWidth = 6
  g.strokeRect(40, 40, 1120, 770)
  g.lineWidth = 1.5
  g.strokeRect(62, 62, 1076, 726)
  g.fillStyle = '#1b2333'
  g.textAlign = 'center'
  g.font = '600 34px Geist, system-ui, sans-serif'
  g.fillText('P A L A N T I R', 600, 170)
  g.font = '400 30px Geist, system-ui, sans-serif'
  g.fillText('Certificate of Achievement', 600, 260)
  g.font = '500 64px Geist, system-ui, sans-serif'
  g.fillText(title, 600, 400)
  g.font = '400 30px Geist, system-ui, sans-serif'
  g.fillText('awarded to', 600, 480)
  g.font = '500 52px Geist, system-ui, sans-serif'
  g.fillText('Aryan Thadani', 600, 560)
  g.font = '400 26px Geist, system-ui, sans-serif'
  g.fillStyle = '#5b6575'
  g.fillText(date, 600, 700)
  return c
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Canvas overlay for a certification card: while `active`, the certificate's pixels fly in from scattered
 * positions and settle into the image, then the sharp image fades in. Releasing plays it backwards.
 */
export function CertAssembly({ image, title, date, active }: { image: string; title: string; date: string; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const state = useRef<{ source: CanvasImageSource | null; dots: Dot[]; rect: { x: number; y: number; w: number; h: number }; p: number; size: number; raf: number }>({
    source: null,
    dots: [],
    rect: { x: 0, y: 0, w: 0, h: 0 },
    p: 0,
    size: 2,
    raf: 0,
  })

  // Build the dot field the first time the card is activated (lazy: no work for cards nobody hovers).
  const prepare = async () => {
    const s = state.current
    const el = canvas.current
    if (!el || s.dots.length) return
    const img = await loadImage(image)
    const source: HTMLImageElement | HTMLCanvasElement = img ?? placeholder(title, date)
    const sw = source.width
    const sh = source.height
    const dpr = Math.min(2, devicePixelRatio)
    const cw = el.clientWidth
    const ch = el.clientHeight
    el.width = cw * dpr
    el.height = ch * dpr
    const scale = Math.min((cw - PAD * 2) / sw, (ch - PAD * 2) / sh)
    const w = sw * scale
    const h = sh * scale
    const rect = { x: (cw - w) / 2, y: (ch - h) / 2, w, h }

    const sample = document.createElement('canvas')
    sample.width = Math.max(1, Math.round(w))
    sample.height = Math.max(1, Math.round(h))
    const sg = sample.getContext('2d', { willReadFrequently: true })!
    sg.drawImage(source, 0, 0, sample.width, sample.height)
    const data = sg.getImageData(0, 0, sample.width, sample.height).data

    const step = Math.sqrt((w * h) / POINTS)
    const dots: Dot[] = []
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const i = (Math.floor(y) * sample.width + Math.floor(x)) * 4
        const a = Math.random() * Math.PI * 2
        const r = Math.max(cw, ch) * (0.35 + Math.random() * 0.6)
        dots.push({
          x: rect.x + x,
          y: rect.y + y,
          sx: cw / 2 + Math.cos(a) * r,
          sy: ch / 2 + Math.sin(a) * r,
          // Arrival sweeps top → bottom with jitter; all dots land by p = DELAY_SPAN + FLIGHT (≤ 0.88).
          delay: (y / h) * 0.28 + Math.random() * 0.12,
          color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
        })
      }
    }
    Object.assign(s, { source, dots, rect, size: step * 0.92 })
  }

  useEffect(() => {
    const s = state.current
    let last = 0
    const draw = (now: number) => {
      const el = canvas.current
      if (!el || !s.dots.length) return
      // Time-based, constant pace: ASSEMBLE seconds in, a little quicker out. Each dot gets its own
      // eased flight inside that window, so the whole thing moves at one even, readable speed.
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const target = activeRef.current ? 1 : 0
      const speed = target ? 1 / ASSEMBLE : 1 / (ASSEMBLE * 0.6)
      s.p = target > s.p ? Math.min(1, s.p + dt * speed) : Math.max(0, s.p - dt * speed)
      const g = el.getContext('2d')!
      const dpr = el.width / el.clientWidth
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, el.clientWidth, el.clientHeight)
      const sharp = Math.min(1, Math.max(0, (s.p - 0.88) / 0.12))
      if (s.p > 0) {
        // Once the sharp image is fully in, the dots underneath are redundant (and their grid overhangs it).
        if (sharp < 1) for (const d of s.dots) {
          const t = Math.min(1, Math.max(0, (s.p - d.delay) / FLIGHT))
          if (t <= 0) continue
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          g.globalAlpha = Math.min(1, t * 2.5)
          g.fillStyle = d.color
          g.fillRect(d.sx + (d.x - d.sx) * e, d.sy + (d.y - d.sy) * e, s.size, s.size)
        }
        // Once settled, the real image resolves on top of the dots.
        if (sharp > 0 && s.source) {
          g.globalAlpha = sharp
          g.drawImage(s.source, s.rect.x, s.rect.y, s.rect.w, s.rect.h)
        }
        g.globalAlpha = 1
      }
      if (s.p !== target) s.raf = requestAnimationFrame(draw)
      else {
        s.raf = 0
        last = 0
      }
    }
    if (active) {
      prepare().then(() => {
        cancelAnimationFrame(s.raf)
        s.raf = requestAnimationFrame(draw)
      })
    } else if (s.dots.length) {
      cancelAnimationFrame(s.raf)
      s.raf = requestAnimationFrame(draw)
    }
    return () => cancelAnimationFrame(s.raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return <canvas ref={canvas} className="cert-canvas" aria-hidden />
}
