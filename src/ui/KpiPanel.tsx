import { Coins, Gauge, PieChart, Star } from 'lucide-react'
import { playerRank } from '../game/selectors'
import { useGameStore } from '../store/useGameStore'

/** Four essentials only. Detail lives in the Quarterly Review. */
export function KpiPanel() {
  const game = useGameStore((s) => s.game)
  const { kpis } = game
  const rank = playerRank(game)
  const cr = kpis.combinedRatio
  const items = [
    { icon: Coins, label: 'เงินทุน', value: kpis.capitalMB.toLocaleString('th-TH'), unit: 'ล้านบาท', tone: 'from-gold-300 to-gold-500 text-navy-900' },
    { icon: PieChart, label: 'ส่วนแบ่งตลาด', value: `${Math.round(kpis.marketShare * 100)}%`, unit: `อันดับ ${rank}/5`, tone: 'from-brand-400 to-brand-600 text-white' },
    { icon: Gauge, label: 'Combined Ratio', value: `${Math.round(cr * 100)}%`, unit: cr < 1 ? 'มีกำไรจากรับประกัน' : 'ขาดทุนจากรับประกัน', tone: cr < 1 ? 'from-emerald-300 to-good text-white' : 'from-red-300 to-alert text-white' },
    { icon: Star, label: 'ความพึงพอใจ', value: kpis.satisfaction.toFixed(1), unit: 'จาก 5 ดาว', tone: 'from-pink-300 to-rose-500 text-white' },
  ]
  return (
    <aside className="absolute right-7 top-[104px] w-[214px] glass rounded-[var(--radius-card)] p-3 flex flex-col gap-1.5 pointer-events-auto anim-rise" style={{ animationDelay: '0.1s' }}>
      {items.map(({ icon: Icon, label, value, unit, tone }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-brand-50 transition-colors">
          <div className={`grid place-items-center size-10 rounded-xl bg-gradient-to-b ${tone} shadow-sm`}>
            <Icon size={20} strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-navy-700/70 leading-none">{label}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-[21px] text-navy-900 leading-tight">{value}</span>
            </div>
            <div className="text-[11px] text-navy-700/60 leading-none truncate">{unit}</div>
          </div>
        </div>
      ))}
      <div className="text-[10px] text-navy-700/45 text-center pt-0.5">ตัวเลขจำลองสำหรับต้นแบบ</div>
    </aside>
  )
}
