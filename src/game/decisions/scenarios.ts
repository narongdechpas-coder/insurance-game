import type { DecisionId, Impact, OptionIcon, Speed } from './types'

/**
 * Step 1 "รับมือเหตุการณ์": every headline event this quarter asks the CEO for a response.
 * Unlike strategy cards there is no default — the player must answer each one.
 * Values are game-design mocks (see docs/DECISION_ROOM.md for expert-review points).
 */
export interface ScenarioResponse {
  id: string
  label: string
  blurb: string
  cost: number // million THB, shares the quarter strategy budget
  impact: Impact
  speed: Speed
  icon: OptionIcon
  /** Strategy cards this response works with or against (advisor + confirm page link to them). */
  related?: DecisionId[]
}

export interface Scenario {
  eventId: string
  question: string
  responses: ScenarioResponse[]
}

/** eventId → chosen response id */
export type Responses = Record<string, string>

export const SCENARIOS: Scenario[] = [
  {
    eventId: 'ev-growth',
    question: 'ยอดจองรถ EV พุ่ง ลูกค้าถามหาความคุ้มครองแบตเตอรี่ เราจะตอบสนองอย่างไร',
    responses: [
      { id: 'launchCover', label: 'ออกความคุ้มครองแบตเตอรี่ทันที', blurb: 'ได้ลูกค้า EV ก่อนคู่แข่ง แต่ยังไม่รู้ต้นทุนเคลมแบตเตอรี่ที่แท้จริง', cost: 25, speed: 'fast', icon: 'bolt', impact: { growth: 1, profit: 0, risk: 1, cx: 0 }, related: ['productMix', 'repair'] },
      { id: 'oemBundle', label: 'ทำแพ็กเกจร่วมกับค่ายรถ EV', blurb: 'ค่ายรถช่วยแบกความเสี่ยงแบตเตอรี่บางส่วน ลูกค้าได้บริการครบที่โชว์รูม ใช้งบสูงกว่า', cost: 35, speed: 'normal', icon: 'car', impact: { growth: 1, profit: 0, risk: 0, cx: 1 }, related: ['distribution'] },
      { id: 'waitData', label: 'รอเก็บข้อมูลเคลมอีก 1 ไตรมาส', blurb: 'ไม่เสี่ยงเพิ่ม แต่ลูกค้า EV กลุ่มแรกอาจไปอยู่กับคู่แข่ง', cost: 0, speed: 'slow', icon: 'hold', impact: { growth: -1, profit: 0, risk: 0, cx: 0 } },
    ],
  },
  {
    eventId: 'flood-central',
    question: 'หน่วยพยากรณ์เตือนฝนหนักภาคกลางปลายไตรมาส จะเตรียมรับมืออย่างไร',
    responses: [
      { id: 'preposition', label: 'เตรียมทีมสำรวจภัยและรถลากล่วงหน้า', blurb: 'ถ้าน้ำมา เราจ่ายเคลมได้เร็วกว่าทุกค่าย ลูกค้าจดจำ แต่ถ้าไม่มาก็เสียค่าเตรียมการ', cost: 20, speed: 'fast', icon: 'wrench', impact: { growth: 0, profit: 0, risk: 0, cx: 2 }, related: ['repair'] },
      { id: 'warnCustomers', label: 'แจ้งเตือนลูกค้าให้ย้ายรถขึ้นที่สูง', blurb: 'งบน้อย ลดจำนวนรถที่จมน้ำได้จริง ลูกค้ารู้สึกว่าเราใส่ใจ', cost: 10, speed: 'fast', icon: 'smartphone', impact: { growth: 0, profit: 0, risk: -1, cx: 1 } },
      { id: 'monitor', label: 'เฝ้าดูสถานการณ์ก่อน', blurb: 'ไม่ใช้งบตอนนี้ แต่ถ้าน้ำท่วมจริง เคลมจะเข้าพร้อมกันและเราตอบสนองช้า', cost: 0, speed: 'slow', icon: 'hold', impact: { growth: 0, profit: 0, risk: 1, cx: 0 }, related: ['reinsurance', 'catExposure'] },
    ],
  },
  {
    eventId: 'rival-promo',
    question: 'Lotus Guard จะลดราคาชั้น 1 ผ่านดีลเลอร์ เราจะตอบโต้อย่างไร',
    responses: [
      { id: 'matchPromo', label: 'จัดโปรตอบโต้ที่โชว์รูมเดียวกัน', blurb: 'รักษาส่วนแบ่งในช่องทางดีลเลอร์ได้ แต่กำไรต่อกรมธรรม์ลดลง', cost: 30, speed: 'fast', icon: 'store', impact: { growth: 1, profit: -1, risk: 0, cx: 0 }, related: ['pricing', 'distribution'] },
      { id: 'valueAdd', label: 'ให้บริการเสริมแทนการลดราคา', blurb: 'เช่น รถใช้ระหว่างซ่อม ลูกค้าเห็นความคุ้มค่า ไม่ต้องเข้าสงครามราคา', cost: 25, speed: 'normal', icon: 'star', impact: { growth: 0, profit: 0, risk: 0, cx: 1 }, related: ['repair'] },
      { id: 'holdLine', label: 'ไม่ตอบโต้ เน้นลูกค้าคุณภาพ', blurb: 'ยอมเสียลูกค้าที่ตามหาแต่ราคาถูก พอร์ตที่เหลือเคลมน้อยกว่า', cost: 0, speed: 'slow', icon: 'shield', impact: { growth: -1, profit: 0, risk: -1, cx: 0 }, related: ['pricing'] },
    ],
  },
]

export const SCENARIO_BY_EVENT = Object.fromEntries(SCENARIOS.map((s) => [s.eventId, s])) as Record<string, Scenario>

/** Scenarios for the events active this quarter, in event order. */
export function scenariosFor(eventIds: string[]) {
  return eventIds.map((id) => SCENARIO_BY_EVENT[id]).filter(Boolean)
}

export function responseOf(responses: Responses, eventId: string) {
  return SCENARIO_BY_EVENT[eventId]?.responses.find((r) => r.id === responses[eventId])
}
