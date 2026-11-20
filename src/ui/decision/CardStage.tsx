import { BadgeCheck, Building2, Check, Clock, Coins, Hourglass, Sparkles } from 'lucide-react'
import { choiceKey, forecastCard, type Delta } from '../../game/choiceForecast'
import { ForecastNumbers } from './ForecastNumbers'
import { HeaderChip, StageHeader } from './StageHeader'
import { useDraft } from './useDraft'
import { useMemo } from 'react'
import { forecastPricing } from '../../game/forecast'
import { moodOfStatus, portraitKey } from '../../assets/portraits'
import { CARD_BY_ID } from '../../game/decisions/cards'
import { choiceImpact, keptPlan, tacticOf } from '../../game/decisions/plan'
import { isInvestment, OPS, tempActive } from '../../game/sim/ops'
import type { DecisionId, Impact, Tactic } from '../../game/decisions/types'
import { LOCATION_BY_ID } from '../../game/data/locations'
import { MODULES } from '../../game/data/modules'
import { locationStatus } from '../../game/selectors'
import { useGameStore } from '../../store/useGameStore'
import { BUILDINGS, PANEL_ART } from '../../world/layout'
import { ImpactArrows } from './ImpactArrows'
import { AXES, DURATION_LABEL, OPTION_ICONS, SPEED_LABEL } from './visuals'
import { splitTerms } from '../../game/glossary'
import { Glossed } from '../glossary/Term'

