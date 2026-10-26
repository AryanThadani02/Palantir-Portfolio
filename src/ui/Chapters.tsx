import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { EXPERIENCE, STATS, WORK } from '../data/content'
import { OBJECT_BY_ID, frame, linkedGroups } from '../data/graph'
import { beat, runProgress } from '../lib/runs'
import { scrollToTarget } from '../lib/scroll'
import { nodeHalf, pipelineLayout } from '../scene/layouts'
import { SectionHead } from './common'
import { IconMark, LogoTile } from './Logo'

const isDark = (logo: string) => /vanyar|lachoo/.test(logo)
const narrowNow = () => innerWidth / innerHeight < 0.85

function useNarrow() {
  const [narrow, setNarrow] = useState(narrowNow)
  useEffect(() => {
    const on = () => setNarrow(narrowNow())
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  return narrow
}

/**
 * Drives a pinned run every frame: writes `--p` (progress) on the run, and for `n` beats crossfades every
 * `[data-beat=k]` layer (opacity, a small rise) and scrubs any `[data-count]` number inside it.
 */
function usePinnedRun(ref: RefObject<HTMLElement | null>, n = 1, hold = 0.55, onBeat?: (b: number, p: number) => void) {
  useEffect(() => {
    let id = 0
    const tick = () => {
      const el = ref.current
      if (el) {
        const p = runProgress(el)
        const b = beat(p, n, hold)
        el.style.setProperty('--p', p.toFixed(4))
        el.style.setProperty('--b', b.toFixed(4))
        el.querySelectorAll<HTMLElement>('[data-beat]').forEach((layer) => {
          const k = Number(layer.dataset.beat)
          const d = b - k
          const o = Math.max(0, 1 - Math.abs(d) * 2.4)
          layer.style.opacity = o.toFixed(3)
          layer.style.transform = `translate3d(0, ${(-d * 40).toFixed(1)}px, 0)`
          layer.style.visibility = o > 0.001 ? 'visible' : 'hidden'
          layer.classList.toggle('is-current', o > 0.5)
          layer.querySelectorAll<HTMLElement>('[data-count]').forEach((c) => {
            const e = 1 - Math.pow(1 - Math.min(1, o * 1.15), 3)
            c.textContent = c.dataset.count!.replace(/\d+/g, (dd) => String(Math.round(Number(dd) * e)))
          })
        })
        onBeat?.(b, p)
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [ref, n, hold, onBeat])
}

/** The opening card of a chapter: a big index + title that masks away as the run begins. */
function ChapterMark({ index, title }: { index: string; title: string }) {
  return (
    <div className="chapter-mark" aria-hidden>
      <span className="chapter-mark__index">{index}</span>
      <span className="chapter-mark__title">{title}</span>
    </div>
  )
}

// ---------- 01 About: the manifesto ----------

type Token = string | { chip: string; icon: string; tone: 'ink' | 'blue' | 'line' }

const MANIFESTO: Token[] = [
  'I', 'turn', 'messy', 'operational', 'data', { chip: 'raw.csv', icon: 'document', tone: 'line' },
  'into', 'ontologies', { chip: 'Ontology', icon: 'graph', tone: 'blue' },
  'people', 'can', 'act', 'on', '—', 'pipelines', { chip: 'Pipelines', icon: 'data-lineage', tone: 'ink' }, 'in,',
  'governed', 'Workshop,', 'OSDK', 'and', 'AIP', 'applications', { chip: 'Apps', icon: 'application', tone: 'blue' }, 'out.',
]

export function About() {
  const run = useRef<HTMLDivElement>(null)
  usePinnedRun(run)
  return (
    <section id="about" className="about" data-theme="light">
      <div ref={run} className="about__run" data-film-run="6" style={{ '--n': MANIFESTO.length } as CSSProperties}>
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
    </section>
  )
}

// ---------- 01b The numbers ----------

const STAT_KICKERS = ['Reporting efficiency', 'Manual effort removed', 'Palantir certified', 'On Foundry']

export function Numbers() {
  const run = useRef<HTMLElement>(null)
  usePinnedRun(run, STATS.length)
  return (
    <section ref={run} id="numbers" className="run numbers" data-theme="light" data-shape="3" data-film-run="9">
      <div className="run__sticky">
        <div className="run__copy">
          {STATS.map((s, k) => (
            <div key={s.label} className="beat" data-beat={k}>
              <span className="beat__kicker">
                ({String(k + 1).padStart(2, '0')}) {STAT_KICKERS[k]}
              </span>
              <span className="numbers__value" data-count={s.value}>
                {s.value}
              </span>
              <p className="numbers__label">{s.label}</p>
            </div>
          ))}
        </div>
        <RunTicks count={STATS.length} />
      </div>
    </section>
  )
}

/** A thin progress line with one tick per beat, filled by the run's --p. */
function RunTicks({ count, labels, onPick }: { count: number; labels?: string[]; onPick?: (k: number) => void }) {
  return (
    <div className="ticks" style={{ '--n': count } as CSSProperties}>
      <span className="ticks__fill" />
      {Array.from({ length: count }, (_, k) => (
        <button
          key={k}
          className="ticks__tick"
          style={{ '--k': k } as CSSProperties}
          onClick={() => onPick?.(k)}
          tabIndex={onPick ? 0 : -1}
          aria-label={labels?.[k] ?? `Step ${k + 1}`}
        >
          {labels && <span className="ticks__label">{labels[k]}</span>}
        </button>
      ))}
    </div>
  )
}

// ---------- 02 Experience: one role per beat, the dots become each logo ----------

export function ExperienceSection() {
  const run = useRef<HTMLElement>(null)
  usePinnedRun(run, EXPERIENCE.length)
  const pick = (k: number) => {
    const el = run.current!
    scrollToTarget(el.offsetTop + (k / (EXPERIENCE.length - 1)) * (el.offsetHeight - innerHeight), { duration: 1.6 })
  }

  return (
    <section ref={run} id="experience" className="run run--marked xp" data-theme="dark" data-shape="4" data-film-run="16">
      <div className="run__sticky">
        <ChapterMark index="02" title="Experience" />
        <div className="run__copy">
          {EXPERIENCE.map((e, k) => {
            const o = OBJECT_BY_ID.get(e.id)!
            const period = o.properties?.find((p) => p.label === 'Period')?.value ?? ''
            const facts = o.properties?.filter((p) => p.label !== 'Period') ?? []
            const skills = linkedGroups(e.id).flatMap(([, objs]) => objs.filter((x) => x.type === 'skill'))
            return (
              <article key={e.id} className="beat xbeat" data-beat={k}>
                <span className="xbeat__year" aria-hidden>
                  {e.year}
                </span>
                <span className="beat__kicker">
                  ({String(k + 1).padStart(2, '0')} / {String(EXPERIENCE.length).padStart(2, '0')}) {period}
                </span>
                <p className="xbeat__org">
                  <LogoTile src={e.logo} icon="learning" dark={isDark(e.logo)} />
                  {o.subtitle}
                </p>
                <h3 className="xbeat__title">{o.title}</h3>
                {facts.length > 0 && (
                  <dl className="xbeat__facts">
                    {facts.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {o.highlights && (
                  <ul className="xbeat__points">
                    {o.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                )}
                {skills.length > 0 && (
                  <ul className="tags">
                    {skills.slice(0, 8).map((s) => (
                      <li key={s.id}>{s.title}</li>
                    ))}
                  </ul>
                )}
              </article>
            )
          })}
        </div>
        <RunTicks count={EXPERIENCE.length} labels={EXPERIENCE.map((e) => e.year)} onPick={pick} />
      </div>
    </section>
  )
}

// ---------- 03 Work: the dots become each project's pipeline ----------

export function Work() {
  const run = useRef<HTMLElement>(null)
  const labels = useRef<HTMLDivElement>(null)
  const narrow = useNarrow()
  // Light each step label as the wave reaches it (the same `frame.lit*` the dots use).
  const onBeat = useRef(() => {
    labels.current?.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => {
      const lit = el.dataset.project === '0' ? frame.lit0 : frame.lit1
      el.classList.toggle('is-lit', lit > Number(el.dataset.step) + 0.15)
    })
  }).current
  usePinnedRun(run, WORK.length, 0.7, onBeat)
  const half = nodeHalf(narrow)

  return (
    <section ref={run} id="work" className="run run--marked work" data-theme="light" data-shape="5" data-film-run="14">
      <div className="run__sticky">
        <ChapterMark index="03" title="Selected work" />
        <div className="run__copy">
          {WORK.map((cs, k) => {
            const o = OBJECT_BY_ID.get(cs.id)!
            return (
              <article key={cs.id} className="beat wbeat" data-beat={k}>
                <span className="beat__kicker">
                  ({cs.index}) {cs.sector}
                </span>
                <h3 className="wbeat__title">{o.title}</h3>
                <p className="wbeat__summary">{cs.summary}</p>
                <div className="wbeat__outcome">
                  <span className="wbeat__value">{cs.outcome.value}</span>
                  <span className="wbeat__label">{cs.outcome.label}</span>
                </div>
              </article>
            )
          })}
        </div>

        {/* Step labels sit exactly on the particle boxes (shared layout in scene/layouts.ts). */}
        <div ref={labels} className="pipe-labels" aria-hidden>
          {WORK.map((cs, p) => {
            const nodes = pipelineLayout(cs, narrow)
            return (
              <div key={cs.id} className="pipe-labels__set" data-beat={p}>
                {cs.flows.map((f, lane) => {
                  const first = nodes.find((nd) => nd.lane === lane && nd.first)!
                  return (
                    <span
                      key={f.label}
                      className="pipe-lane"
                      style={{
                        left: `${((first.x - half.x + 1) / 2) * 100}%`,
                        top: `${((1 - (first.y + half.y)) / 2) * 100}%`,
                      }}
                    >
                      {f.label}
                    </span>
                  )
                })}
                {nodes.map((nd) => (
                  <span
                    key={`${nd.lane}-${nd.step}`}
                    className={`pipe-node ${nd.last ? 'pipe-node--out' : ''}`}
                    data-project={p}
                    data-step={nd.step}
                    style={{
                      left: `${((nd.x + 1) / 2) * 100}%`,
                      top: `${((1 - nd.y) / 2) * 100}%`,
                      width: `${half.x * 100}%`,
                      height: `${half.y * 100}%`,
                    }}
                  >
                    {nd.label}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
        <RunTicks count={WORK.length} />
      </div>
    </section>
  )
}
