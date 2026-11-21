import { ChevronLeft, ChevronRight, Maximize, NotebookText, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { brandUrl } from '../../assets/registry'
import { SLIDES } from './slides'

/**
 * Game introduction deck for a facilitator in a training room (open at /intro or from the cover).
 * 1600×900 slides scaled to fit with letterboxing. ← → / space / click to move, F full screen,
 * N speaker notes, Esc back to the game.
 */
export function IntroDeck() {
  const [i, setI] = useState(() => {
    const n = Number(new URLSearchParams(window.location.search).get('s'))
    return Number.isFinite(n) && n >= 1 && n <= SLIDES.length ? n - 1 : 0
  })
  const [notes, setNotes] = useState(false)
  const [scale, setScale] = useState(1)
  const go = useCallback((d: number) => setI((x) => Math.min(SLIDES.length - 1, Math.max(0, x + d))), [])
  const exit = () => window.location.assign(import.meta.env.BASE_URL)

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1600, (window.innerHeight - (notes ? 190 : 0)) / 900))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [notes])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) go(1)
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) go(-1)
      else if (e.key === 'Home') setI(0)
      else if (e.key === 'End') setI(SLIDES.length - 1)
      else if (e.key === 'f' || e.key === 'F') toggleFull()
      else if (e.key === 'n' || e.key === 'N') setNotes((v) => !v)
      else if (e.key === 'Escape' && !document.fullscreenElement) exit()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  // keep the slide number in the address bar, so a facilitator can reopen where they were
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('s', String(i + 1))
    window.history.replaceState(null, '', url)
  }, [i])

  const s = SLIDES[i]
  return (
    <div data-intro className="fixed inset-0 bg-[#06102a] text-navy-900 select-none overflow-hidden">
      <div className="absolute left-0 right-0 top-0 grid place-items-center" style={{ bottom: notes ? 190 : 0 }}>
        <div
          data-slide={i + 1}
          className="relative w-[1600px] h-[900px] shrink-0 overflow-hidden rounded-[6px] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => (e.clientX > window.innerWidth / 3 ? go(1) : go(-1))}
        >
          <div key={i} className="absolute inset-0 anim-fade-slide">{s.body}</div>
          <div className="absolute right-7 bottom-5 flex items-center gap-2.5 rounded-full bg-navy-900/75 pl-1.5 pr-4 py-1 text-[15px] font-medium text-white tabular-nums pointer-events-none">
            <img src={brandUrl('logo.webp')} alt="" className="h-8" />
            {i + 1} / {SLIDES.length}
          </div>
        </div>
      </div>

      {/* controls: shown on hover at the bottom, never inside the slide */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur px-2 py-1.5 text-white opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity" style={{ bottom: (notes ? 190 : 0) + 14 }}>
        <Ctl label="ก่อนหน้า (←)" onClick={() => go(-1)}><ChevronLeft size={18} /></Ctl>
        <span className="text-[13px] tabular-nums px-1">{i + 1}/{SLIDES.length}</span>
        <Ctl label="ถัดไป (→)" onClick={() => go(1)}><ChevronRight size={18} /></Ctl>
        <Ctl label="Speaker notes (N)" onClick={() => setNotes((v) => !v)} on={notes}><NotebookText size={17} /></Ctl>
        <Ctl label="เต็มจอ (F)" onClick={toggleFull}><Maximize size={16} /></Ctl>
        <Ctl label="กลับเกม (Esc)" onClick={exit}><X size={17} /></Ctl>
      </div>

      {notes && (
        <aside data-notes className="absolute left-0 right-0 bottom-0 h-[190px] bg-[#0c1838] border-t border-white/10 text-white/90 px-8 py-4 overflow-y-auto">
          <div className="text-[12px] text-white/50 mb-1">Speaker notes · สไลด์ {i + 1}</div>
          <div className="text-[16px] leading-relaxed whitespace-pre-line">{s.notes}</div>
        </aside>
      )}
    </div>
  )
}

function Ctl({ label, onClick, on, children }: { label: string; onClick: () => void; on?: boolean; children: ReactNode }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={`grid place-items-center size-9 rounded-full hover:bg-white/15 ${on ? 'bg-white/20' : ''}`}>
      {children}
    </button>
  )
}

function toggleFull() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen?.().catch(() => {})
}