export function ImpactRow({ impact, size = 14 }: { impact: Impact; size?: number }) {
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

export function CostChip({ cost }: { cost: number }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] ${cost ? 'bg-gold-300/50 text-navy-900' : 'bg-navy-900/5 text-navy-700/60'}`}>
      <Coins size={12} /> {cost ? `${cost} ล้านบาท` : 'ไม่ใช้งบ'}
    </span>
  )
}

/** Layer 2: how to carry out the chosen stance. */
function TacticRow({ card, stanceLabel, tactics, skip, locked, fc }: { card: DecisionId; stanceLabel: string; tactics: Tactic[]; skip: string[]; locked: boolean; fc: Record<string, Delta> }) {
  const plan = useGameStore((s) => s.plan)
  const ops = useGameStore((s) => s.game.sim.ops)
  const q = useGameStore((s) => s.game.quarter.index)
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
          // engine numbers for this tactic (arrows read from the same numbers)
          const f = fc[choiceKey({ option: plan[card].option, tactic: t.id })]
          const impact = f?.arrows ?? choiceImpact({ ...plan, [card]: { ...plan[card], tactic: t.id } }, card)
          return (
            <button
              key={t.id}
              data-tactic={t.id}
              onClick={() => !locked && chooseTactic(card, t.id)}
              disabled={locked && !on}
              className={`relative flex flex-col text-left rounded-[18px] p-3.5 h-[318px] disabled:opacity-50 border-2 transition-all duration-300 ease-(--ease-game) ${
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
                <span className="font-display font-semibold text-[15.5px] leading-tight text-navy-900"><Glossed text={t.label} skip={skip} /></span>
              </span>
              <span className="text-[12.5px] leading-snug text-navy-700/85 mt-2 flex-1"><Glossed text={t.blurb} skip={skip} /></span>
              <span className="flex flex-wrap gap-1 mt-1.5">
                {t.recommended && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-300/60 text-navy-900 px-2 py-0.5 text-[11px] font-medium">
                    <Sparkles size={11} /> แนะนำ
                  </span>
                )}
                <OpsBadge id={t.id} owned={ops.owned} active={tempActive(ops, t.id, q) ? Math.max(...ops.temps.filter((x) => x.source === t.id).map((x) => x.until)) - q + 1 : 0} />
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
                <CostChip cost={isInvestment(t.id) && ops.owned[t.id] !== undefined ? 0 : t.cost} />
              </span>
              <span className="mt-1.5 pt-1.5 border-t border-brand-100">
                <ForecastNumbers d={f} compact />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Engine v3 status of a tactic: lasting investment (owned or not) or a temporary measure still running. */
export function OpsBadge({ id, owned, active }: { id: string; owned: Partial<Record<string, number>>; active: number }) {
  if (isInvestment(id)) {
    const inv = OPS.investments[id]
    return owned[id] !== undefined ? (
      <span data-owned={id} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-medium">
        <BadgeCheck size={11} /> มีแล้ว · ค่าดูแล {inv.maintenanceMB} ล้าน/ไตรมาส
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-800 px-2 py-0.5 text-[11px]">
        <Building2 size={11} /> ลงทุนครั้งเดียว · ดูแล {inv.maintenanceMB} ล้าน/ไตรมาส
      </span>
    )
  }
  if (active > 0)
    return (
      <span data-temp-active={id} className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-medium">
        <Hourglass size={11} /> ใช้อยู่ เหลือ {active} ไตรมาส · เลือกซ้ำไม่เพิ่มกำลัง
      </span>
    )
  return null
}

/** Engine estimate for every price stance vs holding (calm run: no flood, no surprises). */
function PriceForecastStrip({ cols }: { cols: string }) {
  const game = useGameStore((s) => s.game)
  const plan = useGameStore((s) => s.plan)
  const responses = useGameStore((s) => s.responses)
  const channels = useGameStore((s) => s.channels)
  const fc = useMemo(() => forecastPricing(game, plan, responses, channels), [game, plan, responses, channels])
  const pts = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v * 100).toFixed(1)}`
  const tone = (v: number, good: number) => (Math.abs(v) < 0.0005 ? 'text-navy-700/55' : v * good > 0 ? 'text-emerald-700' : 'text-red-700')
  return (
    <div className="px-5 pb-3" data-price-forecast>
      <div className="text-[11.5px] text-brand-600 font-medium mb-1">ประมาณการเทียบกับคงราคา (ไม่นับเหตุการณ์ไม่คาดคิด)</div>
      <div className={`grid ${cols} gap-3`}>
        {fc.map((f) => (
          <div key={f.option} data-forecast-option={f.option} className="rounded-xl bg-brand-50/80 px-2.5 py-1.5 text-[11.5px] leading-snug text-navy-800">
            {f.option === 'hold' ? (
              <div className="text-navy-700/60">จุดอ้างอิง</div>
            ) : (
              <>
                <div className="flex justify-between gap-1">
                  <span>ส่วนแบ่ง</span>
                  <span className={`tabular-nums font-medium ${tone(f.dShare, 1)}`}>{pts(f.dShare)} จุด</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span>เบี้ย/ไตรมาส</span>
                  <span className={`tabular-nums font-medium ${tone(f.dGwp, 1)}`}>
                    {f.dGwp >= 0 ? '+' : '−'}
                    {Math.abs(Math.round(f.dGwp)).toLocaleString('th-TH')} ล้าน
                  </span>
                </div>
                <div className="flex justify-between gap-1" title="Loss Ratio หลังอัตราใหม่มีผลเต็มที่ ราว 3 ไตรมาส">
                  <span>LR เต็มผล</span>
                  <span className={`tabular-nums font-medium ${tone(f.dLossRatioFull, -1)}`}>{pts(f.dLossRatioFull)} จุด</span>
                </div>
              </>
            )}
            {f.gapAfter > 0.04 && <div className="mt-0.5 text-[11px] text-amber-800">แพงกว่าตลาด {Math.round(f.gapAfter * 100)}% ลูกค้าดีอาจย้ายออก</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

/** The active strategy card: building, question, stances, and (when the stance has them) tactics. */
export function CardStage() {
  const id = useGameStore((s) => s.ui.activeCard) as DecisionId
  const chosen = useGameStore((s) => s.plan[id].option)
  const chooseRaw = useGameStore((s) => s.choose)
  const qIndex = useGameStore((s) => s.game.quarter.index)
  // reinsurance is a yearly treaty: only the first quarter of each year can change it
  const locked = id === 'reinsurance' && qIndex % 4 !== 0
  const choose = (card: DecisionId, option: string) => !locked && chooseRaw(card, option)
  const card = CARD_BY_ID[id]
  const loc = LOCATION_BY_ID[card.location]
  // a term already explained in the card title gets no second "?" below it
  const inTitle = splitTerms(card.title).flatMap((p) => ('id' in p ? [p.id] : []))
  const game = useGameStore((s) => s.game)
  const head = portraitKey(card.location, moodOfStatus(locationStatus(game, card.location)))
  const chosenOption = card.options.find((o) => o.id === chosen)
  const draft = useDraft()
  const fc = useMemo(() => forecastCard(game, draft, id), [game, draft, id])
  const keptChoice = keptPlan(game)[id]
  const keptOpt = card.options.find((o) => o.id === keptChoice.option)
  const keptTac = keptOpt?.tactics?.find((t) => t.id === keptChoice.tactic)
  const keptLabel = keptTac ? `${keptOpt!.label} · ${keptTac.label}` : (keptOpt?.label ?? '')
  const tactics = chosenOption?.tactics
  const compact = !!tactics
  const cols = card.options.length >= 5 ? 'grid-cols-5' : card.options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
  const tight = compact && card.options.length >= 5 // five compact tiles: smaller icon, shorter cost chip

  return (
    <section key={id} className="absolute left-[calc(352px+max(0px,100%-1600px)*0.15)] right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[calc(100%-172px-150px)] glass rounded-[28px] overflow-x-hidden overflow-y-auto pointer-events-auto anim-rise">
      <StageHeader
        art={PANEL_ART[card.location] ?? BUILDINGS[card.location].sprite}
        kicker={`${loc.en} · ${loc.th}`}
        title={<Glossed text={card.title} />}
        subtitle={<Glossed text={card.question} skip={inTitle} />}
        chips={card.modules.map((m) => (
          <HeaderChip key={m}>{MODULES[m].en}</HeaderChip>
        ))}
        head={head}
        compact={compact}
      />
      <div data-kept-note className={`mx-5 mt-3 rounded-xl px-3 py-1.5 text-[12.5px] ${locked ? 'bg-amber-50 text-amber-900' : 'bg-brand-50 text-brand-700'}`}>
        {locked
          ? `สัญญาประกันภัยต่อเป็นรายปี ปีนี้ใช้ "${keptLabel}" · เปลี่ยนได้ในห้องตัดสินใจไตรมาส 1 ของปีหน้า`
          : `ค่าที่เลือกใช้ต่อทุกไตรมาสจนกว่าจะเปลี่ยน · ตอนนี้บริษัทใช้ "${keptLabel}"`}
      </div>
      <div className={`grid ${cols} gap-3 px-5 ${compact ? 'pt-3 pb-3' : 'p-5 pt-3'}`}>
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
              disabled={locked && !on}
              className={`group relative flex flex-col text-left rounded-[20px] border-2 disabled:opacity-50 transition-all duration-300 ease-(--ease-game) ${compact ? 'h-[100px] p-3' : 'h-[360px] p-3.5'} ${
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
                <span className={`font-display font-semibold leading-tight text-navy-900 ${compact ? `whitespace-nowrap ${tight ? 'text-[14.5px]' : 'text-[16px]'}` : 'text-[18px]'}`}><Glossed text={o.label} skip={inTitle} /></span>
              </span>
              {!compact && <span className="text-[13px] leading-snug text-navy-700/80 mt-1.5 flex-1"><Glossed text={o.blurb} skip={inTitle} /></span>}
              {!compact && (
                <span className="mt-2 pt-2.5 border-t border-brand-100">
                  <ImpactRow impact={fc[o.id]?.arrows ?? o.impact} />
                </span>
              )}
              {!compact && (
                <span className="mt-1.5">
                  <ForecastNumbers d={fc[o.id]} compact />
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
      {id === 'pricing' && <PriceForecastStrip cols={cols} />}
      {tactics && chosenOption && <TacticRow card={id} stanceLabel={chosenOption.label} tactics={tactics} skip={inTitle} locked={locked} fc={fc} />}
    </section>
  )
}
