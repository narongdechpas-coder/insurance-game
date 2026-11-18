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
  /** Mechanical effect in the simulation, on top of the impact axes. */
  sim?: SimHook
}

/**
 * Engine hooks. Capacity changes are fractions of today's baseline (0.15 = +15%).
 * `quarters` = how long a temporary boost lasts; omitted = permanent.
 */
export interface SimHook {
  contact?: number
  claims?: number
  repair?: number
  quarters?: number
  catLossMult?: number // flood losses multiplied by this if the flood hits
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
      { id: 'preposition', sim: { claims: 0.45, quarters: 1 }, label: 'เตรียมทีมสำรวจภัยและรถลากล่วงหน้า', blurb: 'ถ้าน้ำมา เราจ่ายเคลมได้เร็วกว่าทุกค่าย ลูกค้าจดจำ แต่ถ้าไม่มาก็เสียค่าเตรียมการ', cost: 20, speed: 'fast', icon: 'wrench', impact: { growth: 0, profit: 0, risk: 0, cx: 2 }, related: ['repair'] },
      { id: 'warnCustomers', sim: { catLossMult: 0.82 }, label: 'แจ้งเตือนลูกค้าให้ย้ายรถขึ้นที่สูง', blurb: 'งบน้อย ลดจำนวนรถที่จมน้ำได้จริง ลูกค้ารู้สึกว่าเราใส่ใจ', cost: 10, speed: 'fast', icon: 'smartphone', impact: { growth: 0, profit: 0, risk: -1, cx: 1 } },
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
  // ---- consequence events (raised by the engine) ----
  {
    eventId: 'callcenter-overload',
    question: 'สายด่วนรับไม่ทัน ลูกค้ารอนาน จะแก้อย่างไร',
    responses: [
      { id: 'tempStaff', label: 'จ้างพนักงานชั่วคราวเพิ่ม', blurb: 'แก้ได้ทันที แต่เป็นทางแก้ระยะสั้น พ้น 2 ไตรมาสต้องจ้างใหม่', cost: 20, speed: 'fast', icon: 'users', impact: { growth: 0, profit: 0, risk: 0, cx: 1 }, sim: { contact: 0.2, quarters: 2 } },
      { id: 'selfService', label: 'เปิดบริการตัวเองผ่านแอปและ LINE', blurb: 'ลงทุนครั้งเดียว ลูกค้าเช็คสถานะเองได้ ลดสายเข้าได้ถาวร แต่ใช้เวลาเห็นผล', cost: 35, speed: 'slow', icon: 'smartphone', impact: { growth: 0, profit: 0, risk: 0, cx: 0 }, sim: { contact: 0.25 } },
      { id: 'acceptWait', label: 'ปล่อยไว้ก่อน', blurb: 'ไม่ใช้งบ แต่ลูกค้าจะรอนานต่อไป ความพอใจและการต่ออายุจะตกต่อ', cost: 0, speed: 'fast', icon: 'hold', impact: { growth: -1, profit: 0, risk: 0, cx: -1 } },
    ],
  },
  {
    eventId: 'claims-backlog',
    question: 'เคลมค้างสะสม จะเร่งเคลียร์อย่างไร',
    responses: [
      { id: 'outsourceAdjusters', label: 'จ้างบริษัทสำรวจภัยภายนอก', blurb: 'เพิ่มกำลังได้ทันที 2 ไตรมาส ค่าใช้จ่ายต่อเคลมสูงกว่าทีมเรา', cost: 25, speed: 'fast', icon: 'users', impact: { growth: 0, profit: 0, risk: 0, cx: 1 }, sim: { claims: 0.3, quarters: 2 } },
      { id: 'fastTrack', label: 'จ่ายเร็วสำหรับเคลมเล็ก', blurb: 'เคลมเล็กอนุมัติทันทีโดยไม่ต้องตรวจละเอียด คิวสั้นลงมาก แต่มีเคลมเกินจริงหลุดบ้าง', cost: 10, speed: 'fast', icon: 'bolt', impact: { growth: 0, profit: -1, risk: 0, cx: 1 }, sim: { claims: 0.25, quarters: 2 } },
      { id: 'hireClaims', label: 'รับพนักงานสินไหมประจำเพิ่ม', blurb: 'กำลังเพิ่มถาวร แต่ต้องรับสมัครและอบรมก่อน เห็นผลไตรมาสหน้า', cost: 30, speed: 'slow', icon: 'shield', impact: { growth: 0, profit: 0, risk: 0, cx: 0 }, sim: { claims: 0.2 } },
    ],
  },
  {
    eventId: 'repair-delay',
    question: 'อู่ในเครือรับรถไม่ทัน จะทำอย่างไร',
    responses: [
      { id: 'addGarages', label: 'เพิ่มอู่ในเครือ', blurb: 'กำลังซ่อมเพิ่มถาวร ต้องตรวจคุณภาพอู่ใหม่ให้ดี', cost: 25, speed: 'normal', icon: 'wrench', impact: { growth: 0, profit: 0, risk: 0, cx: 1 }, sim: { repair: 0.2 } },
      { id: 'cashSettle', label: 'เสนอจ่ายเงินสดแทนการซ่อม', blurb: 'ลูกค้าบางส่วนรับเงินไปซ่อมเอง ลดคิวอู่ได้ทันที แต่บางรายรู้สึกถูกผลักภาระ', cost: 5, speed: 'fast', icon: 'piggy', impact: { growth: 0, profit: 0, risk: 0, cx: -1 }, sim: { repair: 0.2, quarters: 1 } },
      { id: 'rentalCars', label: 'ให้รถใช้ระหว่างรอซ่อม', blurb: 'ลูกค้าไม่เดือดร้อน ความพอใจไม่ตก แต่ค่าใช้จ่ายต่อเคลมสูงขึ้น', cost: 20, speed: 'fast', icon: 'car', impact: { growth: 0, profit: -1, risk: 0, cx: 2 } },
    ],
  },
  {
    eventId: 'complaints-rise',
    question: 'ข้อร้องเรียนเพิ่มขึ้น จะตอบสนองอย่างไร',
    responses: [
      { id: 'qualityAudit', label: 'ตรวจคุณภาพอู่และงานซ่อมทั้งเครือข่าย', blurb: 'แก้ที่ต้นเหตุ ใช้งบและเวลา แต่ข้อร้องเรียนลดลงถาวร', cost: 25, speed: 'normal', icon: 'star', impact: { growth: 0, profit: 0, risk: -1, cx: 2 } },
      { id: 'goodwill', label: 'ชดเชยลูกค้าที่ร้องเรียน', blurb: 'ลูกค้ากลุ่มนี้พอใจขึ้นเร็ว แต่ปัญหาต้นเหตุยังอยู่', cost: 15, speed: 'fast', icon: 'users', impact: { growth: 0, profit: 0, risk: 0, cx: 1 } },
      { id: 'pr', label: 'ออกแถลงการณ์และทำ PR', blurb: 'งบไม่มาก กู้ภาพลักษณ์ได้บ้าง แต่ถ้าปัญหาจริงยังอยู่จะกลับมาอีก', cost: 10, speed: 'fast', icon: 'megaphone', impact: { growth: 1, profit: 0, risk: 1, cx: 0 } },
    ],
  },
  {
    eventId: 'adverse-selection',
    question: 'ลูกค้าเสี่ยงสูงเข้าพอร์ตมาก จะแก้อย่างไร',
    responses: [
      { id: 'rerateSegment', label: 'ปรับราคากลุ่มเสี่ยงสูงทันที', blurb: 'หยุดเลือดได้เร็ว บางส่วนจะย้ายค่าย', cost: 5, speed: 'fast', icon: 'up', impact: { growth: -1, profit: 2, risk: -1, cx: 0 } },
      { id: 'tightenRules', label: 'คุมเกณฑ์รับประกันใหม่', blurb: 'ป้องกันลูกค้าเสี่ยงรายใหม่ ส่วนที่รับมาแล้วยังต้องรับผิดชอบไปจนครบปี', cost: 10, speed: 'normal', icon: 'shield', impact: { growth: -1, profit: 1, risk: -1, cx: 0 } },
      { id: 'absorb', label: 'รับไว้ หวังว่าเคลมจะไม่หนัก', blurb: 'รักษายอดขายไว้ได้ แต่ Loss Ratio จะเสียต่อเนื่อง', cost: 0, speed: 'fast', icon: 'hold', impact: { growth: 1, profit: -2, risk: 1, cx: 0 } },
    ],
  },
  {
    eventId: 'word-of-mouth',
    question: 'ลูกค้าบอกต่อเรื่องบริการของเรา จะต่อยอดอย่างไร',
    responses: [
      { id: 'referral', label: 'เปิดโปรแกรมแนะนำเพื่อน', blurb: 'ได้ลูกค้าใหม่คุณภาพดี ต้นทุนหาลูกค้าต่ำ', cost: 15, speed: 'normal', icon: 'users', impact: { growth: 2, profit: 0, risk: 0, cx: 0 } },
      { id: 'reviewCampaign', label: 'ทำแคมเปญรีวิวจากลูกค้าจริง', blurb: 'แบรนด์แข็งขึ้น คนรู้จักมากขึ้น', cost: 20, speed: 'normal', icon: 'megaphone', impact: { growth: 1, profit: 0, risk: 0, cx: 1 } },
      { id: 'keepQuiet', label: 'รักษามาตรฐานบริการต่อ ไม่ใช้งบเพิ่ม', blurb: 'กระแสค่อยๆ ช่วยเอง โตช้ากว่าแต่ไม่ใช้เงิน', cost: 0, speed: 'slow', icon: 'hold', impact: { growth: 1, profit: 0, risk: 0, cx: 0 } },
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
