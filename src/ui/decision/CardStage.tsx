import { Check, Clock, Coins, Hourglass, Sparkles } from 'lucide-react'
import { spriteUrl } from '../../assets/registry'
import { CARD_BY_ID } from '../../game/decisions/cards'
import { choiceImpact, tacticOf } from '../../game/decisions/plan'
import type { DecisionId, Impact, Tactic } from '../../game/decisions/types'
import { LOCATION_BY_ID } from '../../game/data/locations'
import { MODULES } from '../../game/data/modules'
import { useGameStore } from '../../store/useGameStore'
import { BUILDINGS, PANEL_ART } from '../../world/layout'
import { ImpactArrows } from './ImpactArrows'
import { AXES, DURATION_LABEL, OPTION_ICONS, SPEED_LABEL } from './visuals'

function ImpactRow({ impact, size = 14 }: { impact: Impact; size?: number }) {
  return (
    <span className="grid grid-cols-4 gap-1">
      {AXES.map((a) => (
        <span key={a.id} className="flex flex-col items-center gap-0.5">
          <span className="h-[22px] grid place-items-center">
            <ImpactArrows value={Math.sign(impact[a.id]) * Math.min(3, Math.abs(impact[a.id]))} higherIsBetter={a.higherIsBetter} size={size} />
          </span>
          <span className="text-[10.5px] text-navy-700/60">{a.short}</span>
        </span>
      ))}
    </span>
  )
}

