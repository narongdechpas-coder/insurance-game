import type { Competitor, GameState } from '../types'

/**
 * What the CEO can reasonably expect from each rival next quarter, read from its style and
 * its latest numbers. Narrative only: the engine decides what really happens.
 */
export const STYLE: Record<Competitor['personality'], { label: string; summary: string }> = {
  aggressive: { label: 'สายบุกราคา', summary: 'ใช้ราคาและโปรโมชันผ่านดีลเลอร์แย่งส่วนแบ่ง ยอมกำไรบาง' },
  premium: { label: 'สายบริการพรีเมียม', summary: 'ขายความคุ้มครองและบริการระดับสูง ตั้งราคาสูงกว่าตลาด' },
  digital: { label: 'สายดิจิทัล', summary: 'ขายผ่านแอปและออนไลน์ ต้นทุนต่ำ ปรับราคาเร็ว' },
  conservative: { label: 'สายระมัดระวัง', summary: 'เน้นวินัยการรับประกัน คุมความเสี่ยง ไม่ไล่ราคา' },
}

export function outlook(game: GameState, id: string): { text: string; threat: 'high' | 'mid' | 'low' } {
  const i = game.competitors.findIndex((c) => c.id === id)
  const c = game.competitors[i]
  const f = game.sim.firms[i]
  const flood = game.events.some((e) => e.id === 'flood-central')
  const promo = game.events.some((e) => e.id === 'rival-promo')
  switch (c.personality) {
    case 'aggressive':
      if (f.combinedRatio > 1.0 || f.price < 0.85) return { text: 'ขาดทุนจากการรับประกัน มีแนวโน้มขึ้นราคาไตรมาสหน้า เป็นโอกาสดึงลูกค้าคืน', threat: 'low' }
      if (promo || f.share < f.s0 * 0.97) return { text: 'คาดว่าจะลดราคาผ่านดีลเลอร์อีก ช่องทางดีลเลอร์ของเราจะโดนกดดัน', threat: 'high' }
      return { text: 'อาจลดราคาแบบฉวยโอกาส เฝ้าดูช่องทางดีลเลอร์', threat: 'mid' }
    case 'premium':
      return { text: flood ? 'เตรียมรับมือน้ำท่วมดี ลูกค้าพรีเมียมจะยิ่งเชื่อมั่น' : 'ยกระดับบริการต่อเนื่อง แข่งกับเราที่ความพอใจลูกค้า ไม่ใช่ราคา', threat: game.kpis.satisfaction < f.satisfaction ? 'mid' : 'low' }
    case 'digital':
      if (f.combinedRatio > 1.0 || f.price < 0.9) return { text: 'กำไรบาง อาจปรับราคาออนไลน์ขึ้น', threat: 'low' }
      return { text: 'อาจลดราคาออนไลน์หรือออกฟีเจอร์ใหม่ แย่งลูกค้ารุ่นใหม่จากช่อง Direct', threat: 'mid' }
    default:
      return { text: f.combinedRatio > 0.98 ? 'คาดว่าจะขึ้นราคาเพื่อรักษากำไร' : 'คงราคา ไม่น่าเป็นฝ่ายเปิดสงครามราคา', threat: 'low' }
  }
}
