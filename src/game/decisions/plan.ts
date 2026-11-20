import { capitalHealth, capitalWarning } from '../capital'
import { isInvestment } from '../sim/ops'
import { systemSpendPreview } from '../sim/systems'
import { P } from '../sim/params'
import type { GameState } from '../types'
import { CARD_BY_ID, CARDS, defaultPlan, QUARTER_BUDGET_MB } from './cards'
import { responseOf, scenariosFor, SCENARIOS, type Responses } from './scenarios'
import type { DecisionId, Impact, ImpactAxis, QuarterPlan } from './types'

/**
 * Pure plan helpers — no React. Phase 4's simulation engine will consume the same
 * QuarterPlan; these functions only PREVIEW direction for the player.
 */

export function optionOf(plan: QuarterPlan, id: DecisionId) {
  const card = CARD_BY_ID[id]
  return card.options.find((o) => o.id === plan[id]?.option) ?? card.options.find((o) => o.id === card.defaultOption)!
}

/** The chosen tactic, if the chosen stance has tactics (falls back to the recommended one). */
export function tacticOf(plan: QuarterPlan, id: DecisionId) {
  const o = optionOf(plan, id)
  if (!o.tactics) return undefined
  return o.tactics.find((t) => t.id === plan[id]?.tactic) ?? o.tactics.find((t) => t.recommended) ?? o.tactics[0]
}

/** Stance impact plus the tactic's modifier. */
export function choiceImpact(plan: QuarterPlan, id: DecisionId): Impact {
  const base = optionOf(plan, id).impact
  const mod = tacticOf(plan, id)?.impact ?? {}
  return { growth: base.growth + (mod.growth ?? 0), profit: base.profit + (mod.profit ?? 0), risk: base.risk + (mod.risk ?? 0), cx: base.cx + (mod.cx ?? 0) }
}

/** What the company already owns (lasting investments): those cost nothing the second time. */
export type Owned = Partial<Record<string, number>>

export function choiceCost(plan: QuarterPlan, id: DecisionId, owned: Owned = {}) {
  const t = tacticOf(plan, id)
  if (t && isInvestment(t.id) && owned[t.id] !== undefined) return 0
  return t?.cost ?? optionOf(plan, id).cost
}

/** Spend on event responses (step 1). Shares the quarter budget with the strategy cards. */
export function responsesCost(responses: Responses = {}, owned: Owned = {}) {
  return SCENARIOS.reduce((s, sc) => {
    const r = responseOf(responses, sc.eventId)
    return s + (r && !(isInvestment(r.id) && owned[r.id] !== undefined) ? r.cost : 0)
  }, 0)
}

export function planCost(plan: QuarterPlan, responses: Responses = {}, owned: Owned = {}) {
  return CARDS.reduce((s, c) => s + choiceCost(plan, c.id, owned), 0) + responsesCost(responses, owned)
}

/** Strategy budget this quarter (engine v3): 7.5% of last quarter's earned premium, in steps of 5 MB. */
export function budgetOf(s: GameState) {
  const ep = s.lastReport?.earnedPremium ?? s.kpis.marketShare * s.sim.marketGwp
  return Math.max(50, Math.round((P.budgetOfEarnedPremium * ep) / 5) * 5)
}

export function budgetLeft(plan: QuarterPlan, responses: Responses = {}, owned: Owned = {}, budget: number = QUARTER_BUDGET_MB, extra = 0) {
  return budget - planCost(plan, responses, owned) - extra
}

/** Everything this quarter's plan spends from the budget: cards, responses, and system build installments. */
export function budgetUsed(s: GameState, plan: QuarterPlan, responses: Responses = {}, orders: string[] = []) {
  return Math.round((planCost(plan, responses, s.sim.ops.owned) + systemSpendPreview(s.sim.ops.systems, orders)) * 10) / 10
}

/** Events this quarter that still need a response. */
export function unansweredEvents(s: GameState, responses: Responses) {
  return scenariosFor(s.events.map((e) => e.id)).filter((sc) => !responses[sc.eventId]).map((sc) => sc.eventId)
}

