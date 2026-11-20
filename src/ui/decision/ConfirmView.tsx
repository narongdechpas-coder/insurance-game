import { useMemo } from 'react'
import { settingsOf } from '../../game/forecast'
import { channelsChanged, channelSummary } from './ChannelStage'
import { priceSummary } from './PricingStage'
import { stepsChanged } from '../../game/forecast'
import { AlertTriangle, Pencil, Users } from 'lucide-react'
import { spriteUrl } from '../../assets/registry'
import { CARDS, isUnlocked } from '../../game/decisions/cards'
import { attributePlan, type Delta } from '../../game/choiceForecast'
import { useDraft } from './useDraft'
import { budgetOf, budgetUsed, changedCards, choiceCost, keptPlan, optionOf, reviewPlan, tacticOf } from '../../game/decisions/plan'
import { staffOf } from '../../game/forecast'
import { TEAMS } from '../../game/sim/ops'
import { systemSpendPreview } from '../../game/sim/systems'
import { responseOf, scenariosFor } from '../../game/decisions/scenarios'
import { useGameStore } from '../../store/useGameStore'
import { EVENT_ART } from '../../world/eventArt'
import { BUILDINGS } from '../../world/layout'


/** Step 3: the whole quarter plan on one page, every line linking back to where it was decided. */
export function ConfirmView() {
  const game = useGameStore((s) => s.game)
  const plan = useGameStore((s) => s.plan)
  const channels = useGameStore((s) => s.channels)
  const segSteps = useGameStore((s) => s.segSteps)
  const responses = useGameStore((s) => s.responses)
  const setStep = useGameStore((s) => s.setStep)
  const setActiveEvent = useGameStore((s) => s.setActiveEvent)
  const setActiveCard = useGameStore((s) => s.setActiveCard)
  const q = game.quarter
  const scen = scenariosFor(game.events.map((e) => e.id))
  const cards = CARDS.filter((c) => isUnlocked(c, q.index))
  const sysOrders = useGameStore((s) => s.sysOrders)
  const used = budgetUsed(game, plan, responses, sysOrders)
  const budget = budgetOf(game)
  const warnings = reviewPlan(plan, game, responses).filter((n) => n.tone === 'warning')
  const staff = useGameStore((s) => s.staff)
  const kept = useMemo(() => keptPlan(game), [game])

  const staffNow = staffOf(game)
  const staffChanged = TEAMS.some((t) => (staff[t] ?? staffNow[t]) !== staffNow[t])
  const left = budget - used

  // one tile per decision: building art, card title, what was chosen, its spend; tap to edit
  const Tile = ({ id, art, title, value, changed, cost, onEdit }: { id: string; art: string; title: string; value: string; changed: boolean; cost: number; onEdit: () => void }) => (
    <button
      data-edit-card={id}
      onClick={onEdit}
      className={`group relative flex items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors border ${changed ? 'bg-white border-gold-500/70' : 'bg-white/70 border-transparent hover:bg-white'}`}
    >
      <span className="shrink-0 grid place-items-center size-8 rounded-lg bg-brand-50 overflow-hidden">
        <img src={spriteUrl(art as never)} alt="" className="max-w-7 max-h-7 object-contain" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-navy-700/65 truncate">{title}</span>
        <span className={`block text-[13px] leading-tight truncate ${changed ? 'font-medium text-navy-900' : 'text-navy-700/55'}`}>{value}</span>
      </span>
      {cost > 0 && <span className="shrink-0 text-[12px] font-semibold text-navy-900">{cost} ล้าน</span>}
      <Pencil size={12} className="shrink-0 text-navy-700/25 group-hover:text-brand-600" />
    </button>
  )

  return (
    <section data-stage="confirm" className="absolute left-7 right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[590px] overflow-y-auto glass rounded-[28px] px-6 py-5 pointer-events-auto anim-rise">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-brand-600 font-medium">ปีที่ {q.year} · ไตรมาส {q.q}</div>
          <h2 className="font-display font-bold text-[26px] leading-tight text-navy-900">สรุปแผนไตรมาส ก่อนส่งเข้าจำลองผล</h2>
        </div>
        {warnings.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-alert/10 text-red-700 px-3 py-1 text-[12.5px] font-medium">
            <AlertTriangle size={14} /> {warnings.length} ข้อควรระวัง
          </span>
        )}
        <div data-budget-summary className="shrink-0 rounded-2xl bg-white/80 px-4 py-2 text-right">
          <div className="text-[12px] text-navy-700/70">งบที่ใช้ทั้งไตรมาส</div>
          <div className={`font-display font-bold text-[22px] leading-tight ${used > budget ? 'text-alert' : 'text-navy-900'}`}>
            {used} / {budget} <span className="text-[14px] font-medium">ล้านบาท</span>
          </div>
          <div className={`text-[12px] ${left < 0 ? 'text-alert font-medium' : 'text-navy-700/70'}`}>{left < 0 ? `เกินงบ ${-left} ล้านบาท` : `เหลือ ${left} ล้านบาท`}</div>
        </div>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr] gap-4 mt-2">
      <div className="min-w-0">
      <div className="font-display font-semibold text-[15px] text-navy-900 mb-1">① รับมือเหตุการณ์</div>
      <div className="grid grid-cols-1 gap-1.5">
        {scen.map((sc) => {
          const ev = game.events.find((e) => e.id === sc.eventId)!
          const r = responseOf(responses, sc.eventId)
          const art = EVENT_ART[ev.icon]
          return (
            <button
              key={sc.eventId}
              data-edit-event={sc.eventId}
              onClick={() => {
                setActiveEvent(sc.eventId)
                setStep('scenario')
              }}
              className="group flex items-center gap-2 rounded-xl bg-white/80 hover:bg-white px-2 py-1 text-left transition-colors"
            >
              <span className="shrink-0 grid place-items-center size-8 rounded-lg bg-brand-50 overflow-hidden">
                {art ? <img src={spriteUrl(art)} alt="" className="max-w-7 max-h-7 object-contain" /> : <Users size={18} className="text-watch" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-navy-700/65 truncate">{ev.title}</span>
                <span className={`block text-[13px] leading-tight truncate ${r ? 'font-medium text-navy-900' : 'text-alert'}`}>{r?.label ?? 'ยังไม่ได้ตอบ'}</span>
              </span>
              {(r?.cost ?? 0) > 0 && <span className="shrink-0 text-[12px] font-semibold text-navy-900">{r!.cost} ล้าน</span>}
              <Pencil size={12} className="shrink-0 text-navy-700/25 group-hover:text-brand-600" />
            </button>
          )
        })}
      </div>

      <div className="font-display font-semibold text-[15px] text-navy-900 mt-2.5 mb-1">② กลยุทธ์ ทีมงาน และระบบ</div>
      <div className="grid grid-cols-2 gap-1.5">
        {cards.map((c) => {
          const o = optionOf(plan, c.id)
          const t = tacticOf(plan, c.id)
          const isCh = c.id === 'distribution'
          const isPr = c.id === 'pricing'
          const changed = isCh ? channelsChanged(channels, settingsOf(game)) : isPr ? stepsChanged(segSteps) : changedCards(plan, kept).includes(c.id)
          const value = isCh ? channelSummary(channels) : isPr ? priceSummary(segSteps) : t ? `${o.label} · ${t.label}` : o.label
          return (
            <Tile
              key={c.id}
              id={c.id}
              art={BUILDINGS[c.location].sprite}
              title={c.title}
              value={changed ? value : `${value} (คงเดิม)`}
              changed={changed}
              cost={choiceCost(plan, c.id, game.sim.ops.owned)}
              onEdit={() => {
                setActiveCard(c.id)
                setStep('strategy')
              }}
            />
          )
        })}
        <Tile
          id="staff"
          art={BUILDINGS.claims.sprite}
          title="ทีมงานและระบบ"
          value={`สินไหม ${staff.claims ?? staffNow.claims} · Call center ${staff.contact ?? staffNow.contact} คน${sysOrders.length ? ` · สั่งระบบ ${sysOrders.length}` : ''}`}
          changed={staffChanged || sysOrders.length > 0}
          cost={Math.round(systemSpendPreview(game.sim.ops.systems, sysOrders) * 10) / 10}
          onEdit={() => {
            setActiveCard('staff')
            setStep('strategy')
          }}
        />
      </div>

      </div>
      <Attribution />
      </div>
    </section>
  )
}

