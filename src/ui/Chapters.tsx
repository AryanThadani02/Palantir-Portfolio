import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { ABOUT_WORDS, EXPERIENCE, WORK, WORK_STEPS } from '../data/content'
import { OBJECT_BY_ID, linkedGroups } from '../data/graph'
import { beat, runProgress } from '../lib/runs'
import { scrollToTarget } from '../lib/scroll'
import { SectionHead } from './common'
import { LogoTile } from './Logo'

const isDark = (logo: string) => /vanyar|lachoo/.test(logo)

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

// ---------- 01 About: a title sequence — the particles write one giant word per beat ----------

export function About() {
  const run = useRef<HTMLDivElement>(null)
  usePinnedRun(run, ABOUT_WORDS.length)
  return (
    <section id="about" className="about" data-theme="light">
      <div ref={run} className="about__run" data-film-run="12">
        <div className="about__sticky">
          <SectionHead index="01" label="About" aside="Manifesto" />
          {/* The word itself is drawn by the particles; screen readers get it here. */}
          <div className="about__lines">
            {ABOUT_WORDS.map((a, k) => (
              <p key={a.word} className="beat about__line" data-beat={k}>
                <span className="beat__kicker">
                  ({String(k + 1).padStart(2, '0')} / {String(ABOUT_WORDS.length).padStart(2, '0')}) <span className="sr-only">{a.word} — </span>
                </span>
                {a.line}
              </p>
            ))}
          </div>
          <RunTicks count={ABOUT_WORDS.length} />
        </div>
      </div>
    </section>
  )
}

/**
 * A thin progress line filled by the run's --p, with one tick per beat — or, with `at`, ticks at those
 * fractions of the run (e.g. where each project starts).
 */
function RunTicks({ count, labels, at, onPick }: { count: number; labels?: string[]; at?: number[]; onPick?: (k: number) => void }) {
  return (
    <div className="ticks" style={{ '--n': count } as CSSProperties}>
      <span className="ticks__fill" />
      {Array.from({ length: count }, (_, k) => (
        <button
          key={k}
          className="ticks__tick"
          style={{ '--k': k, ...(at && { left: `${at[k] * 100}%` }) } as CSSProperties}
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
    <section ref={run} id="experience" className="run run--marked xp" data-theme="dark" data-shape="3" data-film-run="16">
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

// ---------- 03 Work: one big pictogram per pipeline step, morphing step to step ----------

/** Where each project's steps start in WORK_STEPS. */
const PROJECT_START = WORK.map((_, p) => WORK_STEPS.findIndex((st) => st.project === p))

export function Work() {
  const run = useRef<HTMLElement>(null)
  // Project copy holds for all of that project's steps (the step layers crossfade per step via data-beat).
  const onBeat = useRef((b: number) => {
    run.current?.querySelectorAll<HTMLElement>('[data-proj]').forEach((layer) => {
      const p = Number(layer.dataset.proj)
      const start = PROJECT_START[p]
      const end = start + WORK[p].steps.length - 1
      const o = Math.max(0, Math.min(1, 1 - Math.max(0, start - b, b - end) * 2.4))
      layer.style.opacity = o.toFixed(3)
      layer.style.transform = `translate3d(0, ${((b < start ? start - b : b > end ? end - b : 0) * 40).toFixed(1)}px, 0)`
      layer.style.visibility = o > 0.001 ? 'visible' : 'hidden'
    })
  }).current
  usePinnedRun(run, WORK_STEPS.length, 0.55, onBeat)
  const pick = (p: number) => {
    const el = run.current!
    scrollToTarget(el.offsetTop + (PROJECT_START[p] / (WORK_STEPS.length - 1)) * (el.offsetHeight - innerHeight), { duration: 1.6 })
  }

  return (
    <section
      ref={run}
      id="work"
      className="run run--marked work"
      data-theme="light"
      data-shape="4"
      data-film-run="30"
      style={{ '--n': WORK_STEPS.length } as CSSProperties}
    >
      <div className="run__sticky">
        <ChapterMark index="03" title="Selected work" />
        <div className="run__copy">
          {WORK.map((cs, p) => {
            const o = OBJECT_BY_ID.get(cs.id)!
            return (
              <article key={cs.id} className="beat wbeat" data-proj={p}>
                <span className="beat__kicker">
                  ({cs.index}) {cs.sector}
                </span>
                <h3 className="wbeat__title">{o.title}</h3>
                <p className="wbeat__summary">{cs.summary}</p>
                <div className="wbeat__outcome">
                  <span className="wbeat__value">{cs.highlight.value}</span>
                  <span className="wbeat__label">{cs.highlight.label}</span>
                </div>
                {cs.also && <p className="wbeat__also">Also: {cs.also.join(' · ')}</p>}
              </article>
            )
          })}
        </div>

        {/* The pictogram above is drawn by the particles (scene/layouts.ts stepRegion); its step name sits below. */}
        <div className="wsteps" aria-hidden>
          {WORK_STEPS.map((st, k) => (
            <div key={k} className="beat wstep" data-beat={k}>
              <span className="wstep__count">
                Step {String(st.step + 1).padStart(2, '0')} / {String(st.count).padStart(2, '0')}
              </span>
              <span className="wstep__name">{st.label}</span>
            </div>
          ))}
        </div>
        <RunTicks
          count={WORK.length}
          labels={WORK.map((cs) => cs.index)}
          at={PROJECT_START.map((k) => k / (WORK_STEPS.length - 1))}
          onPick={pick}
        />
      </div>
    </section>
  )
}