/**
 * The plan a new quarter opens with: every card keeps what the company is doing now (engine v3).
 * Price moves and the old distribution push are one-off actions, so they start from "no change".
 */
export function keptPlan(s: GameState): QuarterPlan {
  const base = defaultPlan()
  const kept = s.sim.settings ?? base
  return { ...base, ...kept, pricing: base.pricing, distribution: base.distribution }
}

/** Cards the player changed this quarter, against what the company is doing now (or the game start). */
/** The settings the company had before the quarter just played (for "what did I change" after the fact). */
export function keptBefore(s: GameState): QuarterPlan | undefined {
  const prev = s.sim.log[s.sim.log.length - 2]
  if (!prev) return undefined
  return Object.fromEntries(prev.choices.map((c) => [c.card, { option: c.option, tactic: c.tactic }])) as QuarterPlan
}

export function changedCards(plan: QuarterPlan, kept?: QuarterPlan): DecisionId[] {
  return CARDS.filter((c) => {
    const k = kept?.[c.id] ?? { option: c.defaultOption }
    return plan[c.id].option !== k.option || (kept ? (plan[c.id].tactic ?? null) !== (k.tactic ?? null) && plan[c.id].option !== c.defaultOption : false)
  }).map((c) => c.id)
}

const AXES: ImpactAxis[] = ['growth', 'profit', 'risk', 'cx']

/** Summed direction per axis, clamped to -3…+3 for display. */
export function previewImpact(plan: QuarterPlan, responses: Responses = {}): Impact {
  const sum: Impact = { growth: 0, profit: 0, risk: 0, cx: 0 }
  for (const c of CARDS) {
    const i = choiceImpact(plan, c.id)
    for (const a of AXES) sum[a] += i[a]
  }
  for (const sc of SCENARIOS) {
    const r = responseOf(responses, sc.eventId)
    if (r) for (const a of AXES) sum[a] += r.impact[a]
  }
  for (const a of AXES) sum[a] = Math.max(-3, Math.min(3, sum[a]))
  return sum
}

export interface AdvisorNote {
  id: string
  tone: 'warning' | 'tip'
  text: string
  cards: DecisionId[] // which cards the note is about; the advisor shows notes for the open card first
}

/**
 * Advisor checks for plans that fight themselves or ignore this quarter's events.
 * Narrative only — never changes numbers.
 */
