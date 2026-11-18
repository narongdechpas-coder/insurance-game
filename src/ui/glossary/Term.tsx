import { X } from 'lucide-react'
import { Fragment, useEffect } from 'react'
import { GLOSSARY_BY_ID, splitTerms } from '../../game/glossary'
import { useGameStore } from '../../store/useGameStore'

/**
 * The small "?" next to a jargon term. It is a span (not a button) so it can sit inside
 * clickable cards; the click is stopped so it never selects the card underneath.
 */
export function TermDot({ id, tone = 'light' }: { id: string; tone?: 'light' | 'dark' }) {
  const showTerm = useGameStore((s) => s.showTerm)
  const open = (e: React.SyntheticEvent<HTMLElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900)
    showTerm({ id, x: (r.left + r.width / 2) / scale, y: r.bottom / scale })
  }
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`ความหมายของ ${GLOSSARY_BY_ID[id]?.term ?? id}`}
      data-term={id}
      onClick={open}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(e)}
      className={`inline-grid place-items-center align-[0.15em] ml-1 size-[15px] rounded-full text-[10px] font-bold leading-none cursor-help select-none transition-colors ${
        tone === 'dark' ? 'bg-white/25 text-white hover:bg-white/45' : 'bg-brand-100 text-brand-600 hover:bg-brand-500 hover:text-white'
      }`}
    >
      ?
    </span>
  )
}

/** Text with a "?" after the first mention of every glossary term in it. */
export function Glossed({ text, skip, tone }: { text: string; skip?: string[]; tone?: 'light' | 'dark' }) {
  return (
    <>
      {splitTerms(text, skip).map((p, i) =>
        'id' in p ? (
          <Fragment key={i}>
            <span className="whitespace-nowrap">
              {p.text}
              <TermDot id={p.id} tone={tone} />
            </span>
          </Fragment>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  )
}

const W = 340

/** The explanation card. Lives in the overlay stage; any click outside closes it. */
export function TermPopover() {
  const term = useGameStore((s) => s.ui.term)
  const close = useGameStore((s) => s.showTerm)
  useEffect(() => {
    if (!term) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [term, close])
  if (!term) return null
  const g = GLOSSARY_BY_ID[term.id]
  if (!g) return null
  const stageW = window.innerWidth / Math.min(window.innerWidth / 1600, window.innerHeight / 900)
  const stageH = window.innerHeight / Math.min(window.innerWidth / 1600, window.innerHeight / 900)
  const left = Math.max(12, Math.min(stageW - W - 12, term.x - W / 2))
  const above = term.y > stageH * 0.62 // near the bottom: open upwards
  return (
    <div className="absolute inset-0 pointer-events-auto" onClick={() => close(null)} data-popover-backdrop>
      <div
        role="dialog"
        aria-label={g.term}
        data-popover={g.id}
        onClick={(e) => e.stopPropagation()}
        className="absolute glass rounded-[20px] px-5 pt-4 pb-4 anim-rise"
        style={{ left, width: W, ...(above ? { bottom: stageH - term.y + 26 } : { top: term.y + 8 }) }}
      >
        <button onClick={() => close(null)} aria-label="ปิดคำอธิบาย" className="absolute top-3 right-3 grid place-items-center size-7 rounded-full bg-navy-900/5 text-navy-700 hover:bg-navy-900/10">
          <X size={15} />
        </button>
        <div className="font-display font-bold text-[18px] text-navy-900 pr-8 leading-tight">{g.term}</div>
        <div className="text-[13px] text-brand-600 font-medium">{g.th}</div>
        <p className="mt-2 text-[14px] leading-relaxed text-navy-800">{g.body}</p>
        {g.game && (
          <p className="mt-2 rounded-xl bg-gold-300/30 px-3 py-2 text-[12.5px] leading-relaxed text-navy-900">
            <span className="font-semibold">ในเกม:</span> {g.game}
          </p>
        )}
      </div>
    </div>
  )
}
