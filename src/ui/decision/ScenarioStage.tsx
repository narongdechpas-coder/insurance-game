import { Check, Clock, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { spriteUrl } from '../../assets/registry'
import { SCENARIO_BY_EVENT, scenariosFor } from '../../game/decisions/scenarios'
import { useGameStore } from '../../store/useGameStore'
import { EVENT_ART } from '../../world/eventArt'
import { CostChip, ImpactRow } from './CardStage'
import { KIND, OPTION_ICONS, SPEED_LABEL } from './visuals'

/** Step 1: the active event as a story, and three ways to respond. */
export function ScenarioStage() {
  const eventId = useGameStore((s) => s.ui.activeEvent)
  const events = useGameStore((s) => s.game.events)
  const responses = useGameStore((s) => s.responses)
  const respond = useGameStore((s) => s.respond)
  const setActive = useGameStore((s) => s.setActiveEvent)
  const advance = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(advance.current), [])

  const sc = eventId ? SCENARIO_BY_EVENT[eventId] : undefined
  const ev = events.find((e) => e.id === eventId)
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
    <section key={sc.eventId} data-stage="scenario" className="absolute left-[344px] top-[172px] w-[810px] glass rounded-[28px] overflow-hidden pointer-events-auto anim-rise">
      <header className="relative bg-gradient-to-br from-brand-100 via-white to-brand-50 flex items-center px-8 py-5 gap-6">
        <span className="shrink-0 grid place-items-center w-[180px] h-[150px]">
          {art ? (
            <img src={spriteUrl(art)} alt="" className="max-h-[150px] max-w-[180px] object-contain drop-shadow-[0_12px_16px_rgba(20,50,110,0.25)]" />
          ) : (
            <Users size={64} className="text-watch" />
          )}
        </span>
        <div className="min-w-0">
          <span className={`inline-block text-[12px] text-white rounded-full px-2.5 py-0.5 ${KIND[ev.kind].cls}`}>{KIND[ev.kind].label}</span>
          <h2 className="font-display font-bold text-[27px] leading-tight text-navy-900 mt-1">{ev.title}</h2>
          <p className="text-[14px] text-navy-700/85 leading-relaxed mt-1">{ev.detail}</p>
          <p className="text-[16.5px] font-medium text-brand-600 mt-2">{sc.question}</p>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-3 p-5">
        {sc.responses.map((r) => {
          const on = r.id === chosen
          const Icon = OPTION_ICONS[r.icon]
          return (
            <button
              key={r.id}
              data-response={r.id}
              onClick={() => pick(r.id)}
              className={`relative flex flex-col text-left rounded-[20px] p-4 h-[268px] border-2 transition-all duration-300 ease-(--ease-game) ${
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
                <span className="font-display font-semibold text-[16.5px] leading-tight text-navy-900">{r.label}</span>
              </span>
              <span className="text-[13px] leading-snug text-navy-700/85 mt-2.5 flex-1">{r.blurb}</span>
              <span className="inline-flex self-start items-center gap-1 rounded-full bg-brand-50 text-brand-600 px-2 py-0.5 text-[11px] mb-2">
                <Clock size={11} /> {SPEED_LABEL[r.speed]}
              </span>
              <span className="flex items-end justify-between pt-2 border-t border-brand-100">
                <span className="w-[136px]">
                  <ImpactRow impact={r.impact} size={13} />
                </span>
                <CostChip cost={r.cost} />
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
