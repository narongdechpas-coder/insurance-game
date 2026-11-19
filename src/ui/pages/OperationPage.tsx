import { CHANNELS, commissionRate } from '../../game/sim/channels'
import { capacityAt } from '../../game/sim/engine'
import { INVESTMENT_IDS, OPS as OPS_DATA, unitsAt } from '../../game/sim/ops'
import { fmtUnits, staffOf } from '../../game/forecast'
import type { Ops } from '../../game/sim/types'
import { CARD_BY_ID } from '../../game/decisions/cards'
import { EVENT_BY_ID } from '../../game/data/events'
import type { DecisionId } from '../../game/decisions/types'
import { useGameStore } from '../../store/useGameStore'
import { pct } from '../review/format'
import { PageShell } from './PageShell'

const OPS = [
  { id: 'contact', label: 'ศูนย์ลูกค้า / สายด่วน', hint: 'งานเพิ่มตามจำนวนกรมธรรม์ และลูกค้าใหม่โทรมากกว่า' },
  { id: 'claims', label: 'ทีมสินไหม', hint: 'งานเพิ่มตามจำนวนเคลม พุ่งขึ้นมากเมื่อเกิดน้ำท่วม' },
  { id: 'repair', label: 'เครือข่ายอู่ซ่อม', hint: 'งานเพิ่มตามจำนวนรถที่ต้องซ่อม' },
] as const

const UNIT: Record<Ops, string> = { claims: 'เคลม/ไตรมาส', contact: 'สาย/ไตรมาส', repair: 'งาน/ไตรมาส' }
const sourceLabel = (src: string) => CARD_BY_ID[src as DecisionId]?.title ?? EVENT_BY_ID[src]?.title ?? src

