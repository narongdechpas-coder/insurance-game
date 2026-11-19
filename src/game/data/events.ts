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
  {
    id: 'economy-slowdown',
    kind: 'threat',
    title: 'เศรษฐกิจชะลอตัว',
    detail:
      'ยอดขายรถใหม่ลดลง ลูกค้าเริ่มเปรียบเทียบราคาประกันมากขึ้น บางรายลดชั้นความคุ้มครองหรือไม่ต่ออายุ ตลาดรวมโตช้าลง และผลตอบแทนจากการลงทุนลดลงทั้งอุตสาหกรรม',
    icon: 'economy',
    locations: ['hq', 'customers'],
    modules: ['market', 'pricing', 'finance'],
  },
  {
    id: 'regulation-review',
    kind: 'threat',
    title: 'หน่วยงานกำกับตรวจการบริการสินไหม',
    detail:
      'หน่วยงานกำกับประกาศตรวจคุณภาพการจ่ายสินไหมและการปฏิบัติต่อลูกค้าทั้งอุตสาหกรรม (สถานการณ์สมมติในเกม) บริษัทที่ความพึงพอใจของลูกค้าต่ำมีโอกาสถูกปรับและต้องทำแผนแก้ไข',
    icon: 'regulation',
    locations: ['claims', 'customers'],
    modules: ['claims', 'cx'],
  },
  // ---- high season (fixed in the calendar; see externalEvents in the engine) ----
  {
    id: 'motor-show',
    kind: 'opportunity',
    title: 'ช่วงงาน Motor Show',
    detail:
      'ช่วงงานแสดงรถยนต์กลางปี คนจองรถใหม่พร้อมกันจำนวนมาก ประกันงานใหม่ของทั้งตลาดเร่งขึ้น โดยเฉพาะผ่านดีลเลอร์ รถใหม่และ EV งานเข้ามากขึ้นทั้งสายด่วน สินไหม และงานออกกรมธรรม์',
    icon: 'motorShow',
    locations: ['dealer'],
    modules: ['distribution', 'pricing'],
  },
  {
    id: 'motor-expo',
    kind: 'opportunity',
    title: 'ช่วงงาน Motor Expo',
    detail:
      'งานแสดงรถยนต์ปลายปี ค่ายรถอัดโปรโมชันปิดยอดทั้งปี ประกันงานใหม่ผ่านดีลเลอร์เร่งแรง แต่ก็เป็นช่วงที่คู่แข่งแย่งงานเดียวกันหนักที่สุด',
    icon: 'motorExpo',
    locations: ['dealer'],
    modules: ['distribution', 'pricing'],
  },
  {
    id: 'year-end-promo',
    kind: 'competitor',
    title: 'ทุกบริษัทอัดโปรโมชันปิดยอดปลายปี',
    detail:
      'ไตรมาสสุดท้ายของปี บริษัทประกันทุกรายเร่งยอดให้ถึงเป้าทั้งปี ด้วยส่วนลด ของแถม และคอมพิเศษให้ตัวกลาง ถ้าเราไม่ทำอะไร ลูกค้าใหม่จะไหลไปคู่แข่ง ถ้าทำตาม ยอดขึ้นแต่กำไรต่อกรมธรรม์ลดลง',
    icon: 'yearEndPromo',
    locations: ['marketing', 'dealer'],
    modules: ['market', 'pricing', 'distribution'],
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
    id: 'renewal-season',
    kind: 'threat',
    consequence: true,
    title: 'ฤดูต่ออายุกรมธรรม์ต้นปี',
    detail: 'กรมธรรม์ที่ขายไปเมื่อปีก่อนครบรอบต่ออายุพร้อมกัน ลูกค้าจะต่ออายุมากน้อยแค่ไหน ขึ้นกับความพอใจและงานบริการตลอดปีที่ผ่านมา',
    icon: 'renewal',
    locations: ['customers'],
    modules: ['cx', 'distribution'],
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
