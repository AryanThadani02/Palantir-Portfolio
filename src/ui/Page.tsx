import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { PROFILE } from '../data/ontology'
import { CERTIFICATIONS, SKILLS } from '../data/content'
import { overlayRefs, useIntroDone } from '../lib/store'
import { scrollToTarget } from '../lib/scroll'
import { runProgress } from '../lib/runs'
import { pointer } from '../lib/pointer'
import { useMagnetic } from '../lib/useMagnetic'
import { About, ExperienceSection, Work } from './Chapters'
import { SectionHead } from './common'
import { CertAssembly } from './CertAssembly'
import { IconMark } from './Logo'

// The physics playground (and matter-js) loads on its own, after the first paint.
const StackPlayground = lazy(() => import('./StackPlayground').then((m) => ({ default: m.StackPlayground })))

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'stack', label: 'Stack' },
  { id: 'contact', label: 'Contact' },
]

const go = (id: string) => scrollToTarget(`#${id}`, { duration: 2 })

/** Adds `is-in` to every `[data-reveal]` element the first time it scrolls into view. */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export function Page() {
  const introDone = useIntroDone()
  useReveal()

  return (
    <div ref={(el) => void (overlayRefs.root = el)} className={`page ${introDone ? 'is-ready' : ''}`}>
      <Topbar />
      <main>
        <section id="intro" className="intro" data-theme="dark">
          <div className="intro__sticky">
            <Hero />
            <IntroCaption />
          </div>
        </section>
        <About />
        <ExperienceSection />
        <Work />
        <Certifications />
        <Stack />
        <Contact />
      </main>
    </div>
  )
}

function LocalTime() {
  const format = () =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date())
  const [time, setTime] = useState(format)
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 15_000)
    return () => clearInterval(id)
  }, [])
  return <span className="local-time">IN {time} IST</span>
}

function Topbar() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
  }, [open])
  const goFromMenu = (id: string) => {
    setOpen(false)
    window.setTimeout(() => go(id), 350)
  }

  return (
    <>
    <header className="topbar">
      <button className="brand" onClick={() => scrollToTarget(0, { duration: 2.4 })}>
        <span className="brand__mark">{PROFILE.photo ? <img src={PROFILE.photo} alt="" /> : 'AT'}</span>
        <span className="brand__name">{PROFILE.name}</span>
      </button>
      <nav className="topbar__nav" aria-label="Sections">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => go(n.id)}>
            {n.label}
          </button>
        ))}
      </nav>
      <LocalTime />
      <button className={`menu-btn ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
        <span />
        <span />
      </button>
    </header>
    <div className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <nav className="menu__links">
        {NAV.map((n, i) => (
          <button key={n.id} style={{ '--i': i } as CSSProperties} onClick={() => goFromMenu(n.id)} tabIndex={open ? 0 : -1}>
            <sup>{String(i + 1).padStart(2, '0')}</sup>
            {n.label}
          </button>
        ))}
      </nav>
      <div className="menu__foot">
        <a href={`mailto:${PROFILE.email}`} tabIndex={open ? 0 : -1}>
          {PROFILE.email}
        </a>
        <LocalTime />
      </div>
    </div>
    </>
  )
}

function Hero() {
  return (
    <div className="hero">
      <p className="eyebrow hero__eyebrow">{PROFILE.title}</p>
      <h1 className="hero__title" aria-label={PROFILE.name}>
        <span className="mask-line">
          <span>Aryan</span>
        </span>
        <span className="mask-line">
          <span>Thadani</span>
        </span>
      </h1>
      <p className="hero__lede">Ontologies, pipelines and AIP applications — built on Palantir Foundry.</p>
      <div className="hero__foot">
        <span>Based in {PROFILE.location}</span>
        <span>{pointer.coarse ? 'Scroll ↓' : 'Move across the photo · Scroll ↓'}</span>
      </div>
    </div>
  )
}

/** Captions the raw table (driven by --dissolve / --intro). */
function IntroCaption() {
  return (
    <div className="intro-caption" aria-hidden>
      <p className="intro-caption__line intro-caption__line--raw">
        <b>raw_career_data.csv</b> · 6 columns · 41 rows · 0 links
      </p>
    </div>
  )
}

function Stack() {
  return (
    <section id="stack" className="section stack" data-theme="dark" data-shape="6" data-film="6">
      <SectionHead index="05" label="Stack" aside={`${SKILLS.length} tools`} />
      <h2 className="stack__title skew" data-reveal>
        <span className="mask-line">
          <span>Tools I build with —</span>
        </span>
        <span className="mask-line">
          <span>
            <em>go on, play with them.</em>
          </span>
        </span>
      </h2>
      <Suspense fallback={<div className="play" aria-hidden />}>
        <StackPlayground />
      </Suspense>
    </section>
  )
}

/**
 * Pinned horizontal track: vertical scroll slides the credentials left to right; whichever card reaches the
 * centre assembles itself out of particles and becomes the clickable one.
 */
function Certifications() {
  const run = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [centre, setCentre] = useState(-1)
  const n = CERTIFICATIONS.length

  useEffect(() => {
    let id = 0
    let last = -2
    const tick = () => {
      const el = run.current
      const tr = track.current
      if (el && tr) {
        const p = runProgress(el)
        el.style.setProperty('--p', p.toFixed(4))
        const cards = [...tr.children] as HTMLElement[]
        const first = cards[0]
        const lastCard = cards[cards.length - 1]
        if (first && lastCard) {
          // Slide so card k is centred at p = k / (n - 1).
          const start = first.offsetLeft + first.offsetWidth / 2
          const end = lastCard.offsetLeft + lastCard.offsetWidth / 2
          const x = start + (end - start) * p - innerWidth / 2
          tr.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`
          const mid = innerWidth / 2
          let best = -1
          cards.forEach((c, k) => {
            const r = c.getBoundingClientRect()
            const off = (r.left + r.width / 2 - mid) / innerWidth
            c.style.setProperty('--off', off.toFixed(3))
            if (Math.abs(off) < 0.12) best = k
          })
          // Only once the section actually holds the screen.
          const r = el.getBoundingClientRect()
          if (r.top > innerHeight * 0.3 || r.bottom < innerHeight * 0.7) best = -1
          if (best !== last) {
            last = best
            setCentre(best)
          }
        }
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section
      ref={run}
      id="certifications"
      className="run certs-run"
      data-theme="dark"
      data-shape="5"
      data-film-run="10"
      style={{ '--n': n } as CSSProperties}
    >
      <div className="run__sticky">
        <div className="certs-run__head">
          <SectionHead index="04" label="Certifications" aside="Palantir Technologies · Verified on Skilljar" />
          <p className="certs-run__count" aria-hidden>
            <b>{String(Math.max(0, centre) + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}
          </p>
        </div>
        <div ref={track} className="certs-track">
          {CERTIFICATIONS.map((c, i) => (
            <HoloCard key={c.id} cert={c} index={i} centred={centre === i} />
          ))}
        </div>
        <span className="certs-run__hint">{pointer.coarse ? 'Tap the card to verify' : 'Click the card to verify'}</span>
      </div>
    </section>
  )
}