export function reviewPlan(plan: QuarterPlan, s: GameState, responses: Responses = {}): AdvisorNote[] {
  const notes: AdvisorNote[] = []
  const has = (id: string) => s.events.some((e) => e.id === id)
  const p = Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, v.option])) as Record<DecisionId, string>
  const t = (id: DecisionId) => tacticOf(plan, id)?.id

  const left = budgetLeft(plan, responses, s.sim.ops.owned, budgetOf(s), systemSpendPreview(s.sim.ops.systems))
  const r = (eventId: string) => responses[eventId]
  // engine v3: fixed cost does not shrink with the book; flag it once it eats more than 12% of premium
  const lr = s.lastReport
  if (lr?.ops) {
    const share = lr.ops.costs.fixed / lr.earnedPremium
    if (share > 0.12) {
      const idle = (['claims', 'contact'] as const).filter((t) => lr.ops.demand[t] / lr.ops.capacity[t] < 0.8)
      notes.push({
        id: 'fixed-cost',
        tone: 'warning',
        text: `ต้นทุนคงที่กิน ${Math.round(share * 100)}% ของเบี้ยแล้ว (${Math.round(lr.ops.costs.fixed)} ล้านต่อไตรมาส) เพราะพอร์ตเล็กลงแต่ค่าคนและค่าสำนักงานยังเท่าเดิม${idle.length ? ` ทีม${idle.map((t) => (t === 'claims' ? 'สินไหม' : ' call center')).join(' และ')}ใช้กำลังไม่ถึง 80% ลองลดคนที่หน้าทีมงาน` : ''} หรือเร่งยอดขายให้กลับมาค่ะ`,
        cards: [],
      })
    }
  }
  if (left < 0) notes.push({ id: 'budget', tone: 'warning', text: `แผนนี้ใช้งบเกินไป ${-left} ล้านบาท ต้องลดบางรายการก่อนยืนยันค่ะ` , cards: [] })
  if ((p.pricing === 'cut2' || p.pricing === 'cut1') && p.underwriting === 'broad')
    notes.push({ id: 'cut+broad', tone: 'warning', text: 'ลดราคาพร้อมเปิดรับลูกค้ากว้าง จะได้ลูกค้าเสี่ยงสูงในราคาถูก Loss Ratio อาจพุ่งค่ะ' , cards: ['pricing', 'underwriting'] })
  if (has('flood-central') && (p.reinsurance === 'retain' || p.catExposure === 'grow'))
    notes.push({ id: 'flood', tone: 'warning', text: 'ไตรมาสนี้มีความเสี่ยงน้ำท่วมภาคกลาง การรับความเสี่ยงเองหรือขยายพื้นที่เสี่ยงตอนนี้อันตรายมากค่ะ' , cards: ['reinsurance', 'catExposure'] })
  if (has('flood-central') && p.reinsurance === 'keep' && p.catExposure !== 'reduce' && s.quarter.index % 4 === 0)
    notes.push({ id: 'flood-tip', tone: 'tip', text: 'มีสัญญาณน้ำท่วม ลองพิจารณาซื้อ reinsurance เพิ่มดูนะคะ' , cards: ['reinsurance', 'catExposure'] })
  if (has('rival-promo') && p.pricing === 'cut2')
    notes.push({ id: 'pricewar', tone: 'warning', text: 'ลดราคาเชิงรุกสู้ Super Save อาจกลายเป็นสงครามราคา ทั้งตลาดเสียกำไรค่ะ' , cards: ['pricing'] })
  if (has('rival-promo') && p.pricing === 'hold' && p.marketing !== 'campaign' && p.distribution !== 'dealer')
    notes.push({ id: 'rival-tip', tone: 'tip', text: 'คู่แข่งกำลังบุกช่องทางดีลเลอร์ ถ้าไม่อยากลดราคา แคมเปญการตลาดหรือดันดีลเลอร์ช่วยรักษาส่วนแบ่งได้ค่ะ' , cards: ['pricing', 'marketing', 'distribution'] })
  if (p.repair === 'costCut' && p.pricing.startsWith('raise'))
    notes.push({ id: 'squeeze', tone: 'warning', text: 'ขึ้นราคาแต่ลดคุณภาพอู่ ลูกค้าจะรู้สึกว่าจ่ายแพงขึ้นแต่ได้บริการแย่ลงค่ะ' , cards: ['repair', 'pricing'] })
  if (has('ev-growth') && (p.repair === 'ev' || p.distribution === 'dealer'))
    notes.push({ id: 'ev-tip', tone: 'tip', text: 'ดีค่ะ แผนนี้รับกระแส EV ที่กำลังโต' , cards: ['repair', 'distribution'] })
  if (p.marketing === 'save' && p.pricing.startsWith('raise'))
    notes.push({ id: 'fade', tone: 'warning', text: 'ทั้งขึ้นราคาและลดการตลาด ส่วนแบ่งตลาดอาจหลุดเร็วกว่าที่คิดค่ะ' , cards: ['marketing', 'pricing'] })
  if (t('marketing') === 'ambassador' && left >= 0 && left < 20)
    notes.push({ id: 'ambassador-budget', tone: 'tip', text: 'จ้าง Brand Ambassador แล้วงบเหลือน้อยมาก ถ้าต้องรับมือเรื่องอื่นจะไม่มีเงินเหลือนะคะ' , cards: ['marketing'] })
  if (t('marketing') === 'cutTeam' && has('rival-promo'))
    notes.push({ id: 'cut-team', tone: 'warning', text: 'คู่แข่งกำลังบุก ถ้าลดคนในทีมการตลาดตอนนี้ ไตรมาสหน้าเราจะตอบโต้ได้ช้าค่ะ' , cards: ['marketing'] })
  if (t('marketing') === 'sponsor' && has('rival-promo'))
    notes.push({ id: 'sponsor-slow', tone: 'tip', text: 'สปอนเซอร์ช่วยเรื่องความผูกพันกับลูกค้า แต่เห็นผลช้า อาจไม่ทันรับมือโปรโมชันของ Super Save ค่ะ' , cards: ['marketing'] })
  if (has('flood-central') && t('reinsurance') === 'catXL')
    notes.push({ id: 'catxl-flood', tone: 'tip', text: 'Cat XL ตรงกับความเสี่ยงน้ำท่วมไตรมาสนี้พอดี และถูกกว่า Quota share ค่ะ', cards: ['reinsurance'] })
  if (has('flood-central') && t('catExposure') === 'lowlandGap')
    notes.push({ id: 'lowland-flood', tone: 'warning', text: 'รับงานพื้นที่ลุ่มตอนที่มีสัญญาณน้ำท่วม เคลมอาจเข้าพร้อมกันจำนวนมากค่ะ', cards: ['catExposure'] })
  if (t('repair') === 'nonOEM')
    notes.push({ id: 'non-oem', tone: 'warning', text: 'อะไหล่เทียบแท้ประหยัดก็จริง แต่ระวังลูกค้าร้องเรียน และต้องแจ้งลูกค้าให้ชัดเจนค่ะ', cards: ['repair'] })
  if (t('pricing') === 'dealerPromo' && has('rival-promo'))
    notes.push({ id: 'dealer-promo', tone: 'tip', text: 'ตอบโต้ Super Save ตรงช่องทางดีลเลอร์ ไม่ต้องลดราคาทั้งพอร์ตค่ะ', cards: ['pricing'] })
  // event responses × strategy
  if (r('flood-central') === 'monitor' && p.reinsurance === 'retain')
    notes.push({ id: 'flood-exposed', tone: 'warning', text: 'เฝ้าดูน้ำท่วมเฉยๆ แถมรับความเสี่ยงเองด้วย ถ้าน้ำมาจริงเราจะเจ็บหนักที่สุดในตลาดค่ะ', cards: ['reinsurance'] })
  if (r('rival-promo') === 'matchPromo' && (p.pricing === 'cut2' || p.pricing === 'cut1'))
    notes.push({ id: 'double-discount', tone: 'warning', text: 'ลดราคาทั้งพอร์ตแล้วยังจัดโปรที่โชว์รูมซ้ำอีก กลายเป็นลดสองต่อ กำไรหายเร็วมากค่ะ', cards: ['pricing'] })
  if (r('ev-growth') === 'launchCover' && t('repair') === 'ev')
    notes.push({ id: 'ev-synergy', tone: 'tip', text: 'ออกความคุ้มครองแบตเตอรี่คู่กับลงทุนอู่ EV สอดคล้องกันดีค่ะ คุมค่าซ่อมได้เอง', cards: ['repair'] })
  if (r('rival-promo') === 'valueAdd' && p.repair === 'costCut')
    notes.push({ id: 'value-vs-cut', tone: 'warning', text: 'สัญญาบริการเสริมกับลูกค้า แต่ไปลดคุณภาพอู่ ลูกค้าจะรู้สึกว่าเราพูดไม่ตรงกับที่ทำค่ะ', cards: ['repair'] })
  // capital last: notes about the card on screen lead, the capital warning covers everything else
  const health = capitalHealth(s)
  if (health.level !== 'safe') {
    const spend = planCost(plan, responses)
    notes.push({
      id: 'capital',
      tone: health.level === 'danger' ? 'warning' : 'tip',
      text: `${capitalWarning(health)} แผนนี้ใช้งบ ${spend} ล้านบาท${health.level === 'danger' ? ' ควรเลือกทางที่ลดขาดทุนและลดความเสี่ยงก่อน' : ''}`,
      cards: [],
    })
  }
  return notes
}
