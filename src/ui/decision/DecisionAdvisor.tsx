import { AlertTriangle, Lightbulb, Sparkles } from 'lucide-react'
import { portraitKey } from '../../assets/portraits'
import { spriteUrl } from '../../assets/registry'
import { ADVISOR_NAME } from '../../game/narrative/advisor'
import { CARD_BY_ID } from '../../game/decisions/cards'
import { reviewPlan, unansweredEvents } from '../../game/decisions/plan'
import { responseOf, SCENARIO_BY_EVENT } from '../../game/decisions/scenarios'
import { useEffect, useMemo, useRef } from 'react'
import { play } from '../../audio/sfx'
import { capitalHealth } from '../../game/capital'
import { priceSensitivityFor } from '../../game/sim/init'
import { RENEWAL_PRICE_K, SEG_PRICE_STEPS, SEGMENT_IDS } from '../../game/sim/v2'
import type { DecisionId } from '../../game/decisions/types'
import { capacityWarning } from '../../game/forecast'
import { useGameStore } from '../../store/useGameStore'
import { Glossed } from '../glossary/Term'

/** Advisor reacts to the plan as it changes: warnings first, then tips, then card guidance. */
/** quarter the capital-danger cue last played in (once per quarter, not on every visit) */
let dangerPlayedFor = -1

