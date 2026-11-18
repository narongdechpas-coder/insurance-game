import { useEffect, useMemo, useState } from 'react'
import { SPRITES } from '../../assets/registry'
import { useGameStore } from '../../store/useGameStore'
import { anchorOf, BUILDINGS } from '../../world/layout'
import { project } from '../../world/projection'
import { buildTimeline, RUN_SECONDS } from './timeline'

const TONE = {
  money: 'bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900',
  claim: 'bg-white text-navy-900 ring-1 ring-navy-900/10',
  alert: 'bg-alert text-white',
  good: 'bg-good text-white',
}

/** Floating chips over the buildings while the quarter plays out (lives inside the world transform). */
export function WorldFx() {
  const game = useGameStore((s) => s.game)
  const start = useGameStore((s) => s.ui.runStart)
  const [t, setT] = useState(0)
  const { chips } = useMemo(() => buildTimeline(game), [game])
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setT((Date.now() - start) / 1000)
      if ((Date.now() - start) / 1000 < RUN_SECONDS + 2) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start])
  const live = chips.map((c, i) => ({ ...c, i })).filter((c) => t >= c.at && t < c.at + 1.7)
  // stack chips that share a building at the same moment
  const seen: Record<string, number> = {}
  return (
    <>
      {live.map((c) => {
        const b = BUILDINGS[c.location]
        const m = SPRITES[b.sprite]
        const p = project(b.u, b.v)
        const [ax, ay] = anchorOf(b)
        const k = (seen[c.location] = (seen[c.location] ?? -1) + 1)
        return (
          <div
            key={c.i}
            className="absolute"
            style={{
              left: p.x - m.w * b.scale * ax + m.w * b.scale * 0.5,
              top: p.y - m.h * b.scale * ay,
              zIndex: 7000,
              // same counter-scale as the building labels, so chips stay readable at any zoom
              transform: 'scale(var(--inv-scale, 1))',
              transformOrigin: '0 0',
            }}
          >
            <div
              data-fx-chip={c.tone}
              className={`chip-up absolute whitespace-nowrap rounded-full px-5 py-2 font-display font-bold text-[30px] shadow-[0_8px_18px_-6px_rgba(8,26,66,0.55)] ${TONE[c.tone]}`}
              style={{ top: -96 - k * 62, animationDelay: '0s' }}
            >
              {c.text}
            </div>
          </div>
        )
      })}
    </>
  )
}
