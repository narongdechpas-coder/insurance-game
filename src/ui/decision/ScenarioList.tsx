import { Check, Users } from 'lucide-react'
import { spriteUrl } from '../../assets/registry'
import { responseOf, scenariosFor } from '../../game/decisions/scenarios'
import { useGameStore } from '../../store/useGameStore'
import { EVENT_ICON } from '../../world/eventArt'
import { KIND } from './visuals'

/** Step 1 sidebar: this quarter's events, with what the CEO answered. */
export function ScenarioList() {
  const events = useGameStore((s) => s.game.events)
  const responses = useGameStore((s) => s.responses)
  const active = useGameStore((s) => s.ui.activeEvent)
  const setActive = useGameStore((s) => s.setActiveEvent)
  const scen = scenariosFor(events.map((e) => e.id))
  return (
    <nav data-list="events" className="absolute left-7 top-[172px] w-[calc(300px+max(0px,100%-1600px)*0.15)] glass rounded-[24px] p-2.5 flex flex-col gap-1.5 pointer-events-auto anim-rise">
      <div className="px-2 pt-1 pb-1.5 text-[13px] text-navy-700/70">เหตุการณ์ไตรมาสนี้ ต้องตอบทุกเรื่อง</div>
      {scen.map((sc) => {
        const ev = events.find((e) => e.id === sc.eventId)!
        const r = responseOf(responses, sc.eventId)
        const on = sc.eventId === active
        const art = EVENT_ICON[ev.icon]
        return (
          <button
            key={sc.eventId}
            data-event={sc.eventId}
            onClick={() => setActive(sc.eventId)}
            className={`relative flex items-center gap-3 rounded-2xl pl-1.5 pr-3 py-1.5 text-left transition-all ${
              on ? 'bg-white shadow-[0_6px_16px_-6px_rgba(20,50,110,0.35)] ring-2 ring-brand-500' : 'hover:bg-white/70'
            }`}
          >
            <span className="shrink-0 grid place-items-center w-[62px] h-[58px] rounded-xl bg-gradient-to-b from-brand-50 to-brand-100 overflow-hidden">
              {art ? <img src={spriteUrl(art)} alt="" className="max-w-[56px] max-h-[52px] object-contain" /> : <Users size={24} className="text-watch" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`inline-block text-[10.5px] text-white rounded-full px-2 py-px ${KIND[ev.kind].cls}`}>{KIND[ev.kind].label}</span>
              <span className="block font-medium text-[14px] text-navy-900 leading-tight mt-0.5">{ev.title}</span>
              <span className={`block text-[12px] leading-tight truncate mt-0.5 ${r ? 'text-brand-600 font-medium' : 'text-alert'}`}>{r ? r.label : 'ยังไม่ได้ตอบ'}</span>
            </span>
            {r && (
              <span className="grid place-items-center size-6 rounded-full bg-good text-white">
                <Check size={14} strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
