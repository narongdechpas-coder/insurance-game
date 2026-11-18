import { CalendarDays, SkipForward } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { mb, pct } from '../review/format'
import { Stage } from '../Stage'
import { buildTimeline, MONTH_SECONDS, MONTHS, monthAt, RUN_SECONDS } from './timeline'

const MONTH_NAMES = [
  ['ม.ค.', 'ก.พ.', 'มี.ค.'],
  ['เม.ย.', 'พ.ค.', 'มิ.ย.'],
  ['ก.ค.', 'ส.ค.', 'ก.ย.'],
  ['ต.ค.', 'พ.ย.', 'ธ.ค.'],
]

/** HUD while the quarter plays out in the city: month clock, running totals, rival ticker. */
export function RunHud() {
  const game = useGameStore((s) => s.game)
  const start = useGameStore((s) => s.ui.runStart)
  const speed = useGameStore((s) => s.settings.runSpeed || 1)
  const finish = useGameStore((s) => s.finishRun)
  const [t, setT] = useState(0)
  const { toasts, floodFrom } = useMemo(() => buildTimeline(game), [game])
  useEffect(() => {
    const id = setInterval(() => setT(((Date.now() - start) / 1000) * speed), 80)
    return () => clearInterval(id)
  }, [start, speed])
  useEffect(() => {
    if (t >= RUN_SECONDS) finish()
  }, [t, finish])
  const r = game.lastReport
  if (!r) return null
  const k = Math.min(1, t / (MONTHS * MONTH_SECONDS)) // share of the quarter elapsed
  const total = r.pnl.columns.find((c) => c.id === 'total')!
  const month = monthAt(t)
  const names = MONTH_NAMES[r.quarter.q - 1]
  const share = r.before.marketShare + (r.after.marketShare - r.before.marketShare) * k
  const raining = floodFrom !== null && t >= floodFrom && t < RUN_SECONDS - 0.4
  return (
    <>
      {/* soft vignette so the city reads as "live" while the HUD is minimal */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(6,18,46,0.45) 100%)' }} />
      {raining && (
        <>
          <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(30,50,90,0.2)' }} />
          <div data-fx="rain" className="pointer-events-none rain" />
        </>
      )}
      <Stage>
        <div data-screen="running" className="absolute left-1/2 -translate-x-1/2 top-6 w-[760px] glass rounded-[24px] px-6 py-4 pointer-events-auto anim-rise">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-10 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 text-white">
              <CalendarDays size={20} />
            </span>
            <div>
              <div className="text-[12.5px] text-brand-600 font-medium">
                ปีที่ {r.quarter.year} ไตรมาส {r.quarter.q} · ตลาดกำลังเดิน
              </div>
              <div className="font-display font-bold text-[20px] text-navy-900">
                เดือนที่ {month} · {names[month - 1]}
              </div>
            </div>
            <div className="ml-auto flex gap-1.5">
              {names.map((n, i) => (
                <span key={n} className={`h-2 w-14 rounded-full overflow-hidden bg-navy-900/10`}>
                  <span className="block h-full bg-brand-500 transition-[width] duration-100" style={{ width: `${Math.max(0, Math.min(1, (t - i * MONTH_SECONDS) / MONTH_SECONDS)) * 100}%` }} />
                </span>
              ))}
            </div>
            <button onClick={finish} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/85 text-navy-800 text-[14px] hover:bg-white">
              ข้าม <SkipForward size={15} />
            </button>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[760px] glass rounded-[24px] px-6 py-3 grid grid-cols-4 gap-3 pointer-events-auto anim-rise">
          {[
            ['เบี้ยรับสะสม', `${mb(total.writtenPremium * k)} ล้าน`, 'text-navy-900'],
            ['เคลมสะสม', `${mb((total.incurredLoss - r.catLossGross) * k + (raining || t >= RUN_SECONDS - 0.4 ? r.catLossGross : 0))} ล้าน`, raining ? 'text-alert' : 'text-navy-900'],
            ['ส่วนแบ่งตลาด', pct(share), 'text-brand-600'],
            ['ความพอใจ', (r.before.satisfaction + (r.after.satisfaction - r.before.satisfaction) * k).toFixed(2), 'text-navy-900'],
          ].map(([l, v, cls]) => (
            <div key={l}>
              <div className="text-[12px] text-navy-700/65">{l}</div>
              <div className={`font-display font-bold text-[21px] tabular-nums ${cls}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="absolute right-7 top-[120px] w-[340px] flex flex-col gap-2 pointer-events-none">
          {toasts
            .filter((x) => t >= x.at)
            .map((x) => (
              <div key={x.text} data-fx-rival className="glass rounded-2xl px-4 py-2.5 text-[13.5px] text-navy-900 anim-slide-right flex gap-2 items-start">
                <span className="mt-1.5 size-2.5 rounded-full shrink-0" style={{ background: x.color }} />
                {x.text}
              </div>
            ))}
        </div>
      </Stage>
    </>
  )
}
