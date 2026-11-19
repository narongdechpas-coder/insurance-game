import { settingsOf } from '../../game/forecast'
import { channelsChanged, channelSummary } from './ChannelStage'
import { AlertTriangle, Pencil, Users } from 'lucide-react'
import { spriteUrl } from '../../assets/registry'
import { CARDS, isUnlocked, QUARTER_BUDGET_MB } from '../../game/decisions/cards'
import { choiceCost, optionOf, planCost, reviewPlan, tacticOf } from '../../game/decisions/plan'
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
  const responses = useGameStore((s) => s.responses)
  const setStep = useGameStore((s) => s.setStep)
  const setActiveEvent = useGameStore((s) => s.setActiveEvent)
  const setActiveCard = useGameStore((s) => s.setActiveCard)
  const q = game.quarter
  const scen = scenariosFor(game.events.map((e) => e.id))
  const cards = CARDS.filter((c) => isUnlocked(c, q.index))
  const used = planCost(plan, responses)
  const warnings = reviewPlan(plan, game, responses).filter((n) => n.tone === 'warning')

  return (
    <section data-stage="confirm" className="absolute left-7 right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] glass rounded-[28px] p-6 pointer-events-auto anim-rise">
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
              const changed = isCh ? channelsChanged(channels, settingsOf(game)) : plan[c.id].option !== c.defaultOption
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
                      {isCh ? `${channelSummary(channels)}${changed ? '' : ' (คงเดิม)'}` : changed ? (t ? `${o.label} · ${t.label}` : o.label) : `${o.label} (คงเดิม)`}
                    </span>
                  </span>
                  <Cost v={choiceCost(plan, c.id)} />
                  <Pencil size={14} className="text-navy-700/30 group-hover:text-brand-600" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-6 rounded-2xl bg-white/70 px-5 py-3">
        <span className="text-[14px] text-navy-700/80">งบที่ใช้ทั้งไตรมาส</span>
        <span className={`font-display font-bold text-[22px] ${used > QUARTER_BUDGET_MB ? 'text-alert' : 'text-navy-900'}`}>
          {used} / {QUARTER_BUDGET_MB} ล้านบาท
        </span>
        <span className="text-[13.5px] text-navy-700/70">เหลือ {Math.max(0, QUARTER_BUDGET_MB - used)} ล้านบาท</span>
      </div>
    </section>
  )
}
