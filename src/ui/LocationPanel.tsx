import { ArrowRight, X } from 'lucide-react'
import { moodOfStatus, portraitKey } from '../assets/portraits'
import { spriteUrl } from '../assets/registry'
import { LOCATION_BY_ID } from '../game/data/locations'
import { MODULES } from '../game/data/modules'
import { CARDS } from '../game/decisions/cards'
import { eventsAt, locationStatus, STATUS_LABEL } from '../game/selectors'
import { useGameStore } from '../store/useGameStore'
import { LOCATION_ICONS } from '../world/icons'
import { BUILDINGS, PANEL_ART } from '../world/layout'

const STATUS_STYLE = {
  good: 'bg-good/15 text-emerald-700',
  watch: 'bg-watch/15 text-amber-700',
  alert: 'bg-alert/15 text-red-700',
  chance: 'bg-chance/15 text-teal-700',
}
const KIND_BAR = { opportunity: 'bg-chance', threat: 'bg-alert', competitor: 'bg-watch' }

/** Slide-in briefing for the place the CEO is looking at. */
export function LocationPanel() {
  const id = useGameStore((s) => s.ui.selected)
  const game = useGameStore((s) => s.game)
  const select = useGameStore((s) => s.select)
  const openRoom = useGameStore((s) => s.openDecisionRoom)
  if (!id) return null
  const loc = LOCATION_BY_ID[id]
  const status = locationStatus(game, id)
  const evs = eventsAt(game, id)
  const Icon = LOCATION_ICONS[loc.icon]
  const head = portraitKey(id, moodOfStatus(status))

  return (
    <aside key={id} className="absolute right-7 top-[104px] w-[400px] glass rounded-[28px] overflow-hidden pointer-events-auto anim-slide-right">
      <div className="relative h-[170px] bg-gradient-to-b from-brand-100 to-white grid place-items-center">
        <img
          src={spriteUrl(PANEL_ART[id] ?? BUILDINGS[id].sprite)}
          alt=""
          className={`object-contain drop-shadow-[0_12px_16px_rgba(20,50,110,0.25)] ${head ? 'max-h-[140px] max-w-[240px] -translate-x-16' : 'max-h-[160px] max-w-[330px]'}`}
        />
        {head && (
          <img
            key={head}
            src={spriteUrl(head)}
            alt=""
            data-portrait={head}
            className="absolute right-4 bottom-3 h-[146px] w-[130px] object-contain object-bottom drop-shadow-[0_10px_14px_rgba(20,50,110,0.3)] anim-rise"
          />
        )}
        <span className={`absolute top-4 left-4 text-[12.5px] font-medium rounded-full px-3 py-1 bg-white/90 shadow-sm ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
        <button onClick={() => select(null)} className="absolute top-3 right-3 grid place-items-center size-9 rounded-full bg-white/90 text-navy-800 hover:bg-white shadow" aria-label="ปิด">
          <X size={18} />
        </button>
      </div>
      <div className="px-6 pb-5 -mt-3 relative">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center size-11 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow">
            <Icon size={22} />
          </span>
          <div>
            <div className="font-display font-bold text-[22px] leading-tight">{loc.en}</div>
            <div className="text-[13px] text-navy-700/70">{loc.th}</div>
          </div>
        </div>
        <p className="mt-3 text-[14.5px] text-navy-800 leading-relaxed">{loc.role}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {loc.modules.map((m) => (
            <span key={m} className="text-[12px] rounded-full bg-brand-50 border border-brand-100 text-brand-600 px-2.5 py-0.5">
              {MODULES[m].en}
            </span>
          ))}
        </div>
        <div className="mt-4 space-y-2.5">
          {evs.length === 0 && <div className="text-[13.5px] text-navy-700/70 rounded-2xl bg-white/70 px-4 py-3">ไตรมาสนี้ยังไม่มีเหตุการณ์ที่กระทบหน่วยงานนี้</div>}
          {evs.map((e) => (
            <div key={e.id} className="relative rounded-2xl bg-white px-4 py-3 pl-5 overflow-hidden border border-brand-100">
              <span className={`absolute left-0 inset-y-0 w-1.5 ${KIND_BAR[e.kind]}`} />
              <div className="font-medium text-[15px]">{e.title}</div>
              <div className="text-[13px] text-navy-700/80 leading-relaxed mt-0.5">{e.detail}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => openRoom(CARDS.find((c) => c.location === id)?.id)}
          className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 text-white font-display font-semibold text-[16px] flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_10px_20px_-8px_rgba(29,95,224,0.8)]"
        >
          วางกลยุทธ์ของหน่วยงานนี้ <ArrowRight size={18} />
        </button>
      </div>
    </aside>
  )
}
