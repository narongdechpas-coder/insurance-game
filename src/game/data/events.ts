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
