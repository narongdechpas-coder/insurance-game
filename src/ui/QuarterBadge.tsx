import { CalendarDays } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'

/** Current quarter + progress through the game. */
export function QuarterBadge() {
  const { quarter, config } = useGameStore((s) => s.game)
  return (
    <div className="absolute left-7 top-[104px] glass rounded-[18px] pl-3 pr-5 py-2.5 flex items-center gap-3 pointer-events-auto anim-rise">
      <div className="grid place-items-center size-11 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 text-white">
        <CalendarDays size={22} />
      </div>
      <div>
        <div className="text-[12px] text-navy-700/70 leading-none">ปีที่ {quarter.year} · ไตรมาสปัจจุบัน</div>
        <div className="font-display font-bold text-[22px] leading-tight text-navy-900">Q{quarter.q}</div>
      </div>
      <div className="flex gap-1 ml-2">
        {Array.from({ length: config.quarters }).map((_, i) => (
          <span key={i} className={`h-2 rounded-full ${i < quarter.index ? 'w-2 bg-brand-500' : i === quarter.index ? 'w-5 bg-gold-500' : 'w-2 bg-navy-900/15'}`} />
        ))}
      </div>
    </div>
  )
}
