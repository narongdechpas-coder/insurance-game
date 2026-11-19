import { RotateCcw } from 'lucide-react'
import { changedCards, keptPlan, previewImpact } from '../../game/decisions/plan'
import { staffOf } from '../../game/forecast'
import { TEAMS } from '../../game/sim/ops'
import { settingsOf, stepsChanged } from '../../game/forecast'
import { channelsChanged } from './ChannelStage'
import { scenariosFor } from '../../game/decisions/scenarios'
import { outlook } from '../../game/narrative/rivals'
import { useGameStore } from '../../store/useGameStore'
import { ImpactArrows } from './ImpactArrows'
import { AXES, tone } from './visuals'

const BAR = { good: 'bg-good', bad: 'bg-alert', neutral: 'bg-navy-900/15' }

/** What the whole plan leans toward — direction only, no forecasts. */
export function ImpactPanel() {
  const plan = useGameStore((s) => s.plan)
  const reset = useGameStore((s) => s.resetPlan)
  const responses = useGameStore((s) => s.responses)
  const events = useGameStore((s) => s.game.events)
  const game = useGameStore((s) => s.game)
  const impact = previewImpact(plan, responses)
  const segSteps = useGameStore((s) => s.segSteps)
  const channels = useGameStore((s) => s.channels)
  const gameNow = useGameStore((s) => s.game)
  const staff = useGameStore((s) => s.staff)
  // pricing and channels have their own screens now: count their changes from those drafts
  const changed =
    changedCards(plan, keptPlan(gameNow)).filter((c) => c !== 'pricing' && c !== 'distribution').length +
    (stepsChanged(segSteps) ? 1 : 0) +
    (channelsChanged(channels, settingsOf(gameNow)) ? 1 : 0) +
    (TEAMS.some((t) => (staff[t] ?? 0) !== staffOf(gameNow)[t]) ? 1 : 0)
  const scen = scenariosFor(events.map((e) => e.id))
  const answered = scen.filter((sc) => responses[sc.eventId]).length
  return (
    <aside className="absolute right-7 top-[172px] w-[calc(380px+max(0px,100%-1600px)*0.15)] glass rounded-[28px] p-6 pointer-events-auto anim-rise" style={{ animationDelay: '0.1s' }}>
      <div className="font-display font-bold text-[20px] text-navy-900">ภาพรวมแผนไตรมาสนี้</div>
      <div className="text-[13px] text-navy-700/70">ทิศทางที่แผนพาไป ผลจริงขึ้นกับตลาดและคู่แข่ง</div>
      <div className="mt-4 space-y-3">
        {AXES.map((a) => {
          const v = impact[a.id]
          const t = tone(v, a.higherIsBetter)
          return (
            <div key={a.id} className="flex items-center gap-3">
              <span className="w-[118px] text-[14.5px] text-navy-800">{a.label}</span>
              <div className="flex-1 grid grid-cols-6 gap-1 h-3">
                {[-3, -2, -1, 1, 2, 3].map((k) => {
                  const lit = (k < 0 && v <= k) || (k > 0 && v >= k)
                  return <span key={k} className={`rounded-full transition-colors duration-300 ${lit ? BAR[t] : 'bg-navy-900/8'} ${k === 1 ? 'ml-1.5' : ''}`} />
                })}
              </div>
              <span className="w-6 grid place-items-center">
                <ImpactArrows value={Math.sign(v) * Math.min(2, Math.abs(v))} higherIsBetter={a.higherIsBetter} size={15} />
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 rounded-2xl bg-white/70 px-4 py-2.5" data-panel="rival-outlook">
        <div className="text-[13px] font-medium text-navy-800 mb-1">คู่แข่งน่าจะทำอะไรไตรมาสนี้</div>
        {game.competitors.map((c) => {
          const o = outlook(game, c.id)
          return (
            <div key={c.id} className="flex items-start gap-2 py-0.5 text-[12.5px] leading-snug" title={o.text}>
              <span className={`mt-1 size-2 shrink-0 rounded-full ${o.threat === 'high' ? 'bg-alert' : o.threat === 'mid' ? 'bg-watch' : 'bg-good'}`} />
              <span className="shrink-0 font-medium" style={{ color: c.color }}>{c.name.split(' ')[0]}</span>
              <span className="text-navy-800 line-clamp-1">{o.text}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-2.5">
        <span className="text-[14px] text-navy-800">
          ตอบเหตุการณ์ <b className={answered === scen.length ? 'text-good' : 'text-brand-600'}>{answered}/{scen.length}</b>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-2.5">
        <span className="text-[14px] text-navy-800">
          ปรับจากเดิม <b className="text-brand-600">{changed}</b> เรื่อง
        </span>
        <button onClick={reset} disabled={!changed} className="inline-flex items-center gap-1.5 text-[13px] text-navy-700/80 hover:text-brand-600 disabled:opacity-40">
          <RotateCcw size={14} /> คืนค่าเดิม
        </button>
      </div>
    </aside>
  )
}
