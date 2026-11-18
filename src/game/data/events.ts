import type { GameEvent } from '../types'

/** Mock event deck for the prototype. Phase 4 will draw from this deck with a seeded RNG. */
export const EVENT_DECK: GameEvent[] = [
  {
    id: 'ev-growth',
    kind: 'opportunity',
    title: 'ตลาด EV โตต่อเนื่อง',
    detail:
      'ยอดจองรถ EV ในโชว์รูมพันธมิตรเพิ่มขึ้น ลูกค้ากลุ่มนี้ต้องการความคุ้มครองแบตเตอรี่และอู่ที่ซ่อม EV ได้ ใครเตรียมผลิตภัณฑ์ก่อนได้เปรียบ',
    icon: 'ev',
    locations: ['dealer', 'repair'],
    modules: ['pricing', 'vehicleRisk', 'distribution', 'repair'],
  },
  {
    id: 'flood-central',
    kind: 'threat',
    title: 'เสี่ยงน้ำท่วมภาคกลาง',
    detail:
      'หน่วยพยากรณ์เตือนฝนหนักช่วงปลายไตรมาส พอร์ตรถยนต์ในพื้นที่ลุ่มภาคกลางอาจโดนเคลมพร้อมกันจำนวนมาก ต้องเช็คการกระจุกตัวและสัญญาประกันภัยต่อ',
    icon: 'flood',
    locations: ['risk', 'claims'],
    modules: ['catRisk', 'finance', 'claims'],
  },
  {
    id: 'rival-promo',
    kind: 'competitor',
    title: 'คู่แข่งเตรียมโปรโมชันใหม่',
    detail:
      'Lotus Guard เตรียมลดราคาประกันชั้น 1 ผ่านดีลเลอร์ ถ้าเราไม่ตอบโต้ ส่วนแบ่งในช่องทางดีลเลอร์อาจหลุด แต่ถ้าลดตามทั้งหมด Loss Ratio จะเสีย',
    icon: 'competitor',
    locations: ['marketing', 'dealer'],
    modules: ['market', 'brand', 'pricing'],
  },
]

/**
 * Consequence events: raised by the engine when the player's own decisions overload a
 * function or create a side effect. They land in the next quarter like any other event.
 */
export const CONSEQUENCE_EVENTS: GameEvent[] = [
  {
    id: 'callcenter-overload',
    kind: 'threat',
    consequence: true,
    title: 'สายด่วนแน่น ลูกค้ารอนาน',
    detail: 'ยอดขายที่โตเร็วทำให้ลูกค้าใหม่โทรเข้ามาพร้อมกัน ทีมศูนย์ลูกค้ารับไม่ทัน ลูกค้ารอสายนานจนเริ่มบ่นในโซเชียล ถ้าปล่อยไว้ ความพอใจจะตกและลูกค้าต่ออายุน้อยลง',
    icon: 'service',
    locations: ['customers'],
    modules: ['cx'],
  },
  {
    id: 'claims-backlog',
    kind: 'threat',
    consequence: true,
    title: 'เคลมค้างสะสม',
    detail: 'จำนวนเคลมเกินกำลังทีมสินไหม เรื่องที่ค้างนานทำให้ลูกค้าไม่พอใจ และเคลมที่ตรวจไม่ละเอียดมีค่าใช้จ่ายรั่วไหล',
    icon: 'claims',
    locations: ['claims'],
    modules: ['claims', 'cx'],
  },
  {
    id: 'repair-delay',
    kind: 'threat',
    consequence: true,
    title: 'อู่ซ่อมล่าช้า',
    detail: 'รถเข้าอู่ในเครือมากเกินกำลัง ลูกค้ารอรถนาน และเราต้องจ่ายค่ารถใช้ระหว่างซ่อมเพิ่ม',
    icon: 'repair',
    locations: ['repair'],
    modules: ['repair', 'cx'],
  },
  {
    id: 'complaints-rise',
    kind: 'threat',
    consequence: true,
    title: 'ข้อร้องเรียนพุ่ง',
    detail: 'ลูกค้าร้องเรียนเรื่องคุณภาพงานซ่อมและบริการมากขึ้น เริ่มกระทบภาพลักษณ์ และอาจถูกขอคำชี้แจงจากหน่วยงานกำกับ',
    icon: 'complaint',
    locations: ['customers', 'repair'],
    modules: ['cx', 'brand'],
  },
  {
    id: 'adverse-selection',
    kind: 'threat',
    consequence: true,
    title: 'ลูกค้าเสี่ยงสูงทะลักเข้าพอร์ต',
    detail: 'ราคาที่ต่ำกว่าตลาดบวกกับเกณฑ์รับประกันที่หลวม ดึงลูกค้าที่เคลมบ่อยเข้ามามาก เคลมของพอร์ตใหม่สูงกว่าที่ตั้งราคาไว้',
    icon: 'adverse',
    locations: ['hq'],
    modules: ['vehicleRisk', 'pricing'],
  },
  {
    id: 'word-of-mouth',
    kind: 'opportunity',
    consequence: true,
    title: 'ลูกค้าบอกต่อ',
    detail: 'บริการดีต่อเนื่องจนลูกค้ารีวิวและแนะนำเพื่อน ถ้าต่อยอดได้ จะได้ลูกค้าใหม่ที่เคลมน้อยและภักดี',
    icon: 'referral',
    locations: ['customers', 'marketing'],
    modules: ['cx', 'brand'],
  },
]

export const ALL_EVENTS = [...EVENT_DECK, ...CONSEQUENCE_EVENTS]
export const EVENT_BY_ID = Object.fromEntries(ALL_EVENTS.map((e) => [e.id, e])) as Record<string, GameEvent>
