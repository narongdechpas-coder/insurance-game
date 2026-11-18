import { RIVAL_ART, spriteUrl } from '../../assets/registry'
import { outlook, STYLE } from '../../game/narrative/rivals'
import { useGameStore } from '../../store/useGameStore'
import { mb, pct } from '../review/format'
import { PageShell } from './PageShell'

const THREAT = {
  high: { label: 'คุกคามสูง', cls: 'bg-alert/12 text-red-700' },
  mid: { label: 'ต้องจับตา', cls: 'bg-watch/15 text-amber-700' },
  low: { label: 'คุกคามต่ำ', cls: 'bg-good/12 text-emerald-700' },
}

/** Market-share history of every company: one line each. */
function ShareChart({ series }: { series: { id: string; name: string; color: string; values: number[]; me: boolean }[] }) {
  const W = 620
  const H = 230
  const n = Math.max(2, ...series.map((s) => s.values.length))
  const all = series.flatMap((s) => s.values)
  const lo = Math.max(0, Math.min(...all) - 0.02)
  const hi = Math.max(...all) + 0.02
  const x = (i: number) => 40 + (i / (n - 1)) * (W - 150)
  const y = (v: number) => 12 + (1 - (v - lo) / (hi - lo)) * (H - 40)
  const ticks = [lo, (lo + hi) / 2, hi]
  // end labels: keep at least 15px apart so close lines stay readable
  const labelY: Record<string, number> = {}
  const ends = series.map((s) => ({ id: s.id, y: y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y)
  ends.forEach((e, i) => (labelY[e.id] = i ? Math.max(e.y, labelY[ends[i - 1].id] + 15) : e.y))
  return (
    <svg width={W} height={H} data-chart="share" className="block">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={40} x2={W - 110} y1={y(t)} y2={y(t)} stroke="#0b1f4b" strokeOpacity={0.08} />
          <text x={34} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#0b1f4b" fillOpacity={0.5}>
            {pct(t, 0)}
          </text>
        </g>
      ))}
      {Array.from({ length: n }).map((_, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="#0b1f4b" fillOpacity={0.5}>
          {i === 0 ? 'เริ่ม' : `Q${i}`}
        </text>
      ))}
      {series.map((s) => {
        const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
        const last = s.values.length - 1
        return (
          <g key={s.id}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={s.me ? 3.5 : 2} strokeLinejoin="round" strokeLinecap="round" opacity={s.me ? 1 : 0.85} />
            <circle cx={x(last)} cy={y(s.values[last])} r={s.me ? 4.5 : 3.5} fill={s.color} />
            <text x={x(last) + 9} y={labelY[s.id] + 4} fontSize={12} fontWeight={s.me ? 700 : 500} fill={s.color}>
              {s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Market page: who holds the market, how it moved, and what each rival is likely to do next. */
export function MarketPage() {
  const game = useGameStore((s) => s.game)
  const hist = game.sim.shareHistory ?? []
  const series = [
    { id: 'player', name: game.config.companyName, color: '#2f7bff', me: true },
    ...game.competitors.map((c) => ({ id: c.id, name: c.name, color: c.color, me: false })),
  ].map((s) => ({ ...s, values: hist.map((h) => h[s.id] ?? 0) }))
  const lastMoves = Object.fromEntries((game.lastReport?.rivals ?? []).map((r) => [r.id, r.move]))
  return (
    <PageShell id="market" kicker={`ข้อมูลตลาด · ปีที่ ${game.quarter.year} ไตรมาส ${game.quarter.q}`} title="ตลาดและคู่แข่ง">
      <div className="grid grid-cols-[660px_1fr] gap-4">
        <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
          <div className="font-display font-semibold text-[16px] text-navy-900">ส่วนแบ่งตลาดตามไตรมาส</div>
          <ShareChart series={series} />
        </div>
        <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
          <div className="font-display font-semibold text-[16px] text-navy-900 mb-2">ภาพรวมตลาด</div>
          <div className="grid grid-cols-2 gap-2 text-[14px]">
            <div className="rounded-xl bg-navy-900/[0.035] px-3 py-2">
              <div className="text-[12px] text-navy-700/65">ขนาดตลาดในเกม (ต่อไตรมาส)</div>
              <div className="font-semibold text-[18px] text-navy-900">{mb(game.sim.marketGwp)} ล้านบาท</div>
            </div>
            <div className="rounded-xl bg-navy-900/[0.035] px-3 py-2">
              <div className="text-[12px] text-navy-700/65">ส่วนแบ่งของเรา</div>
              <div className="font-semibold text-[18px] text-brand-600">{pct(game.kpis.marketShare)}</div>
            </div>
          </div>
          <div className="mt-3 text-[13px] text-navy-700/80 font-medium">เหตุการณ์ที่กำลังจะมาไตรมาสนี้</div>
          <ul className="mt-1 space-y-1 text-[13.5px] text-navy-900">
            {game.events.map((e) => (
              <li key={e.id}>• {e.title}</li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-navy-700/55">ตัวเลขทั้งหมดเป็นผลจำลองของเกม · คาดการณ์ท่าทีคู่แข่งดูจากสไตล์และผลประกอบการล่าสุด ไม่ใช่สิ่งที่เกิดแน่นอน</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-4">
        {game.competitors.map((c, i) => {
          const f = game.sim.firms[i]
          const o = outlook(game, c.id)
          return (
            <article key={c.id} data-market-rival={c.id} className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3 flex flex-col">
              <div className="h-[86px] -mx-1 rounded-xl grid place-items-center overflow-hidden" style={{ background: `linear-gradient(180deg, ${c.color}22, ${c.color}06)` }}>
                <img src={spriteUrl(RIVAL_ART[c.id])} alt="" className="h-[82px] object-contain" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="size-3 rounded-full" style={{ background: c.color }} />
                <span className="font-display font-semibold text-[16px] text-navy-900">{c.name}</span>
                <span className={`ml-auto text-[11px] rounded-full px-2 py-0.5 ${THREAT[o.threat].cls}`}>{THREAT[o.threat].label}</span>
              </div>
              <div className="text-[12px] text-navy-700/65">
                {STYLE[c.personality].label} · {STYLE[c.personality].summary}
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2 text-center">
                {[
                  ['ส่วนแบ่ง', pct(f.share)],
                  ['CR', pct(f.combinedRatio)],
                  ['เงินทุน', mb(f.capital)],
                  ['พอใจ', f.satisfaction.toFixed(2)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-navy-900/[0.035] py-1">
                    <div className="text-[10.5px] text-navy-700/60">{l}</div>
                    <div className="text-[13px] font-semibold text-navy-900 tabular-nums">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[12px] font-medium text-navy-700/70">ไตรมาสที่แล้ว</div>
              <div className="text-[13px] text-navy-900 leading-snug">{lastMoves[c.id]?.replace(c.name + ' ', '') ?? 'ยังไม่มีข้อมูล (ไตรมาสแรก)'}</div>
              <div className="mt-2 text-[12px] font-medium text-navy-700/70">คาดการณ์ไตรมาสนี้</div>
              <div className="text-[13px] text-navy-900 leading-snug">{o.text}</div>
            </article>
          )
        })}
      </div>
    </PageShell>
  )
}
