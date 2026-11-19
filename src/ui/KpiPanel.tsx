import { Coins, Gauge, PieChart, Star } from 'lucide-react'
import { capitalHealth } from '../game/capital'
import { playerRank } from '../game/selectors'
import { useGameStore } from '../store/useGameStore'
import { Glossed } from './glossary/Term'

/** Four essentials only. Detail lives in the Quarterly Review. */
export function KpiPanel() {
  const game = useGameStore((s) => s.game)
  const { kpis } = game
  const rank = playerRank(game)
  const cr = kpis.combinedRatio
  const health = capitalHealth(game)
  const items = [
    {
      icon: Coins,
      label: 'เงินทุน',
      value: kpis.capitalMB.toLocaleString('th-TH'),
      unit: health.level === 'safe' ? 'ล้านบาท' : `ล้านบาท · ห่างเส้น ${Math.round(health.buffer).toLocaleString('th-TH')}`,
      tone: health.level === 'danger' ? 'from-red-300 to-alert text-white' : 'from-gold-300 to-gold-500 text-navy-900',
    },
    { icon: PieChart, label: 'ส่วนแบ่งตลาด', value: `${Math.round(kpis.marketShare * 100)}%`, unit: `อันดับ ${rank}/5`, tone: 'from-brand-400 to-brand-600 text-white' },
    { icon: Gauge, label: 'Combined Ratio', value: `${Math.round(cr * 100)}%`, unit: cr < 1 ? 'มีกำไรจากรับประกัน' : 'ขาดทุนจากรับประกัน', tone: cr < 1 ? 'from-emerald-300 to-good text-white' : 'from-red-300 to-alert text-white' },
    { icon: Star, label: 'ความพึงพอใจ', value: kpis.satisfaction.toFixed(1), unit: 'จาก 5 ดาว', tone: 'from-pink-300 to-rose-500 text-white' },
  ]
  return (
    <aside className="absolute right-7 top-[104px] w-[214px] glass rounded-[var(--radius-card)] p-3 flex flex-col gap-1.5 pointer-events-auto anim-rise" style={{ animationDelay: '0.1s' }}>
      {items.map(({ icon: Icon, label, value, unit, tone }, i) => (
        <div
          key={label}
          data-capital={i === 0 ? health.level : undefined}
          className={`relative flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors ${i === 0 && health.level === 'danger' ? 'bg-alert/10' : i === 0 && health.level === 'watch' ? 'bg-watch/10' : 'hover:bg-brand-50'}`}
        >
          <div className={`grid place-items-center size-10 rounded-xl bg-gradient-to-b ${tone} shadow-sm ${i === 0 && health.level === 'danger' ? 'pulse-alert' : ''}`}>
            <Icon size={20} strokeWidth={2.3} />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-navy-700/70 leading-none"><Glossed text={label} /></div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-[21px] text-navy-900 leading-tight">{value}</span>
            </div>
            <div className={`text-[11px] leading-none truncate ${i === 0 && health.level !== 'safe' ? 'font-medium ' + (health.level === 'danger' ? 'text-red-700' : 'text-amber-700') : 'text-navy-700/60'}`}>{unit}</div>
            {i === 0 && health.level !== 'safe' && (
              // room left before the stop line: full bar at the starting capital, empty at the line
              <div className="mt-1 h-1.5 w-[120px] rounded-full bg-navy-900/10 overflow-hidden" title="ระยะห่างจากเส้นหยุดรับประกัน (ครึ่งหนึ่งของทุนเริ่มต้น)">
                <div className={`h-full rounded-full ${health.level === 'danger' ? 'bg-alert' : 'bg-watch'}`} style={{ width: `${health.room * 100}%` }} />
              </div>
            )}
          </div>
        </div>
      ))}
      {/* company-level stocks (engine v2): slow-moving, act on every channel */}
      <div className="mt-0.5 px-2 pt-2 border-t border-brand-100 space-y-1.5" data-company>
        {[
          { label: 'Brand Awareness', v: game.sim.v2.company.brand, d: game.lastReport?.v2.brandDelta ?? 0, color: 'bg-brand-500' },
          { label: 'Service Quality', v: game.sim.v2.company.service, d: game.lastReport?.v2.serviceDelta ?? 0, color: 'bg-good' },
        ].map((x) => (
          <div key={x.label} data-company-stock={x.label} className="text-[11.5px] text-navy-800">
            <div className="flex justify-between">
              <span>
                <Glossed text={x.label} />
              </span>
              <span className="tabular-nums font-medium">
                {Math.round(x.v)}
                {Math.abs(x.d) >= 0.5 && <span className={x.d > 0 ? 'text-emerald-700' : 'text-red-700'}> {x.d > 0 ? '▲' : '▼'}{Math.abs(x.d).toFixed(0)}</span>}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-navy-900/10 overflow-hidden">
              <div className={`h-full rounded-full ${x.color}`} style={{ width: `${x.v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-navy-700/45 text-center pt-0.5">ตัวเลขจำลองสำหรับต้นแบบ</div>
    </aside>
  )
}
