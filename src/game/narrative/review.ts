import { EVENT_BY_ID } from '../data/events'
import type { QuarterReport } from '../sim/types'
import type { GameState } from '../types'

/**
 * Quarterly Review narrative. Reads the engine's report and writes plain-Thai explanations.
 * Never changes numbers; an LLM could replace this module later.
 */

export function headline(r: QuarterReport): { tone: 'good' | 'bad' | 'mixed'; text: string } {
  const capital = r.after.capitalMB - r.before.capitalMB
  const share = r.after.marketShare - r.before.marketShare
  if (capital > 0 && share >= 0) return { tone: 'good', text: 'ไตรมาสที่ดี: ทั้งกำไรและส่วนแบ่งตลาดไปในทางที่ถูก' }
  if (capital > 0) return { tone: 'mixed', text: 'มีกำไร แต่เสียส่วนแบ่งตลาดให้คู่แข่ง' }
  if (share > 0) return { tone: 'mixed', text: 'ยอดขายโต แต่ต้องแลกด้วยกำไร' }
  return { tone: 'bad', text: 'ไตรมาสที่ยาก: ขาดทุนและส่วนแบ่งลดลง' }
}

export function floodLine(r: QuarterReport) {
  if (r.flood === 'hit') return `น้ำท่วมภาคกลางเกิดจริง ความเสียหายรวม ${Math.round(r.catLossGross).toLocaleString('th-TH')} ล้านบาท เราแบกเองสุทธิ ${Math.round(r.catLossNet).toLocaleString('th-TH')} ล้านบาท`
  if (r.flood === 'missed') return 'ฝนหนักผ่านไปโดยไม่เกิดน้ำท่วมใหญ่'
  return null
}

/** Up to 3 concrete suggestions for next quarter, most urgent first. */
export function recommendations(r: QuarterReport, next: GameState): string[] {
  const out: string[] = []
  const has = (id: string) => next.events.some((e) => e.id === id)
  if (r.loads.contact > 1.05) out.push('ศูนย์ลูกค้ารับไม่ทัน ก่อนเร่งยอดต่อ ควรเพิ่มกำลังคนหรือเปิดบริการผ่านแอปก่อน')
  if (r.loads.claims > 1.05) out.push('เคลมเกินกำลังทีมสินไหม ควรเพิ่มกำลังก่อนที่เคลมรั่วไหลจะกิน Loss Ratio')
  if (r.lossRatio > 0.66 && r.flood !== 'hit') out.push('Loss Ratio สูงกว่าเป้า ลองปรับราคาเฉพาะกลุ่มเคลมบ่อย หรือคุมเกณฑ์รับประกัน')
  if (r.drivers.some((d) => d.id === 'adverse')) out.push('ราคาแพงกว่าตลาดมากเกินไป ลูกค้าดีเริ่มย้ายออก ควรหยุดขึ้นราคา')
  if (has('flood-central')) out.push('ไตรมาสหน้ามีสัญญาณน้ำท่วม ทบทวนประกันภัยต่อ (Cat XL) และพื้นที่เสี่ยงก่อน')
  if (r.after.marketShare < r.before.marketShare - 0.005) out.push('ส่วนแบ่งตลาดหลุด ลองแคมเปญการตลาดหรือดันช่องทางที่ต้นทุนต่ำ')
  if (r.after.satisfaction < 3.5) out.push('ความพอใจลูกค้าต่ำ ลงทุนคุณภาพอู่หรือบริการก่อนจะกระทบการต่ออายุ')
  if (out.length === 0) out.push('ผลไตรมาสนี้สมดุลดี รักษาแนวทางเดิม และเก็บงบไว้รับมือเหตุการณ์ที่ไม่คาดคิด')
  return out.slice(0, 3)
}

export function consequenceLines(r: QuarterReport) {
  return r.consequences.map((id) => EVENT_BY_ID[id]?.title).filter(Boolean) as string[]
}
