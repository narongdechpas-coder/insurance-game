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
import { budgetOf, budgetUsed, choiceCost, optionOf, reviewPlan, tacticOf } from '../../game/decisions/plan'
import { responseOf, scenariosFor } from '../../game/decisions/scenarios'
import { useGameStore } from '../../store/useGameStore'
import { EVENT_ART } from '../../world/eventArt'
import { BUILDINGS } from '../../world/layout'

function Cost({ v }: { v: number }) {
  return <span className={`shrink-0 w-[92px] text-right text-[13.5px] ${v ? 'font-semibold text-navy-900' : 'text-navy-700/45'}`}>{v ? `${v} ล้านบาท` : '—'}</span>
}

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

  return (
    <section data-stage="confirm" className="absolute left-7 right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[590px] overflow-y-auto glass rounded-[28px] p-6 pointer-events-auto anim-rise">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[13px] text-brand-600 font-medium">ปีที่ {q.year} · ไตรมาส {q.q}</div>
          <h2 className="font-display font-bold text-[28px] leading-tight text-navy-900">สรุปแผนไตรมาส ก่อนส่งเข้าจำลองผล</h2>
        </div>
        {warnings.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-alert/10 text-red-700 px-3 py-1 text-[13px] font-medium">
            <AlertTriangle size={15} /> แผนมี {warnings.length} ข้อควรระวัง ยืนยันได้ แต่ควรอ่านคำเตือนก่อน
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5 mt-4">
        <div>
          <div className="font-display font-semibold text-[16px] text-navy-900 mb-2">① รับมือเหตุการณ์</div>
          <div className="space-y-1.5">
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
                  className="group w-full flex items-center gap-3 rounded-2xl bg-white/80 hover:bg-white px-2 py-1.5 text-left transition-colors"
                >
                  <span className="shrink-0 grid place-items-center size-11 rounded-xl bg-brand-50 overflow-hidden">
                    {art ? <img src={spriteUrl(art)} alt="" className="max-w-10 max-h-10 object-contain" /> : <Users size={20} className="text-watch" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-navy-700/65 truncate">{ev.title}</span>
                    <span className="block text-[14.5px] font-medium text-navy-900 truncate">{r?.label ?? 'ยังไม่ได้ตอบ'}</span>
                  </span>
                  <Cost v={r?.cost ?? 0} />
                  <Pencil size={14} className="text-navy-700/30 group-hover:text-brand-600" />
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <div className="font-display font-semibold text-[16px] text-navy-900 mb-2">② กลยุทธ์</div>
          <div className="space-y-1.5">
            {cards.map((c) => {
              const o = optionOf(plan, c.id)
              const t = tacticOf(plan, c.id)
              const isCh = c.id === 'distribution'
              const isPr = c.id === 'pricing'
              const changed = isCh ? channelsChanged(channels, settingsOf(game)) : isPr ? stepsChanged(segSteps) : plan[c.id].option !== c.defaultOption
              return (
                <button
                  key={c.id}
                  data-edit-card={c.id}
                  onClick={() => {
                    setActiveCard(c.id)
                    setStep('strategy')
                  }}
                  className="group w-full flex items-center gap-3 rounded-2xl bg-white/80 hover:bg-white px-2 py-1.5 text-left transition-colors"
                >
                  <span className="shrink-0 grid place-items-center size-11 rounded-xl bg-brand-50 overflow-hidden">
                    <img src={spriteUrl(BUILDINGS[c.location].sprite)} alt="" className="max-w-10 max-h-10 object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-navy-700/65 truncate">{c.title}</span>
                    <span className={`block text-[14.5px] truncate ${changed ? 'font-medium text-navy-900' : 'text-navy-700/55'}`}>
                      {isCh ? `${channelSummary(channels)}${changed ? '' : ' (คงเดิม)'}` : isPr ? priceSummary(segSteps) : changed ? (t ? `${o.label} · ${t.label}` : o.label) : `${o.label} (คงเดิม)`}
                    </span>
                  </span>
                  <Cost v={choiceCost(plan, c.id, game.sim.ops.owned)} />
                  <Pencil size={14} className="text-navy-700/30 group-hover:text-brand-600" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Attribution />

      <div className="mt-4 flex items-center justify-end gap-6 rounded-2xl bg-white/70 px-5 py-3">
        <span className="text-[14px] text-navy-700/80">งบที่ใช้ทั้งไตรมาส</span>
        <span className={`font-display font-bold text-[22px] ${used > budget ? 'text-alert' : 'text-navy-900'}`}>
          {used} / {budget} ล้านบาท
        </span>
        <span className="text-[13.5px] text-navy-700/70">เหลือ {Math.max(0, budget - used)} ล้านบาท</span>
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
      <td className="py-1 pr-3 text-navy-900">{label}</td>
      <td className={`py-1 px-2 text-right tabular-nums ${tc(d.dGwp, 1)}`}>{sgn(d.dGwp)}</td>
      <td className={`py-1 px-2 text-right tabular-nums ${tc(d.dUw3, 1)}`}>{sgn(d.dUw3)}</td>
      <td className={`py-1 px-2 text-right tabular-nums ${tc(d.dSat3, 0.005)}`}>{sgn(d.dSat3, 2)}</td>
      <td className={`py-1 pl-2 text-right tabular-nums ${tc(d.dFloodLoss, 1, -1)}`}>{sgn(d.dFloodLoss)}</td>
    </tr>
  )
  return (
    <div className="mt-4 rounded-2xl bg-white/70 px-5 py-3" data-attribution>
      <div className="font-display font-semibold text-[16px] text-navy-900">③ แต่ละเรื่องให้ผลเท่าไหร่ (ประมาณการ เทียบกับคงทุกอย่างไว้)</div>
      {a.rows.length === 0 ? (
        <div className="text-[13.5px] text-navy-700/70 mt-1">ไตรมาสนี้ไม่ได้เปลี่ยนอะไร ทุกอย่างใช้ค่าเดิม</div>
      ) : (
        <table className="w-full mt-1 text-[13px]">
          <thead>
            <tr className="text-[11.5px] text-navy-700/65">
              <th className="text-left font-normal pr-3">เรื่องที่เปลี่ยน</th>
              <th className="text-right font-normal px-2">เบี้ยไตรมาสหน้า (ล้าน)</th>
              <th className="text-right font-normal px-2">U/W 3 ไตรมาส (ล้าน)</th>
              <th className="text-right font-normal px-2">ความพอใจ (ดาว)</th>
              <th className="text-right font-normal pl-2">ถ้าน้ำท่วม (ล้าน)</th>
            </tr>
          </thead>
          <tbody>
            {row('total', 'รวมทั้งแผน', a.total, true)}
            {a.rows.map((r) => row(r.id, r.label, r.delta))}
            {a.rows.length > 1 && row('together', 'ผลร่วม (หลายเรื่องเสริมหรือหักล้างกัน)', a.together)}
          </tbody>
        </table>
      )}
      <div className="text-[11.5px] text-navy-700/60 mt-1">ไม่สุ่ม ไม่มีน้ำท่วม (ยกเว้นคอลัมน์ถ้าน้ำท่วม) · U/W หักงบของแผนแล้ว · ตัวเลขจำลองของเกม</div>
    </div>
  )
}