const sgn = (v: number, d = 0) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d })}`
const tc = (v: number, eps: number, good = 1) => (Math.abs(v) < eps ? 'text-navy-700/55' : v * good > 0 ? 'text-emerald-700' : 'text-red-700')

/** ③ What each change does on its own, plus the "together" row so the rows add up to the whole plan. */
function Attribution() {
  const game = useGameStore((s) => s.game)
  const draft = useDraft()
  const a = useMemo(() => attributePlan(game, draft), [game, draft])
  const row = (key: string, label: string, d: Delta, strong = false) => (
    <tr key={key} data-attr-row={key} className={strong ? 'font-semibold border-b border-brand-100' : ''}>
      <td className="py-0.5 pr-2 text-navy-900 truncate max-w-[200px]" title={label}>{label}</td>
      <td className={`py-0.5 px-1.5 text-right tabular-nums ${tc(d.dGwp, 1)}`}>{sgn(d.dGwp)}</td>
      <td className={`py-0.5 px-1.5 text-right tabular-nums ${tc(d.dUw3, 1)}`}>{sgn(d.dUw3)}</td>
      <td className={`py-0.5 px-1.5 text-right tabular-nums ${tc(d.dSat3, 0.005)}`}>{sgn(d.dSat3, 2)}</td>
      <td className={`py-0.5 pl-1.5 text-right tabular-nums ${tc(d.dFloodLoss, 1, -1)}`}>{sgn(d.dFloodLoss)}</td>
    </tr>
  )
  return (
    <div className="min-w-0 self-start rounded-2xl bg-white/70 px-4 py-2.5" data-attribution>
      <div className="font-display font-semibold text-[15px] text-navy-900">③ แต่ละเรื่องให้ผลเท่าไหร่</div>
      <div className="text-[11.5px] text-navy-700/65">ประมาณการเทียบกับคงทุกอย่างไว้ · หน่วยล้านบาท (ความพอใจเป็นดาว)</div>
      {a.rows.length === 0 ? (
        <div className="text-[13.5px] text-navy-700/70 mt-1">ไตรมาสนี้ไม่ได้เปลี่ยนอะไร ทุกอย่างใช้ค่าเดิม</div>
      ) : (
        <table className="w-full mt-1 text-[12.5px] table-fixed">
          <thead>
            <tr className="text-[11.5px] text-navy-700/65">
              <th className="text-left font-normal pr-2 w-[44%]">เรื่องที่เปลี่ยน</th>
              <th className="text-right font-normal px-1.5">เบี้ยQหน้า</th>
              <th className="text-right font-normal px-1.5">U/W 3Q</th>
              <th className="text-right font-normal px-1.5">พอใจ</th>
              <th className="text-right font-normal pl-1.5">น้ำท่วม</th>
            </tr>
          </thead>
          <tbody>
            {row('total', 'รวมทั้งแผน', a.total, true)}
            {a.rows.map((r) => row(r.id, r.label, r.delta))}
            {a.rows.length > 1 && row('together', 'ผลร่วม (หลายเรื่องเสริมหรือหักล้างกัน)', a.together)}
          </tbody>
        </table>
      )}
      <div className="text-[11px] text-navy-700/60 mt-1">ไม่สุ่ม ไม่มีน้ำท่วม (ยกเว้นคอลัมน์น้ำท่วม) · U/W หักงบของแผนแล้ว · ตัวเลขจำลองของเกม</div>
    </div>
  )
}
