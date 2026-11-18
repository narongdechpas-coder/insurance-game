import { Crown } from 'lucide-react'
import { currentStandings } from '../../game/sim/engine'
import { useGameStore } from '../../store/useGameStore'
import { Glossed } from '../glossary/Term'
import { mb, pct } from '../review/format'
import { ModalShell } from './ModalShell'

const PARTS = [
  { k: 'capital', label: 'เงินทุน', max: 30, color: '#f7ad1e' },
  { k: 'share', label: 'ส่วนแบ่งตลาด', max: 25, color: '#2f7bff' },
  { k: 'cr', label: 'Combined Ratio เฉลี่ย', max: 25, color: '#22c55e' },
  { k: 'cx', label: 'ความพอใจลูกค้า', max: 20, color: '#ec4899' },
] as const

/** Live ranking, scored exactly like the end of the game. */
export function RankingModal() {
  const game = useGameStore((s) => s.game)
  const rows = currentStandings(game)
  const name = (id: string) => (id === 'player' ? game.config.companyName : (game.competitors.find((c) => c.id === id)?.name ?? id))
  const color = (id: string) => (id === 'player' ? '#2f7bff' : (game.competitors.find((c) => c.id === id)?.color ?? '#94a3b8'))
  return (
    <ModalShell id="ranking" kicker={`ปีที่ ${game.quarter.year} ไตรมาส ${game.quarter.q} · คิดคะแนนแบบเดียวกับตอนจบเกม`} title="อันดับบริษัท" width={960}>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-navy-700/80 mb-3">
        {PARTS.map((p) => (
          <span key={p.k} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            <Glossed text={p.label} /> (เต็ม {p.max})
          </span>
        ))}
      </div>
      <table className="w-full text-[14px]" data-table="ranking">
        <thead>
          <tr className="text-left text-[12px] text-navy-700/60">
            <th className="py-1.5 w-10">#</th>
            <th>บริษัท</th>
            <th className="w-[300px]">คะแนน (เต็ม 100)</th>
            <th className="text-right">เงินทุน</th>
            <th className="text-right">ส่วนแบ่ง</th>
            <th className="text-right">
              CR เฉลี่ย
            </th>
            <th className="text-right">ความพอใจ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const me = r.id === 'player'
            return (
              <tr key={r.id} data-rank-row={r.id} className={`border-t border-navy-900/5 ${me ? 'bg-brand-50/80' : ''}`}>
                <td className="py-2.5 pl-1 font-display font-bold text-[18px] text-navy-900">{i === 0 ? <Crown size={18} className="text-gold-500" /> : i + 1}</td>
                <td className={`font-medium ${me ? 'text-brand-600' : 'text-navy-900'}`}>
                  <span className="inline-block size-2.5 rounded-full mr-2" style={{ background: color(r.id) }} />
                  {name(r.id)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex h-3 w-[230px] rounded-full bg-navy-900/5 overflow-hidden">
                      {r.parts && PARTS.map((p) => <span key={p.k} style={{ width: `${r.parts![p.k]}%`, background: p.color }} />)}
                    </div>
                    <span className="font-display font-bold tabular-nums text-navy-900">{r.score}</span>
                  </div>
                </td>
                <td className="text-right tabular-nums">{mb(r.capital)}</td>
                <td className="text-right tabular-nums">{pct(r.share)}</td>
                <td className="text-right tabular-nums">{pct(r.avgCombinedRatio)}</td>
                <td className="text-right tabular-nums">{r.satisfaction.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-4 text-[13px] text-navy-700/75 leading-relaxed">
        ผู้ชนะคือบริษัทที่มีคะแนนรวมสูงสุดเมื่อจบเกม เงินทุนเป็นล้านบาท · ถ้าเงินทุนของเราต่ำกว่าครึ่งของทุนเริ่มต้น เกมจบทันที และบริษัทใดที่ต่ำกว่าเส้นนี้จะถูกตัดคะแนนเหลือ 30% · ตัวเลขทั้งหมดเป็นผลจำลองของเกม
      </p>
    </ModalShell>
  )
}