/**
 * A credential card: tilts toward the pointer under a holographic sheen. Hovering assembles the certificate
 * out of particles; clicking opens the verification link (on touch, the first tap assembles).
 */
function HoloCard({ cert, index, centred }: { cert: (typeof CERTIFICATIONS)[number]; index: number; centred: boolean }) {
  const { title, date, image, url } = cert
  const ref = useRef<HTMLAnchorElement>(null)
  const [hovered, setHovered] = useState(false)
  // Centred in the track (or hovered) = assembled and clickable.
  const active = centred || hovered
  const setActive = setHovered
  const move = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current!
    if (e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', x.toFixed(3))
    el.style.setProperty('--my', y.toFixed(3))
    el.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((x - 0.5) * 18).toFixed(2)}deg`)
    el.classList.add('is-active')
  }
  const leave = () => {
    const el = ref.current!
    el.classList.remove('is-active')
    el.style.removeProperty('--rx')
    el.style.removeProperty('--ry')
    el.style.removeProperty('--mx')
    el.style.removeProperty('--my')
    setActive(false)
  }

  return (
    <div className={`holo-wrap ${centred ? 'is-centred' : ''}`}>
      <a
        ref={ref}
        className={`holo ${active ? 'is-assembled' : ''} ${url ? '' : 'is-pending'}`}
        href={url || undefined}
        target="_blank"
        rel="noreferrer"
        aria-label={`${title} certificate${url ? ' — verify' : ''}`}
        onPointerMove={move}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(true)}
        onPointerLeave={leave}
        // Keyboard: focusing a card assembles it, so Enter goes straight to verification.
        onFocus={() => setActive(true)}
        onBlur={leave}
        onClick={(e) => {
          if (!active || !url) {
            e.preventDefault()
            setActive(true)
          }
        }}
      >
        <CertAssembly image={image} title={title} date={date} active={active} />
        <div className="holo__face">
          <div className="holo__top">
            <span>Palantir</span>
            <span>Cert · {String(index + 1).padStart(2, '0')}</span>
          </div>
          <IconMark icon="palantir" className="holo__logo" />
          <div>
            <p className="holo__kicker">Certified</p>
            <h3 className="holo__title">{title}</h3>
          </div>
          <div className="holo__foot">
            <span>{date}</span>
            <span>{pointer.coarse ? 'Tap to view' : 'Hover to view'}</span>
          </div>
        </div>
        <span className="holo__verify">{url ? 'Verify certificate ↗' : 'Verification link soon'}</span>
      </a>
    </div>
  )
}

function Contact() {
  const links = [
    { label: 'GitHub', href: PROFILE.github },
    { label: 'LinkedIn', href: PROFILE.linkedin },
    { label: 'Résumé', href: PROFILE.resume },
  ].filter((l) => l.href)
  const email = useMagnetic<HTMLAnchorElement>(0.12)

  return (
    <section id="contact" className="contact-run" data-theme="dark" data-film-run="9">
      <div className="section contact">
      <SectionHead index="06" label="Contact" />
      <div className="contact__body">
        <h2 className="contact__title skew" data-reveal>
          <span className="mask-line">
            <span>Let's model</span>
          </span>
          <span className="mask-line">
            <span>what matters.</span>
          </span>
        </h2>
        <a ref={email} className="contact__email" href={`mailto:${PROFILE.email}`} data-reveal>
          {PROFILE.email}
          <span aria-hidden>↗</span>
        </a>
        <div className="contact__links" data-reveal>
          {links.map((l) => (
            <MagneticLink key={l.label} href={l.href} label={l.label} />
          ))}
        </div>
      </div>
      <footer className="footer">
        <span>© {new Date().getFullYear()} {PROFILE.name}</span>
        <span>Palantir Foundry · Ontology · AIP</span>
        <LocalTime />
        <button onClick={() => scrollToTarget(0, { duration: 3 })}>Back to top ↑</button>
      </footer>
      </div>
    </section>
  )
}

function MagneticLink({ href, label }: { href: string; label: string }) {
  const ref = useMagnetic<HTMLAnchorElement>(0.35)
  return (
    <a ref={ref} className="pill" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {label}
      <span aria-hidden>↗</span>
    </a>
  )
}
