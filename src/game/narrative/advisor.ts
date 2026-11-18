import { LOCATION_BY_ID } from '../data/locations'
import { eventsAt, locationStatus } from '../selectors'
import type { GameState, LocationId } from '../types'

/**
 * AI Business Advisor — narrative layer.
 * Reads game state, never changes it. Phase 4 can swap this for an LLM call
 * without touching the simulation engine.
 */
export const ADVISOR_NAME = 'น้องพลอย'

export function quarterBriefing(s: GameState): string[] {
  const lines: string[] = []
  const { year, q } = s.quarter
  lines.push(`ยินดีต้อนรับสู่ไตรมาส ${q} ปีที่ ${year} ค่ะ บริษัทพร้อมแล้ว รอคำสั่งจากท่าน CEO`)
  const opp = s.events.find((e) => e.kind === 'opportunity')
  const threat = s.events.find((e) => e.kind === 'threat')
  if (opp && threat) {
    lines.push(`ไตรมาสนี้มีโอกาสจาก "${opp.title}" และต้องเตรียมรับมือ "${threat.title}" ด้วยค่ะ`)
  }
  const rival = s.events.find((e) => e.kind === 'competitor')
  if (rival) lines.push(`${rival.title} ลองแวะไปดูที่ Marketing & Brand ก่อนตัดสินใจเรื่องราคานะคะ`)
  lines.push('คลิกอาคารไหนก็ได้ เพื่อดูสถานการณ์ของหน่วยงานนั้นค่ะ')
  return lines
}

export function locationComment(s: GameState, id: LocationId): string {
  const loc = LOCATION_BY_ID[id]
  const ev = eventsAt(s, id)
  switch (locationStatus(s, id)) {
    case 'alert':
      return `${loc.en} ต้องรับมือด่วนค่ะ — ${ev[0].title} ลองทบทวนการกระจุกตัวของพอร์ตก่อนปิดไตรมาส`
    case 'watch':
      return `${loc.en} ต้องจับตาค่ะ — ${ev[0].title} อย่าเพิ่งตัดราคาตามจนกว่าจะเห็นผลกระทบกับกำไร`
    case 'chance':
      return `${loc.en} มีโอกาสดีค่ะ — ${ev[0].title} ถ้าลงมือก่อนคู่แข่งจะได้เปรียบ`
    default:
      return `${loc.en} ทำงานราบรื่นดีค่ะ ไตรมาสนี้ยังไม่มีเรื่องเร่งด่วน`
  }
}
