import type { GameState } from '../types'
import { CARD_BY_ID, CARDS, QUARTER_BUDGET_MB } from './cards'
import type { DecisionId, Impact, ImpactAxis, QuarterPlan } from './types'

/**
 * Pure plan helpers — no React. Phase 4's simulation engine will consume the same
 * QuarterPlan; these functions only PREVIEW direction for the player.
 */

export function optionOf(plan: QuarterPlan, id: DecisionId) {
  const card = CARD_BY_ID[id]
  return card.options.find((o) => o.id === plan[id]) ?? card.options.find((o) => o.id === card.defaultOption)!
}

export function planCost(plan: QuarterPlan) {
  return CARDS.reduce((s, c) => s + optionOf(plan, c.id).cost, 0)
}

export function budgetLeft(plan: QuarterPlan) {
  return QUARTER_BUDGET_MB - planCost(plan)
}

export function changedCards(plan: QuarterPlan): DecisionId[] {
  return CARDS.filter((c) => plan[c.id] !== c.defaultOption).map((c) => c.id)
}

const AXES: ImpactAxis[] = ['growth', 'profit', 'risk', 'cx']

/** Summed direction per axis, clamped to -3…+3 for display. */
export function previewImpact(plan: QuarterPlan): Impact {
  const sum: Impact = { growth: 0, profit: 0, risk: 0, cx: 0 }
  for (const c of CARDS) {
    const o = optionOf(plan, c.id)
    for (const a of AXES) sum[a] += o.impact[a]
  }
  for (const a of AXES) sum[a] = Math.max(-3, Math.min(3, sum[a]))
  return sum
}

export interface AdvisorNote {
  id: string
  tone: 'warning' | 'tip'
  text: string
}

/**
 * Advisor checks for plans that fight themselves or ignore this quarter's events.
 * Narrative only — never changes numbers.
 */
export function reviewPlan(plan: QuarterPlan, s: GameState): AdvisorNote[] {
  const notes: AdvisorNote[] = []
  const has = (id: string) => s.events.some((e) => e.id === id)
  const p = plan

  if (budgetLeft(p) < 0) notes.push({ id: 'budget', tone: 'warning', text: `แผนนี้ใช้งบเกินไป ${-budgetLeft(p)} ล้านบาท ต้องลดบางรายการก่อนยืนยันค่ะ` })
  if ((p.pricing === 'cut2' || p.pricing === 'cut1') && p.underwriting === 'broad')
    notes.push({ id: 'cut+broad', tone: 'warning', text: 'ลดราคาพร้อมเปิดรับลูกค้ากว้าง จะได้ลูกค้าเสี่ยงสูงในราคาถูก Loss Ratio อาจพุ่งค่ะ' })
  if (has('flood-central') && (p.reinsurance === 'retain' || p.catExposure === 'grow'))
    notes.push({ id: 'flood', tone: 'warning', text: 'ไตรมาสนี้มีความเสี่ยงน้ำท่วมภาคกลาง การรับความเสี่ยงเองหรือขยายพื้นที่เสี่ยงตอนนี้อันตรายมากค่ะ' })
  if (has('flood-central') && p.reinsurance === 'keep' && p.catExposure !== 'reduce')
    notes.push({ id: 'flood-tip', tone: 'tip', text: 'มีสัญญาณน้ำท่วม ลองพิจารณาซื้อ reinsurance เพิ่มดูนะคะ' })
  if (has('rival-promo') && p.pricing === 'cut2')
    notes.push({ id: 'pricewar', tone: 'warning', text: 'ลดราคาเชิงรุกสู้ Lotus Guard อาจกลายเป็นสงครามราคา ทั้งตลาดเสียกำไรค่ะ' })
  if (has('rival-promo') && p.pricing === 'hold' && p.marketing !== 'campaign' && p.distribution !== 'dealer')
    notes.push({ id: 'rival-tip', tone: 'tip', text: 'คู่แข่งกำลังบุกช่องทางดีลเลอร์ ถ้าไม่อยากลดราคา แคมเปญการตลาดหรือดันดีลเลอร์ช่วยรักษาส่วนแบ่งได้ค่ะ' })
  if (p.repair === 'costCut' && p.pricing.startsWith('raise'))
    notes.push({ id: 'squeeze', tone: 'warning', text: 'ขึ้นราคาแต่ลดคุณภาพอู่ ลูกค้าจะรู้สึกว่าจ่ายแพงขึ้นแต่ได้บริการแย่ลงค่ะ' })
  if (has('ev-growth') && (p.repair === 'ev' || p.distribution === 'dealer'))
    notes.push({ id: 'ev-tip', tone: 'tip', text: 'ดีค่ะ แผนนี้รับกระแส EV ที่กำลังโต' })
  if (p.marketing === 'save' && p.pricing.startsWith('raise'))
    notes.push({ id: 'fade', tone: 'warning', text: 'ทั้งขึ้นราคาและลดการตลาด ส่วนแบ่งตลาดอาจหลุดเร็วกว่าที่คิดค่ะ' })
  return notes
}
