import { Check, Coins } from 'lucide-react'
import { spriteUrl } from '../../assets/registry'
import { CARD_BY_ID } from '../../game/decisions/cards'
import { MODULES } from '../../game/data/modules'
import { LOCATION_BY_ID } from '../../game/data/locations'
import { useGameStore } from '../../store/useGameStore'
import { BUILDINGS, PANEL_ART } from '../../world/layout'
import { ImpactArrows } from './ImpactArrows'
import { AXES, OPTION_ICONS } from './visuals'

/** The active strategy card: building, question, and its options as big choice tiles. */
export function CardStage() {
  const id = useGameStore((s) => s.ui.activeCard)
  const chosen = useGameStore((s) => s.plan[id])
  const choose = useGameStore((s) => s.choose)
  const card = CARD_BY_ID[id]
  const loc = LOCATION_BY_ID[card.location]
  const cols = card.options.length >= 5 ? 'grid-cols-5' : card.options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <section key={id} className="absolute left-[344px] top-[172px] w-[810px] h-[540px] glass rounded-[28px] overflow-hidden pointer-events-auto anim-rise">
      <header className="relative h-[178px] bg-gradient-to-br from-brand-100 via-white to-brand-50 flex items-center px-8 gap-6">
        <img src={spriteUrl(PANEL_ART[card.location] ?? BUILDINGS[card.location].sprite)} alt="" className="h-[150px] w-[230px] object-contain drop-shadow-[0_12px_16px_rgba(20,50,110,0.25)]" />
        <div className="min-w-0">
          <div className="text-[13px] text-brand-600 font-medium">{loc.en} · {loc.th}</div>
          <h2 className="font-display font-bold text-[30px] leading-tight text-navy-900">{card.title}</h2>
          <p className="text-[17px] text-navy-800 mt-1">{card.question}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {card.modules.map((m) => (
              <span key={m} className="text-[11.5px] rounded-full bg-white border border-brand-100 text-brand-600 px-2.5 py-0.5">{MODULES[m].en}</span>
            ))}
          </div>
        </div>
      </header>
      <div className={`grid ${cols} gap-3 p-5`}>
        {card.options.map((o) => {
          const on = o.id === chosen
          const Icon = OPTION_ICONS[o.icon]
          return (
            <button
              key={o.id}
              onClick={() => choose(id, o.id)}
              className={`group relative flex flex-col text-left rounded-[20px] p-3.5 h-[300px] border-2 transition-all duration-300 ease-(--ease-game) ${
                on
                  ? 'bg-white border-brand-500 shadow-[0_14px_28px_-12px_rgba(29,95,224,0.6)] -translate-y-1.5'
                  : 'bg-white/70 border-transparent hover:bg-white hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              {on && (
                <span className="absolute -top-2.5 -right-2.5 grid place-items-center size-8 rounded-full bg-brand-500 text-white ring-4 ring-white">
                  <Check size={17} strokeWidth={3} />
                </span>
              )}
              <span className={`grid place-items-center size-14 rounded-2xl mb-3 transition-colors ${on ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
                <Icon size={28} strokeWidth={2.4} />
              </span>
              <span className="font-display font-semibold text-[18px] leading-tight text-navy-900">{o.label}</span>
              <span className="text-[13px] leading-snug text-navy-700/80 mt-1.5 flex-1">{o.blurb}</span>
              <span className="grid grid-cols-4 gap-1 mt-2 pt-2.5 border-t border-brand-100">
                {AXES.map((a) => (
                  <span key={a.id} className="flex flex-col items-center gap-0.5">
                    <span className="h-[22px] grid place-items-center">
                      <ImpactArrows value={o.impact[a.id]} higherIsBetter={a.higherIsBetter} size={14} />
                    </span>
                    <span className="text-[10.5px] text-navy-700/60">{a.short}</span>
                  </span>
                ))}
              </span>
              <span className={`mt-2 self-start inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] ${o.cost ? 'bg-gold-300/50 text-navy-900' : 'bg-navy-900/5 text-navy-700/60'}`}>
                <Coins size={12} /> {o.cost ? `${o.cost} ล้านบาท` : 'ไม่ใช้งบ'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
