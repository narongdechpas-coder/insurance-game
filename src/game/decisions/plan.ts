import type { GameState } from '../types'
import { CARD_BY_ID, CARDS, QUARTER_BUDGET_MB } from './cards'
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

export function choiceCost(plan: QuarterPlan, id: DecisionId) {
  return tacticOf(plan, id)?.cost ?? optionOf(plan, id).cost
}

export function planCost(plan: QuarterPlan) {
  return CARDS.reduce((s, c) => s + choiceCost(plan, c.id), 0)
}

export function budgetLeft(plan: QuarterPlan) {
  return QUARTER_BUDGET_MB - planCost(plan)
}

export function changedCards(plan: QuarterPlan): DecisionId[] {
  return CARDS.filter((c) => plan[c.id].option !== c.defaultOption).map((c) => c.id)
}

const AXES: ImpactAxis[] = ['growth', 'profit', 'risk', 'cx']

/** Summed direction per axis, clamped to -3…+3 for display. */
export function previewImpact(plan: QuarterPlan): Impact {
  const sum: Impact = { growth: 0, profit: 0, risk: 0, cx: 0 }
  for (const c of CARDS) {
    const i = choiceImpact(plan, c.id)
    for (const a of AXES) sum[a] += i[a]
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
export function reviewPlan(plan: QuarterPlan, s: GameState): AdvisorNote[] {
  const notes: AdvisorNote[] = []
  const has = (id: string) => s.events.some((e) => e.id === id)
  const p = Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, v.option])) as Record<DecisionId, string>
  const t = (id: DecisionId) => tacticOf(plan, id)?.id

  const left = budgetLeft(plan)
  if (left < 0) notes.push({ id: 'budget', tone: 'warning', text: `แผนนี้ใช้งบเกินไป ${-left} ล้านบาท ต้องลดบางรายการก่อนยืนยันค่ะ` , cards: [] })
  if ((p.pricing === 'cut2' || p.pricing === 'cut1') && p.underwriting === 'broad')
    notes.push({ id: 'cut+broad', tone: 'warning', text: 'ลดราคาพร้อมเปิดรับลูกค้ากว้าง จะได้ลูกค้าเสี่ยงสูงในราคาถูก Loss Ratio อาจพุ่งค่ะ' , cards: ['pricing', 'underwriting'] })
  if (has('flood-central') && (p.reinsurance === 'retain' || p.catExposure === 'grow'))
    notes.push({ id: 'flood', tone: 'warning', text: 'ไตรมาสนี้มีความเสี่ยงน้ำท่วมภาคกลาง การรับความเสี่ยงเองหรือขยายพื้นที่เสี่ยงตอนนี้อันตรายมากค่ะ' , cards: ['reinsurance', 'catExposure'] })
  if (has('flood-central') && p.reinsurance === 'keep' && p.catExposure !== 'reduce')
    notes.push({ id: 'flood-tip', tone: 'tip', text: 'มีสัญญาณน้ำท่วม ลองพิจารณาซื้อ reinsurance เพิ่มดูนะคะ' , cards: ['reinsurance', 'catExposure'] })
  if (has('rival-promo') && p.pricing === 'cut2')
    notes.push({ id: 'pricewar', tone: 'warning', text: 'ลดราคาเชิงรุกสู้ Lotus Guard อาจกลายเป็นสงครามราคา ทั้งตลาดเสียกำไรค่ะ' , cards: ['pricing'] })
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
    notes.push({ id: 'sponsor-slow', tone: 'tip', text: 'สปอนเซอร์ช่วยเรื่องความผูกพันกับลูกค้า แต่เห็นผลช้า อาจไม่ทันรับมือโปรโมชันของ Lotus Guard ค่ะ' , cards: ['marketing'] })
  if (has('flood-central') && t('reinsurance') === 'catXL')
    notes.push({ id: 'catxl-flood', tone: 'tip', text: 'Cat XL ตรงกับความเสี่ยงน้ำท่วมไตรมาสนี้พอดี และถูกกว่า Quota share ค่ะ', cards: ['reinsurance'] })
  if (has('flood-central') && t('catExposure') === 'lowlandGap')
    notes.push({ id: 'lowland-flood', tone: 'warning', text: 'รับงานพื้นที่ลุ่มตอนที่มีสัญญาณน้ำท่วม เคลมอาจเข้าพร้อมกันจำนวนมากค่ะ', cards: ['catExposure'] })
  if (t('repair') === 'nonOEM')
    notes.push({ id: 'non-oem', tone: 'warning', text: 'อะไหล่เทียบแท้ประหยัดก็จริง แต่ระวังลูกค้าร้องเรียน และต้องแจ้งลูกค้าให้ชัดเจนค่ะ', cards: ['repair'] })
  if (t('pricing') === 'dealerPromo' && has('rival-promo'))
    notes.push({ id: 'dealer-promo', tone: 'tip', text: 'ตอบโต้ Lotus Guard ตรงช่องทางดีลเลอร์ ไม่ต้องลดราคาทั้งพอร์ตค่ะ', cards: ['pricing'] })
  return notes
}