/** Operation page: how loaded each service unit is, what capacity is in place, and the channel mix. */
export function OperationPage() {
  const game = useGameStore((s) => s.game)
  const q = game.quarter.index
  const cap = capacityAt(game.sim, q)
  const loads = game.lastReport?.loads
  const ops = game.sim.ops
  // lasting investments (permanent) and temporary measures still running
  const boosts = [
    ...INVESTMENT_IDS.filter((id) => ops.owned[id] !== undefined).map((id) => ({ source: OPS_DATA.investments[id].label, ops: OPS_DATA.investments[id].ops as Ops, value: OPS_DATA.investments[id].capacity, from: ops.owned[id]! + (OPS_DATA.investments[id].slow ? 1 : 0), until: Infinity })),
    ...ops.temps.filter((t) => t.until >= q),
  ]
  const pending = game.events.filter((e) => e.consequence)
  const last = game.lastReport?.ops
  const units = unitsAt(ops, q)
  const staffNow = staffOf(game)
  const who: Record<Ops, string> = { claims: `ทีม ${staffNow.claims} คน`, contact: `ทีม ${staffNow.contact} คน`, repair: `${ops.garages} อู่` }
  return (
    <PageShell id="operation" kicker={`การปฏิบัติการ · ปีที่ ${game.quarter.year} ไตรมาส ${game.quarter.q}`} title="กำลังการทำงานและช่องทางขาย">
      <div className="grid grid-cols-3 gap-3">
        {OPS.map((o) => {
          const load = loads?.[o.id]
          const util = load ?? 1 / cap[o.id] // before the first quarter: start-of-game demand vs capacity
          const color = util > 1.08 ? 'bg-alert' : util > 0.97 ? 'bg-watch' : 'bg-good'
          return (
            <div key={o.id} data-ops={o.id} className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
              <div className="font-display font-semibold text-[16px] text-navy-900">{o.label}</div>
              <div className="text-[12px] text-navy-700/60">{o.hint}</div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-[12px] text-navy-700/65">{loads ? 'ใช้กำลังไตรมาสที่แล้ว' : 'ภาระงานตอนเริ่มเกม'}</div>
                  <div className={`font-display font-bold text-[28px] leading-tight ${util > 1.08 ? 'text-alert' : 'text-navy-900'}`}>{pct(util, 0)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-navy-700/65">{who[o.id]}</div>
                  <div className="font-semibold text-[16px] text-navy-900 tabular-nums">รับได้ {fmtUnits(units[o.id])} {UNIT[o.id]}</div>
                  {last && <div className="text-[12px] text-navy-700/65 tabular-nums">งานไตรมาสที่แล้ว {fmtUnits(last.demand[o.id])}</div>}
                </div>
              </div>
              <div className="relative h-3 rounded-full bg-navy-900/8 mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (util / 1.4) * 100)}%` }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-navy-900/50" style={{ left: `${(1 / 1.4) * 100}%` }} title="เต็มกำลัง" />
              </div>
              <div className="text-[12px] mt-1.5 text-navy-700/70">
                {util > 1.08 ? 'เกินกำลัง: ความพอใจลูกค้าตก และจะเกิดเหตุการณ์ต่อเนื่อง' : util > 0.97 ? 'ใกล้เต็มกำลัง ถ้าเร่งยอดต่อควรเพิ่มกำลังก่อน' : 'ยังรับงานเพิ่มได้'}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
          <div className="font-display font-semibold text-[16px] text-navy-900 mb-2">สัดส่วนช่องทางขาย</div>
          {CHANNELS.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-1 text-[14px]">
              <span className="w-16 text-navy-900">{c.label}</span>
              <span className="flex-1 h-3 rounded-full bg-navy-900/8 overflow-hidden">
                <span className="block h-full rounded-full bg-brand-500" style={{ width: `${game.sim.mix[c.id] * 100}%` }} />
              </span>
              <span className="w-12 text-right tabular-nums">{pct(game.sim.mix[c.id], 0)}</span>
              <span className="w-[200px] text-[12px] text-navy-700/65 whitespace-nowrap">ค่านายหน้า {pct(c.commission, 0)}{c.acquisition ? ` + การตลาด ${pct(c.acquisition, 0)}` : ''}</span>
            </div>
          ))}
          <div className="mt-2 text-[13px] text-navy-700/75">ค่านายหน้าเฉลี่ยตามสัดส่วนปัจจุบัน {pct(commissionRate(game.sim.mix))} · ปรับสัดส่วนได้ที่การ์ด "ช่องทางขาย"</div>
        </div>
        <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
          <div className="font-display font-semibold text-[16px] text-navy-900 mb-2">กำลังเสริมที่กำลังทำงาน</div>
          {boosts.length ? (
            <ul className="space-y-1 text-[13.5px]">
              {boosts.map((b, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-navy-900">
                    {sourceLabel(b.source)} → {OPS.find((o) => o.id === b.ops)?.label}
                  </span>
                  <span className={b.value < 0 ? 'text-alert' : 'text-good'}>
                    {b.value > 0 ? '+' : ''}
                    {pct(b.value, 0)} · {b.until === Infinity ? 'ถาวร' : b.from > q ? 'เริ่มไตรมาสหน้า' : `ถึงไตรมาส ${(b.until % 4) + 1}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[13.5px] text-navy-700/60">ยังไม่มี ลงทุนได้จากการ์ดช่องทางขาย, เครือข่ายอู่ หรือการตอบเหตุการณ์</div>
          )}
          <div className="font-display font-semibold text-[15px] text-navy-900 mt-3 mb-1">ปัญหาที่รอรับมือ</div>
          {pending.length ? (
            <ul className="text-[13.5px] text-alert space-y-0.5">
              {pending.map((e) => (
                <li key={e.id}>• {e.title}</li>
              ))}
            </ul>
          ) : (
            <div className="text-[13.5px] text-navy-700/60">ไม่มีผลต่อเนื่องค้างอยู่</div>
          )}
          <div className="mt-2 text-[12px] text-navy-700/55">ความเสี่ยงสะสมในพื้นที่น้ำท่วม: {pct(game.sim.player.catExposure, 0)} ของระดับปกติ</div>
        </div>
      </div>
    </PageShell>
  )
}
