import { Check, Clock } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { HeaderChip, ManagerBubble } from './StageHeader'
import { EventBanner } from './EventBanner'
import { SCENARIO_BY_EVENT, scenariosFor } from '../../game/decisions/scenarios'
import { useGameStore } from '../../store/useGameStore'
import { EVENT_ART } from '../../world/eventArt'
import { CostChip, ImpactRow, OpsBadge } from './CardStage'
import { forecastResponses } from '../../game/choiceForecast'
import { ForecastNumbers } from './ForecastNumbers'
import { useDraft } from './useDraft'
import { isInvestment, tempActive } from '../../game/sim/ops'
import { KIND, OPTION_ICONS, SPEED_LABEL } from './visuals'
import { Glossed } from '../glossary/Term'

/** Step 1: the active event as a story, and three ways to respond. */
export function ScenarioStage() {
  const eventId = useGameStore((s) => s.ui.activeEvent)
  const events = useGameStore((s) => s.game.events)
  const responses = useGameStore((s) => s.responses)
  const ops = useGameStore((s) => s.game.sim.ops)
  const q = useGameStore((s) => s.game.quarter.index)
  const respond = useGameStore((s) => s.respond)
  const setActive = useGameStore((s) => s.setActiveEvent)
  const advance = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(advance.current), [])

  const sc = eventId ? SCENARIO_BY_EVENT[eventId] : undefined
  const ev = events.find((e) => e.id === eventId)
  // engine numbers for each response, against doing nothing about this event (phase 3)
  const game = useGameStore((s) => s.game)
  const draft = useDraft()
  const fc = useMemo(() => (eventId && sc ? forecastResponses(game, draft, eventId) : {}), [game, draft, eventId, sc])
  if (!sc || !ev) return null
  const chosen = responses[sc.eventId]
  const art = EVENT_ART[ev.icon]

  const pick = (id: string) => {
    const first = !chosen
    respond(sc.eventId, id)
    // first answer moves on to the next open event, so the step flows
    if (first) {
      const next = scenariosFor(events.map((e) => e.id)).find((x) => x.eventId !== sc.eventId && !responses[x.eventId])
      if (next) {
        clearTimeout(advance.current)
        advance.current = window.setTimeout(() => setActive(next.eventId), 650)
      }
    }
  }

  return (
    <>
    <ManagerBubble key={`bubble-${sc.eventId}`} id={sc.eventId} tail={false} lines={<span title={ev.detail}>{ev.detail}</span>} strong={sc.question} />
    <section key={sc.eventId} data-stage="scenario" className="border-0! absolute left-[calc(352px+max(0px,100%-1600px)*0.15)] right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[calc(100%-172px-150px)] glass rounded-[28px] overflow-x-hidden overflow-y-auto pointer-events-auto anim-rise">
      <EventBanner
        icon={ev.icon}
        kind={ev.kind}
        art={art ?? null}
        kicker={`รับมือเหตุการณ์ · ${KIND[ev.kind].label}`}
        title={ev.title}
        subtitle="เลือก 1 ทาง · ตัวเลขเทียบกับไม่ทำอะไร"
        chips={
          <>
            <span className={`text-[11.5px] text-white rounded-full px-2.5 py-0.5 ${KIND[ev.kind].cls}`}>{KIND[ev.kind].label}</span>
            <HeaderChip>ใช้งบก้อนเดียวกับกลยุทธ์</HeaderChip>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        {sc.responses.map((r) => {
          const on = r.id === chosen
          const Icon = OPTION_ICONS[r.icon]
          return (
            <button
              key={r.id}
              data-response={r.id}
              onClick={() => pick(r.id)}
              className={`relative flex flex-col text-left rounded-[20px] px-4 py-3 border-2 transition-all duration-300 ease-(--ease-game) ${
                on ? 'bg-white border-brand-500 shadow-[0_14px_28px_-12px_rgba(29,95,224,0.6)] -translate-y-1' : 'bg-white/70 border-transparent hover:bg-white hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              {on && (
                <span className="absolute -top-2.5 -right-2.5 grid place-items-center size-8 rounded-full bg-brand-500 text-white ring-4 ring-white">
                  <Check size={17} strokeWidth={3} />
                </span>
              )}
              <span className="flex items-center gap-2.5">
                <span className={`shrink-0 grid place-items-center size-11 rounded-2xl ${on ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
                  <Icon size={23} strokeWidth={2.4} />
                </span>
                <span className="font-display font-semibold text-[16.5px] leading-tight text-navy-900"><Glossed text={r.label} /></span>
              </span>
              <span className="text-[13px] leading-snug text-navy-700/85 mt-2 min-h-[54px]"><Glossed text={r.blurb} /></span>
              <span className="flex flex-wrap gap-1 my-1.5">
                <OpsBadge id={r.id} owned={ops.owned} active={tempActive(ops, r.id, q) ? Math.max(...ops.temps.filter((x) => x.source === r.id).map((x) => x.until)) - q + 1 : 0} />
                <span className="inline-flex self-start items-center gap-1 rounded-full bg-brand-50 text-brand-600 px-2 py-0.5 text-[11px]">
                  <Clock size={11} /> {SPEED_LABEL[r.speed]}
                </span>
              </span>
              <span className="flex items-end justify-between pt-2 border-t border-brand-100">
                <span className="w-[136px]">
                  <ImpactRow impact={fc[r.id]?.arrows ?? r.impact} size={13} />
                </span>
                <CostChip cost={isInvestment(r.id) && ops.owned[r.id] !== undefined ? 0 : r.cost} />
              </span>
              <span className="mt-1.5 pt-1.5 border-t border-brand-100">
                <ForecastNumbers d={fc[r.id]} compact />
              </span>
            </button>
          )
        })}
      </div>
    </section>
    </>
  )
}