function CostChip({ cost }: { cost: number }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] ${cost ? 'bg-gold-300/50 text-navy-900' : 'bg-navy-900/5 text-navy-700/60'}`}>
      <Coins size={12} /> {cost ? `${cost} ล้านบาท` : 'ไม่ใช้งบ'}
    </span>
  )
}

/** Layer 2: how to carry out the chosen stance. */
function TacticRow({ card, stanceLabel, tactics }: { card: DecisionId; stanceLabel: string; tactics: Tactic[] }) {
  const plan = useGameStore((s) => s.plan)
  const chooseTactic = useGameStore((s) => s.chooseTactic)
  const chosen = tacticOf(plan, card)?.id
  return (
    <div className="px-5 pb-5 anim-rise" key={stanceLabel}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-display font-semibold text-[16px] text-navy-900">วิธีทำ: {stanceLabel}</span>
        <span className="text-[12.5px] text-navy-700/60">เลือกแบบแนะนำไว้ให้แล้ว เปลี่ยนได้</span>
      </div>
      <div className={`grid gap-3 ${tactics.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {tactics.map((t) => {
          const on = t.id === chosen
          const Icon = OPTION_ICONS[t.icon]
          // preview what the whole card does with this tactic
          const impact = choiceImpact({ ...plan, [card]: { ...plan[card], tactic: t.id } }, card)
          return (
            <button
              key={t.id}
              data-tactic={t.id}
              onClick={() => chooseTactic(card, t.id)}
              className={`relative flex flex-col text-left rounded-[18px] p-3.5 h-[226px] border-2 transition-all duration-300 ease-(--ease-game) ${
                on ? 'bg-white border-gold-500 shadow-[0_12px_24px_-12px_rgba(217,138,7,0.65)] -translate-y-1' : 'bg-white/70 border-transparent hover:bg-white hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              {on && (
                <span className="absolute -top-2.5 -right-2.5 grid place-items-center size-7 rounded-full bg-gold-500 text-white ring-4 ring-white">
                  <Check size={15} strokeWidth={3} />
                </span>
              )}
              <span className="flex items-center gap-2.5">
                <span className={`shrink-0 grid place-items-center size-10 rounded-xl ${on ? 'bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900' : 'bg-gold-300/30 text-gold-600'}`}>
                  <Icon size={21} strokeWidth={2.3} />
                </span>
                <span className="font-display font-semibold text-[15.5px] leading-tight text-navy-900">{t.label}</span>
              </span>
              <span className="text-[12.5px] leading-snug text-navy-700/85 mt-2 flex-1">{t.blurb}</span>
              <span className="flex flex-wrap gap-1 mt-1.5">
                {t.recommended && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-300/60 text-navy-900 px-2 py-0.5 text-[11px] font-medium">
                    <Sparkles size={11} /> แนะนำ
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-600 px-2 py-0.5 text-[11px]">
                  <Clock size={11} /> {SPEED_LABEL[t.speed]}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-600 px-2 py-0.5 text-[11px]">
                  <Hourglass size={11} /> {DURATION_LABEL[t.duration]}
                </span>
              </span>
              <span className="flex items-end justify-between mt-2 pt-2 border-t border-brand-100">
                <span className="w-[136px]">
                  <ImpactRow impact={impact} size={13} />
                </span>
                <CostChip cost={t.cost} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** The active strategy card: building, question, stances, and (when the stance has them) tactics. */
export function CardStage() {
  const id = useGameStore((s) => s.ui.activeCard)
  const chosen = useGameStore((s) => s.plan[id].option)
  const choose = useGameStore((s) => s.choose)
  const card = CARD_BY_ID[id]
  const loc = LOCATION_BY_ID[card.location]
  const chosenOption = card.options.find((o) => o.id === chosen)
  const tactics = chosenOption?.tactics
  const compact = !!tactics
  const cols = card.options.length >= 5 ? 'grid-cols-5' : card.options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
  const tight = compact && card.options.length >= 5 // five compact tiles: smaller icon, shorter cost chip

  return (
    <section key={id} className="absolute left-[344px] top-[172px] w-[810px] max-h-[612px] glass rounded-[28px] overflow-hidden pointer-events-auto anim-rise">
      <header className={`relative bg-gradient-to-br from-brand-100 via-white to-brand-50 flex items-center px-8 gap-6 transition-[height] duration-300 ${compact ? 'h-[128px]' : 'h-[178px]'}`}>
        <img
          src={spriteUrl(PANEL_ART[card.location] ?? BUILDINGS[card.location].sprite)}
          alt=""
          className={`object-contain drop-shadow-[0_12px_16px_rgba(20,50,110,0.25)] transition-all duration-300 ${compact ? 'h-[108px] w-[160px]' : 'h-[150px] w-[230px]'}`}
        />
        <div className="min-w-0">
          <div className="text-[13px] text-brand-600 font-medium">
            {loc.en} · {loc.th}
          </div>
          <h2 className={`font-display font-bold leading-tight text-navy-900 ${compact ? 'text-[25px]' : 'text-[30px]'}`}>{card.title}</h2>
          <p className="text-[16px] text-navy-800 mt-0.5">{card.question}</p>
          {!compact && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {card.modules.map((m) => (
                <span key={m} className="text-[11.5px] rounded-full bg-white border border-brand-100 text-brand-600 px-2.5 py-0.5">
                  {MODULES[m].en}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className={`grid ${cols} gap-3 px-5 ${compact ? 'pt-4 pb-3' : 'p-5'}`}>
        {card.options.map((o) => {
          const on = o.id === chosen
          const Icon = OPTION_ICONS[o.icon]
          const from = o.tactics ? Math.min(...o.tactics.map((t) => t.cost)) : o.cost
          const to = o.tactics ? Math.max(...o.tactics.map((t) => t.cost)) : o.cost
          return (
            <button
              key={o.id}
              data-option={o.id}
              onClick={() => choose(id, o.id)}
              className={`group relative flex flex-col text-left rounded-[20px] border-2 transition-all duration-300 ease-(--ease-game) ${compact ? 'h-[100px] p-3' : 'h-[300px] p-3.5'} ${
                on
                  ? 'bg-white border-brand-500 shadow-[0_14px_28px_-12px_rgba(29,95,224,0.6)] -translate-y-1'
                  : 'bg-white/70 border-transparent hover:bg-white hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              {on && (
                <span className="absolute -top-2.5 -right-2.5 grid place-items-center size-8 rounded-full bg-brand-500 text-white ring-4 ring-white">
                  <Check size={17} strokeWidth={3} />
                </span>
              )}
              <span className={`flex ${compact ? 'items-center gap-2.5' : 'flex-col'}`}>
                <span
                  className={`shrink-0 grid place-items-center rounded-2xl transition-colors ${compact ? (tight ? 'size-8 rounded-xl' : 'size-10') : 'size-14 mb-3'} ${on ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}
                >
                  <Icon size={tight ? 17 : compact ? 21 : 28} strokeWidth={2.4} />
                </span>
                <span className={`font-display font-semibold leading-tight text-navy-900 ${compact ? `whitespace-nowrap ${tight ? 'text-[14.5px]' : 'text-[16px]'}` : 'text-[18px]'}`}>{o.label}</span>
              </span>
              {!compact && <span className="text-[13px] leading-snug text-navy-700/80 mt-1.5 flex-1">{o.blurb}</span>}
              {!compact && (
                <span className="mt-2 pt-2.5 border-t border-brand-100">
                  <ImpactRow impact={o.impact} />
                </span>
              )}
              <span className={`flex items-center gap-1.5 ${compact ? 'mt-auto' : 'mt-2'}`}>
                {o.tactics ? (
                  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] ${to ? 'bg-gold-300/50 text-navy-900' : 'bg-navy-900/5 text-navy-700/60'}`}>
                    <Coins size={12} /> {to === 0 ? 'ไม่ใช้งบ' : `${from === to ? from : `${from}–${to}`} ${tight ? 'ล้าน' : 'ล้านบาท'}`}
                    {!tight && ` · ${o.tactics.length} วิธี`}
                  </span>
                ) : (
                  <CostChip cost={o.cost} />
                )}
              </span>
            </button>
          )
        })}
      </div>
      {tactics && chosenOption && <TacticRow card={id} stanceLabel={chosenOption.label} tactics={tactics} />}
    </section>
  )
}
