import { Lightbulb, Users } from 'lucide-react'
import { spriteUrl } from '../assets/registry'
import { useGameStore } from '../store/useGameStore'
import { EVENT_ICON } from '../world/eventArt'

const KIND = {
  opportunity: { label: 'โอกาส', cls: 'bg-chance' },
  threat: { label: 'ภัยคุกคาม', cls: 'bg-alert' },
  competitor: { label: 'คู่แข่ง', cls: 'bg-watch' },
}

/** This quarter's headline events — click one to fly to where it lands. */
export function EventStrip() {
  const events = useGameStore((s) => s.game.events)
  const highlighted = useGameStore((s) => s.ui.highlightedEvent)
  const focusEvent = useGameStore((s) => s.focusEvent)
  const selected = useGameStore((s) => s.ui.selected)
  return (
    <section className="absolute left-[calc(530px+(100%-1476px)/2)] bottom-5 w-[600px] glass rounded-[26px] px-4 pt-7 pb-4 pointer-events-auto anim-rise" style={{ animationDelay: '0.3s' }}>
      <div className="absolute -top-5 left-6 flex items-center gap-2 pill-navy rounded-full pl-1.5 pr-5 py-1.5 font-display font-semibold text-[16px]">
        <span className="grid place-items-center size-7 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900">
          <Lightbulb size={15} />
        </span>
        เหตุการณ์สำคัญของไตรมาสนี้
      </div>
      <div className="grid grid-cols-3 gap-3">
        {events.map((ev) => {
          const art = EVENT_ICON[ev.icon]
          const related = selected !== null && ev.locations.includes(selected)
          const on = highlighted === ev.id || related
          const dim = selected !== null && !related
          return (
            <button
              key={ev.id}
              onClick={() => focusEvent(on ? null : ev.id)}
              className={`group relative flex items-center gap-2 h-[92px] rounded-2xl bg-white pl-2 pr-3 text-left border transition-all duration-300 ${
                on ? 'border-brand-500 shadow-[0_0_0_3px_rgba(47,123,255,0.25)] -translate-y-1' : 'border-brand-100 hover:-translate-y-1 hover:shadow-lg'} ${dim ? 'opacity-45 saturate-50' : ''
              }`}
            >
              <div className="shrink-0 grid place-items-center w-[70px] h-[72px] rounded-xl bg-gradient-to-b from-brand-50 to-brand-100 overflow-hidden">
                {art ? (
                  <img src={spriteUrl(art)} alt="" className="max-w-[64px] max-h-[64px] object-contain transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="grid place-items-center size-14 rounded-full bg-white border-2 border-dashed border-watch/50 text-watch" title="รอภาพประกอบ">
                    <Users size={26} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className={`inline-block text-[10.5px] text-white rounded-full px-2 py-px ${KIND[ev.kind].cls}`}>{KIND[ev.kind].label}</span>
                <div className="font-medium text-[14px] leading-snug text-navy-900 mt-1">{ev.title}</div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