export function DecisionAdvisor() {
  const plan = useGameStore((s) => s.plan)
  const game = useGameStore((s) => s.game)
  const responses = useGameStore((s) => s.responses)
  const step = useGameStore((s) => s.ui.step)
  const activeCard = useGameStore((s) => s.ui.activeCard)
  const activeEvent = useGameStore((s) => s.ui.activeEvent)
  const channels = useGameStore((s) => s.channels)
  const segSteps = useGameStore((s) => s.segSteps)
  // forecast overload of the draft plan (calm engine run) joins the plan checks as a warning
  const staff = useGameStore((s) => s.staff)
  const cap = useMemo(() => capacityWarning(game, plan, responses, channels, segSteps, staff), [game, plan, responses, channels, segSteps, staff])
  // overload is the costliest surprise, so it leads the warnings
  // quality pricing: a rise on a poorly rated service drives customers away faster
  const sat = game.kpis.satisfaction
  const raising = Object.values(segSteps).some((x) => x > 2)
  const quality = sat < 3.6 && raising ? [{ id: 'raise-low-quality', tone: 'warning' as const, text: `ลูกค้าพอใจแค่ ${sat.toFixed(1)} ดาว ถ้าขึ้นราคาตอนนี้ลูกค้าจะย้ายมากกว่าปกติ ควรยกระดับบริการก่อนค่อยขึ้นราคาค่ะ`, cards: ['pricing'] as DecisionId[] }] : []
  // Q4: renewing customers will meet this year's price change; warn with the expected effect
  const renewalNote = (() => {
    if (game.quarter.index % 4 !== 3 || game.quarter.index + 1 >= game.config.quarters) return []
    const mix = game.lastReport?.v2.portfolio
    const draft = mix ? SEGMENT_IDS.reduce((a, k) => a + mix[k] * SEG_PRICE_STEPS[segSteps[k]], 0) : 0
    const change = (game.sim.player.price * (1 + draft)) / (game.sim.v2.lastRenewalPrice ?? 1) - 1
    if (change < 0.01) return []
    const pts = RENEWAL_PRICE_K * change * priceSensitivityFor(sat) * 100
    return [
      {
        id: 'renewal-price',
        tone: (pts >= 2 ? 'warning' : 'tip') as 'warning' | 'tip',
        text: `ปีนี้ราคาขึ้นรวม ${(change * 100).toFixed(1)}% ลูกค้าเดิมจะเจอราคานี้ตอนต่ออายุหลังจบไตรมาสนี้ ด้วยความพอใจ ${sat.toFixed(1)} ดาว คาดว่าอัตราต่ออายุลดราว ${pts.toFixed(1)} จุด ${sat < 4 ? 'ยกระดับบริการก่อนสิ้นปีจะช่วยได้ค่ะ' : 'ลูกค้าพอใจสูง รับได้ค่อนข้างดีค่ะ'}`,
        cards: ['pricing'] as DecisionId[],
      },
    ]
  })()
  const notes = [...(cap ? [{ id: 'capacity', tone: 'warning' as const, text: cap, cards: ['pricing', 'distribution', 'repair'] as DecisionId[] }] : []), ...quality, ...renewalNote, ...reviewPlan(plan, game, responses)]
  // what the player is looking at decides which note leads
  const focus: string[] =
    step === 'strategy' ? [activeCard === 'staff' ? 'repair' : activeCard] : step === 'scenario' && activeEvent ? (responseOf(responses, activeEvent)?.related ?? []) : []
  const warnings = notes.filter((n) => n.tone === 'warning')
  const tips = notes.filter((n) => n.tone === 'tip')
  // cues: a new warning (two notes down), a new tip (soft ding), capital in danger (three low notes, once a quarter)
  const counts = useRef({ w: warnings.length, t: tips.length })
  useEffect(() => {
    const was = counts.current
    if (warnings.length > was.w) play('warning')
    else if (tips.length > was.t && !warnings.length) play('tip')
    counts.current = { w: warnings.length, t: tips.length }
  }, [warnings.length, tips.length])
  const danger = capitalHealth(game).level === 'danger'
  const qi = game.quarter.index
  useEffect(() => {
    if (danger && dangerPlayedFor !== qi) {
      dangerPlayedFor = qi
      play('danger')
    }
  }, [danger, qi])
  const about = (n: { cards: string[] }) => n.cards.length === 0 || n.cards.some((c) => focus.includes(c))
  const lead = warnings.find(about) ?? tips.find(about) ?? warnings[0] ?? tips[0]
  const pending = unansweredEvents(game, responses).length
  const pose = warnings.length ? 'characters/advisor-warning' : tips.length ? 'characters/advisor' : 'characters/advisor-happy'
  const bust = portraitKey('advisor', warnings.length ? 'shocked' : tips.length ? 'normal' : 'happy')
  const sc = activeEvent ? SCENARIO_BY_EVENT[activeEvent] : undefined
  const text =
    step === 'scenario' && sc && !responses[sc.eventId]
      ? `${sc.question} — แต่ละทางใช้งบจากก้อนเดียวกับกลยุทธ์นะคะ`
      : step === 'confirm' && !lead
        ? pending
          ? `ยังเหลือเหตุการณ์ที่ต้องตอบอีก ${pending} เรื่องค่ะ`
          : 'แผนไม่มีจุดขัดกันเองค่ะ พร้อมยืนยันได้เลย'
        : (lead?.text ?? (activeCard === 'staff' ? 'ทีมงานค้างไว้ทุกไตรมาส ดูภาระงานไตรมาสหน้าก่อนรับหรือลดคนนะคะ' : `${CARD_BY_ID[activeCard].question} — เลือกได้เลยค่ะ ถ้าแผนขัดกันเองหนูจะเตือน`))
  return (
    <div className="absolute left-4 bottom-3 flex items-end pointer-events-auto">
      {bust ? (
        <img key={bust} src={spriteUrl(bust)} alt={ADVISOR_NAME} data-portrait={bust} className="relative z-10 -mb-3 h-[160px] w-[140px] object-contain object-bottom drop-shadow-[0_14px_20px_rgba(8,26,66,0.45)] anim-rise" />
      ) : (
        <img key={pose} src={spriteUrl(pose)} alt={ADVISOR_NAME} className="relative z-10 h-[200px] w-[110px] object-contain object-bottom drop-shadow-[0_14px_20px_rgba(8,26,66,0.45)] anim-rise" />
      )}
      <div data-advisor-bubble className="relative -ml-4 mb-4 w-[800px] glass rounded-[24px] pl-7 pr-5 py-3 anim-rise">
        <span className="absolute -left-2 bottom-8 size-5 rotate-45 bg-white" />
        <div className="flex items-center gap-2 font-display font-semibold text-brand-600 text-[15px]">
          <span className="grid place-items-center size-6 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-white">
            <Sparkles size={13} />
          </span>
          AI Business Advisor
          {warnings.length > 0 && <span className="ml-1 inline-flex items-center gap-1 text-[12px] font-medium text-alert"><AlertTriangle size={13} /> {warnings.length} ข้อควรระวัง</span>}
          {tips.length > 0 && <span className="inline-flex items-center gap-1 text-[12px] font-medium text-chance"><Lightbulb size={13} /> {tips.length} คำแนะนำ</span>}
        </div>
        <p className="mt-1 text-[16px] leading-relaxed text-navy-900 line-clamp-3" title={text}><Glossed text={text} /></p>
      </div>
    </div>
  )
}
