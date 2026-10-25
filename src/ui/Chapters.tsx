import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { EXPERIENCE, WORK, type CaseStudy } from '../data/content'
import { OBJECT_BY_ID, linkedGroups } from '../data/graph'
import { PROFILE } from '../data/ontology'
import { CountUp, SectionHead, useSpotlight } from './common'
import { IconMark, LogoTile } from './Logo'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const isDark = (logo: string) => /vanyar|lachoo/.test(logo)

/** Writes the sticky run's 0..1 progress into `--p` on `ref` every frame. */
function useRunProgress(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    let id = 0
    const tick = () => {
      const el = ref.current
      if (el) {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--p', clamp01(-r.top / Math.max(1, r.height - innerHeight)).toFixed(4))
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [ref])
}

// ---------- About ----------

type Token = string | { chip: string; icon: string; tone: 'ink' | 'blue' | 'line' }

/** The manifesto, with inline chips that pop in as the scrub reaches them. */
const MANIFESTO: Token[] = [
  'I', 'turn', 'messy', 'operational', 'data', { chip: 'raw.csv', icon: 'document', tone: 'line' },
  'into', 'ontologies', { chip: 'Ontology', icon: 'graph', tone: 'blue' },
  'people', 'can', 'act', 'on', '—', 'pipelines', { chip: 'Pipelines', icon: 'data-lineage', tone: 'ink' }, 'in,',
  'governed', 'Workshop,', 'OSDK', 'and', 'AIP', 'applications', { chip: 'Apps', icon: 'application', tone: 'blue' }, 'out.',
]

export function About() {
  const run = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  useRunProgress(run)
  useSpotlight(grid)
  const n = MANIFESTO.length

  return (
    <section id="about" className="about" data-theme="light">
      <div ref={run} className="about__run" data-film-run="6" style={{ '--n': n } as CSSProperties}>
        <div className="about__sticky">
          <SectionHead index="01" label="About" aside="Manifesto" />
          <p className="manifesto">
            {MANIFESTO.map((t, i) =>
              typeof t === 'string' ? (
                <span key={i} className="mw" style={{ '--i': i } as CSSProperties}>
                  {t}
                </span>
              ) : (
                <span key={i} className={`mchip mchip--${t.tone}`} style={{ '--i': i } as CSSProperties} aria-hidden>
                  <IconMark icon={t.icon} />
                  <b>{t.chip}</b>
                </span>
              ),
            )}
          </p>
        </div>
      </div>

      <div ref={grid} className="bento section">
        <Bento className="bento__now" index={0}>
          <span className="bento__kicker">
            <i className="live-dot" /> Currently
          </span>
          <div className="now">
            <LogoTile src="/logos/vanyar.jpg" dark />
            <div>
              <p className="now__role">Foundry Developer</p>
              <p className="now__org">Vanyar · Palantir Ecosystem</p>
            </div>
          </div>
          <p className="bento__body">
            Modelling Ontologies with domain experts and shipping governed Workshop, OSDK and AIP apps for real-estate and
            healthcare clients.
          </p>
          <div className="now__tags">
            {['Ontology', 'Pipeline Builder', 'Workshop', 'OSDK', 'AIP Agents', 'Salesforce'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </Bento>

        <Bento className="bento__bars" index={1}>
          <span className="bento__kicker">Reporting efficiency</span>
          <CountUp value="30–35%" className="bento__num" />
          <div className="bars" aria-hidden>
            {[38, 46, 41, 58, 63, 70, 84, 92].map((h, i) => (
              <span key={i} style={{ '--h': `${h}%`, '--i': i } as CSSProperties} />
            ))}
          </div>
          <p className="bento__foot">Governed Workshop &amp; OSDK apps</p>
        </Bento>

        <Bento className="bento__ring" index={2}>
          <span className="bento__kicker">Manual effort removed</span>
          <div className="ring" aria-hidden>
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" />
              <circle cx="60" cy="60" r="52" className="ring__fill" pathLength="100" />
            </svg>
            <CountUp value="80%" className="ring__num" />
          </div>
          <p className="bento__foot">PDF → Ontology, end to end</p>
        </Bento>

        <Bento className="bento__certs" index={3}>
          <span className="bento__kicker">Palantir certified</span>
          <CountUp value="4" className="bento__num" />
          <div className="badges" aria-hidden>
            {['AI', 'DE', 'AD', 'FA'].map((b, i) => (
              <span key={b} style={{ '--i': i } as CSSProperties}>
                <IconMark icon="palantir" />
                <b>{b}</b>
              </span>
            ))}
          </div>
          <p className="bento__foot">AI · Data · Apps · Aware</p>
        </Bento>

        <Bento className="bento__years" index={4}>
          <span className="bento__kicker">On Foundry</span>
          <CountUp value="2" className="bento__num" />
          <span className="bento__unit">years, three industries</span>
          <div className="domains">
            {['Manufacturing', 'Real estate', 'Healthcare'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </Bento>

        <Bento className="bento__place" index={5}>
          <span className="bento__kicker">Based in</span>
          <p className="bento__city">{PROFILE.location}</p>
          <Clock />
          <a className="bento__cta" href={`mailto:${PROFILE.email}`}>
            Open to Foundry roles <span aria-hidden>↗</span>
          </a>
        </Bento>
      </div>
    </section>
  )
}

function Bento({ className, index, children }: { className: string; index: number; children: ReactNode }) {
  return (
    <div className={`bento__card spot ${className}`} data-reveal style={{ '--d': `${index * 80}ms` } as CSSProperties}>
      {children}
    </div>
  )
}

function Clock() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date())
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <p className="bento__clock">
      {t} <span>IST</span>
    </p>
  )
}

// ---------- Experience ----------

/** Newest first: the index reads like a CV; hovering a row slides that role's headline impact in beside it. */
const ROLES = [...EXPERIENCE].reverse()

export function ExperienceSection() {
  const list = useRef<HTMLOListElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="experience" className="section xp" data-theme="dark" data-shape="3" data-film="5">
      <SectionHead index="02" label="Experience" aside={`${EXPERIENCE[0].year} → Present`} />
      <h2 className="xp__title skew" data-reveal>
        <span className="mask-line">
          <span>Five chapters,</span>
        </span>
        <span className="mask-line">
          <span>
            <em>one direction.</em>
          </span>
        </span>
      </h2>

      <ol ref={list} className="xp__list" onMouseLeave={() => setHover(null)}>
        {ROLES.map((e, i) => {
          const o = OBJECT_BY_ID.get(e.id)!
          const period = o.properties?.find((p) => p.label === 'Period')?.value ?? ''
          const facts = o.properties?.filter((p) => p.label !== 'Period') ?? []
          const skills = linkedGroups(e.id).flatMap(([, objs]) => objs.filter((x) => x.type === 'skill'))
          const isOpen = open === i
          return (
            <li key={e.id} className={`xrow ${isOpen ? 'is-open' : ''} ${hover !== null && hover !== i ? 'is-dim' : ''}`}>
              {/* Reveal lives on a wrapper React never re-classes, so hover/open can't wipe it. */}
              <div className="xrow__reveal" data-reveal style={{ '--d': `${i * 70}ms` } as CSSProperties}>
              <button
                className="xrow__head"
                onMouseEnter={() => setHover(i)}
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="xrow__index">{String(ROLES.length - i).padStart(2, '0')}</span>
                <span className="xrow__period">{period}</span>
                <span className="xrow__title">
                  {o.title}
                  {facts[facts.length - 1] && (
                    <span className="xrow__impact">
                      <i>{facts[facts.length - 1].label}</i>
                      {facts[facts.length - 1].value}
                    </span>
                  )}
                </span>
                <span className="xrow__org">
                  <LogoTile src={e.logo || undefined} icon="learning" dark={isDark(e.logo)} />
                  {o.subtitle}
                </span>
                <span className="xrow__toggle" aria-hidden />
              </button>
              <div className="xrow__body">
                <div className="xrow__inner">
                  {facts.length > 0 && (
                    <dl className="xrow__facts">
                      {facts.map((f) => (
                        <div key={f.label}>
                          <dt>{f.label}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {o.highlights && (
                    <ul className="xrow__points">
                      {o.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                  {skills.length > 0 && (
                    <ul className="tags">
                      {skills.map((s) => (
                        <li key={s.id}>{s.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              </div>
            </li>
          )
        })}
      </ol>

    </section>
  )
}

// ---------- Work ----------

export function Work() {
  const cards = useRef<(HTMLElement | null)[]>([])

  // Stacking: as the next card slides over, the one beneath settles back (scale down, dim).
  useEffect(() => {
    let id = 0
    const tick = () => {
      const vh = innerHeight
      cards.current.forEach((el, i) => {
        const next = cards.current[i + 1]
        if (!el) return
        const p = next ? clamp01((vh - next.getBoundingClientRect().top) / (vh * 0.85)) : 0
        el.style.setProperty('--under', p.toFixed(3))
      })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section id="work" className="section work" data-theme="light" data-shape="4">
      <SectionHead index="03" label="Selected work" aside="Client projects" />
      <div className="work__deck">
        {WORK.map((cs, i) => (
          <article
            key={cs.id}
            ref={(el) => void (cards.current[i] = el)}
            className="pcard"
            data-film="4"
            style={{ '--k': i } as CSSProperties}
          >
            <ProjectCard cs={cs} />
          </article>
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ cs }: { cs: CaseStudy }) {
  const o = OBJECT_BY_ID.get(cs.id)!
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLive(true), { threshold: 0.35 })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  const steps = cs.flows.reduce((a, f) => a + f.steps.length, 0)

  return (
    <div ref={ref} className={`pcard__inner ${live ? 'is-live' : ''}`}>
      <div className="pcard__text">
        <div className="pcard__top">
          <span className="pcard__index">{cs.index}</span>
          <span>{cs.sector}</span>
        </div>
        <h3 className="pcard__title">{o.title}</h3>
        <p className="pcard__summary">{cs.summary}</p>
        <div className="pcard__outcome">
          <span className="pcard__value">{cs.outcome.value}</span>
          <span className="pcard__label">{cs.outcome.label}</span>
        </div>
      </div>

      <div className="mock">
        <div className="mock__bar">
          <span className="mock__dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="mock__title">Pipeline Builder — {cs.id}</span>
          <span className="mock__status">
            <i className="live-dot" /> Running
          </span>
        </div>
        <Dag flows={cs.flows} />
        <div className="mock__foot">
          <span>
            <b>{cs.flows.length}</b> {cs.flows.length > 1 ? 'pipelines' : 'pipeline'}
          </span>
          <span>
            <b>{steps}</b> transforms
          </span>
          <span>
            <b>{cs.outcome.value}</b> {cs.id === 'proj-law' ? 'manual effort' : 'dashboards'}
          </span>
          <span className="mock__build">Last build · just now</span>
        </div>
      </div>

      {/* Phones: the same flows as a vertical list (the DAG is too wide to read). */}
      <div className="diagram" style={{ '--lanes': cs.flows.length } as CSSProperties}>
        {cs.flows.map((f, li) => (
          <div key={f.label} className="lane" style={{ '--n': f.steps.length, '--lane': li, '--p': live ? 1 : 0 } as CSSProperties}>
            <span className="lane__label">{f.label}</span>
            <ol>
              {f.steps.map((s, i) => (
                <li key={s} style={{ '--i': i } as CSSProperties}>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A left-to-right pipeline graph: one lane per flow, light running along every edge. */
function Dag({ flows }: { flows: CaseStudy['flows'] }) {
  const W = 1000
  const NODE_W = 178
  const NODE_H = 50
  const LANE_H = 112
  const TOP = 34
  const H = TOP + flows.length * LANE_H - 20
  return (
    <svg className="dag" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pipeline diagram">
      <defs>
        <linearGradient id="dag-edge" x1="0" x2="1">
          <stop offset="0" stopColor="#2459d6" stopOpacity="0.15" />
          <stop offset="1" stopColor="#2459d6" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {flows.map((f, li) => {
        const y = TOP + li * LANE_H
        const gap = (W - 40 - NODE_W) / Math.max(1, f.steps.length - 1)
        const xs = f.steps.map((_, i) => 20 + i * gap)
        return (
          <g key={f.label} className="dag__lane" style={{ '--lane': li } as CSSProperties}>
            <text className="dag__label" x={20} y={y - 12}>
              {f.label.toUpperCase()}
            </text>
            {xs.slice(0, -1).map((x, i) => {
              const x1 = x + NODE_W
              const x2 = xs[i + 1]
              const cy = y + NODE_H / 2
              const d = `M${x1},${cy} C${x1 + 20},${cy} ${x2 - 20},${cy} ${x2},${cy}`
              return (
                <g key={i} style={{ '--i': i } as CSSProperties}>
                  <path className="dag__edge" d={d} />
                  <path className="dag__flow" d={d} pathLength={100} />
                </g>
              )
            })}
            {f.steps.map((s, i) => (
              <g
                key={s}
                className={`dag__node ${i === f.steps.length - 1 ? 'dag__node--out' : ''} ${i === 0 ? 'dag__node--in' : ''}`}
                transform={`translate(${xs[i]} ${y})`}
                style={{ '--i': i } as CSSProperties}
              >
                <rect width={NODE_W} height={NODE_H} rx={10} />
                <rect className="dag__ring" width={NODE_W} height={NODE_H} rx={10} pathLength={100} />
                <text x={14} y={NODE_H / 2 + 5}>
                  {s}
                </text>
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}
