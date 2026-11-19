import type { QuarterLog, Standing } from '../sim/types'
import { RENEWAL_BASELINE } from '../sim/v2'
import type { GameState } from '../types'
import { SEGMENTS } from '../data/tables'
import { STYLE } from './rivals'

/**
 * End-of-game debrief: lessons drawn from what actually happened in this game (the quarter log).
 * Every sentence quotes the game's own numbers; nothing here is market data.
 */

export interface Lesson {
  id: string
  tone: 'good' | 'bad'
  title: string
  text: string
  weight: number
}

const p0 = (x: number) => `${(x * 100).toFixed(0)}%`
const p1 = (x: number) => `${(x * 100).toFixed(1)}%`
const mb = (x: number) => Math.round(x).toLocaleString('th-TH')
const SEG_LABEL = Object.fromEntries(SEGMENTS.map((s) => [s.id, s.label.replace(' (≤ 3 ปี)', '').replace(' (บ้าน/SME + PA)', '')]))
/** Book-weighted direction of this quarter's price moves (any segment moved counts). */
const moved = (l: QuarterLog, dir: 1 | -1) => Object.values(l.priceMoves ?? {}).some((v) => v * dir > 0)
const segsMoved = (l: QuarterLog, dir: 1 | -1) =>
  Object.entries(l.priceMoves ?? {})
    .filter(([, v]) => v * dir > 0)
    .map(([k]) => SEG_LABEL[k] ?? k)
const segText = (l: QuarterLog, dir: 1 | -1) => {
  const s = segsMoved(l, dir)
  return s.length === SEGMENTS.length ? 'ทุกกลุ่ม' : `กลุ่ม ${s.join(', ')}`
}
const OPS = { contact: 'สายด่วน', claims: 'ทีมสินไหม', repair: 'อู่ในเครือ' } as const

export function lessons(g: GameState): Lesson[] {
  const log = g.sim.log ?? []
  const kh = g.kpiHistory // kh[q] = before quarter q, kh[q+1] = after it
  const last = kh.length - 1
  const out: Lesson[] = []
  if (!log.length) return out

  // 1. price cuts: share now, margin later
  const cuts = log.filter((l) => moved(l, -1))
  if (cuts.length) {
    const q = cuts[0].quarter
    const later = Math.min(q + 3, last)
    const shareGain = kh[Math.min(q + 1, last)].marketShare - kh[q].marketShare
    const crMove = kh[later].combinedRatio - kh[q].combinedRatio
    out.push({
      id: 'price-cut',
      tone: crMove > 0.01 ? 'bad' : 'good',
      title: crMove > 0.01 ? 'ลดราคาได้ส่วนแบ่งเร็ว แต่จ่ายคืนด้วยกำไรทีหลัง' : 'ลดราคาแบบคุมได้',
      text:
        `ลดราคา ${cuts.length} ไตรมาส (ครั้งแรก ${cuts[0].label} ${segText(cuts[0], -1)}) ส่วนแบ่งจาก ${p1(kh[q].marketShare)} เป็น ${p1(kh[Math.min(q + 1, last)].marketShare)} ` +
        `แต่ Combined Ratio จาก ${p0(kh[q].combinedRatio)} เป็น ${p0(kh[later].combinedRatio)} ใน ${later - q} ไตรมาสต่อมา เพราะอัตราเบี้ยใหม่ทยอยมีผลกับกรมธรรม์ที่ต่ออายุ`,
      weight: Math.abs(crMove) * 900 + Math.abs(shareGain) * 600,
    })
  }

  // 2. price raises: margin now, customers leave
  const raises = log.filter((l) => moved(l, 1))
  if (raises.length) {
    const q = raises[0].quarter
    const later = Math.min(q + 3, last)
    out.push({
      id: 'price-raise',
      tone: kh[later].combinedRatio < kh[q].combinedRatio ? 'good' : 'bad',
      title: 'ขึ้นราคา: กำไรดีขึ้นช้า ลูกค้าออกเร็ว',
      text:
        `ขึ้นราคา ${raises.length} ไตรมาส (ครั้งแรก ${raises[0].label} ${segText(raises[0], 1)}) Combined Ratio จาก ${p0(kh[q].combinedRatio)} เป็น ${p0(kh[later].combinedRatio)} ` +
        `ส่วนแบ่งจาก ${p1(kh[q].marketShare)} เป็น ${p1(kh[later].marketShare)} ถ้าแพงกว่าตลาดมาก ลูกค้าดีจะออกก่อน เหลือลูกค้าที่เคลมบ่อย`,
      weight: Math.abs(kh[later].combinedRatio - kh[q].combinedRatio) * 900 + Math.abs(kh[later].marketShare - kh[q].marketShare) * 600,
    })
  }

  // 3. floods and reinsurance (one lesson for the whole game, built around the biggest flood)
  const floods = log.filter((x) => x.flood === 'hit')
  if (floods.length) {
    const l = [...floods].sort((a, b) => b.catGross - a.catGross)[0]
    const gross = floods.reduce((a, x) => a + x.catGross, 0)
    const net = floods.reduce((a, x) => a + x.catNet, 0)
    const share = gross ? (gross - net) / gross : 0
    out.push({
      id: 'flood',
      tone: share > 0.35 ? 'good' : 'bad',
      title: share > 0.35 ? 'ประกันภัยต่อทำหน้าที่ตอนน้ำท่วม' : 'น้ำท่วมโดยประกันภัยต่อรับไว้น้อย',
      text:
        `น้ำท่วมเกิดจริง ${floods.length} ครั้ง ครั้งใหญ่สุด ${l.label} เคลมรวม ${mb(l.catGross)} ล้านบาท ` +
        `ทั้งเกมประกันภัยต่อรับไป ${mb(gross - net)} ล้าน (${p0(share)}) เราจ่ายเอง ${mb(net)} ล้าน ค่าคุ้มครองที่จ่ายทุกไตรมาสคือราคาของวันแบบนี้`,
      weight: net * 0.6 + (gross - net) * 0.3,
    })
  }

  // 4. the worst overload
  const worst = log
    .flatMap((l) => (Object.keys(OPS) as (keyof typeof OPS)[]).map((k) => ({ l, k, load: l.loads[k] })))
    .sort((a, b) => b.load - a.load)[0]
  if (worst && worst.load > 1.12) {
    const q = worst.l.quarter
    out.push({
      id: 'overload',
      tone: 'bad',
      title: 'โตเร็วกว่ากำลังทีม',
      text: `${worst.l.label} ${OPS[worst.k]}รับงานเกินกำลัง ${p0(worst.load - 1)} ความพอใจจาก ${kh[q].satisfaction.toFixed(2)} เหลือ ${kh[q + 1].satisfaction.toFixed(2)} ดาว ยอดขายที่ไม่ได้เตรียมกำลังไว้ย้อนกลับมาเป็นต้นทุนเคลมและลูกค้าที่ไม่ต่ออายุ`,
      weight: (worst.load - 1) * 400,
    })
  }

  // 5. renewal seasons
  for (const l of log.filter((x) => x.renewal !== null)) {
    const r = l.renewal!
    const diff = r - RENEWAL_BASELINE
    if (Math.abs(diff) < 0.02) continue
    out.push({
      id: `renewal-${l.quarter}`,
      tone: diff > 0 ? 'good' : 'bad',
      title: diff > 0 ? 'บริการดีทั้งปี ลูกค้าอยู่ต่อ' : 'ปีที่บริการสะดุด ลูกค้าไม่ต่ออายุ',
      text: `ฤดูต่ออายุ ${l.label} ลูกค้าต่ออายุ ${p0(r)} เทียบค่ากลาง ${p0(RENEWAL_BASELINE)} อัตราต่ออายุมาจากความพอใจและงานบริการตลอดปีที่ผ่านมา ไม่ใช่จากสิ่งที่ทำในไตรมาสนั้น`,
      weight: Math.abs(diff) * 700,
    })
  }

  // 6. channel levers held for at least two quarters
  for (const c of ['dealer', 'agent', 'direct']) {
    const held = log.filter((l) => (l.levers[c] ?? 2) !== 2)
    if (held.length < 2) continue
    const up = held[0].levers[c] > 2
    const name = { dealer: 'Dealer', agent: 'Agent', direct: 'Direct' }[c]
    const q = held[0].quarter
    const later = Math.min(held[held.length - 1].quarter + 1, last)
    out.push({
      id: `lever-${c}`,
      tone: up ? (kh[later].combinedRatio > kh[q].combinedRatio + 0.02 ? 'bad' : 'good') : kh[later].marketShare < kh[q].marketShare - 0.02 ? 'bad' : 'good',
      title: up ? `จ่าย ${name} มากกว่าตลาด` : `จ่าย ${name} น้อยกว่าตลาด`,
      text: `ตั้งช่องทาง ${name} ${up ? 'สูงกว่า' : 'ต่ำกว่า'}ตลาด ${held.length} ไตรมาส ส่วนแบ่งจาก ${p1(kh[q].marketShare)} เป็น ${p1(kh[later].marketShare)} และ Combined Ratio จาก ${p0(kh[q].combinedRatio)} เป็น ${p0(kh[later].combinedRatio)} ค่าคอมคิดจากเบี้ยทั้งก้อนของช่องทาง จึงต้องได้ยอดเพิ่มมากพอจะคุ้ม`,
      weight: 60 + held.length * 5,
    })
  }

  // 7. the lowest capital point
  const low = kh.reduce((m, k, i) => (k.capitalMB < kh[m].capitalMB ? i : m), 0)
  if (low > 0 && kh[low].capitalMB < g.config.startingCapitalMB * 0.85) {
    const l = log[low - 1]
    const cause = l?.drivers.find((d) => d.tone === 'bad')
    out.push({
      id: 'capital-low',
      tone: 'bad',
      title: 'จุดที่เงินทุนต่ำที่สุด',
      text: `${l?.label ?? ''} เงินทุนเหลือ ${mb(kh[low].capitalMB)} ล้านบาท${cause ? ` สาเหตุหลักคือ ${cause.text}` : ''} เงินทุนคือกันชนของบริษัทประกัน ต้องเหลือพอรับเหตุการณ์ใหญ่ครั้งถัดไป`,
      weight: (g.config.startingCapitalMB - kh[low].capitalMB) * 0.3,
    })
  }

  if (!out.length)
    out.push({
      id: 'steady',
      tone: 'good',
      title: 'เล่นแบบรักษาสมดุล',
      text: 'เกมนี้ไม่มีการตัดสินใจที่เหวี่ยงแรง ผลจึงขึ้นกับว่าเราคุมต้นทุนและบริการได้ดีกว่าคู่แข่งแค่ไหน ลองเกมหน้าใช้ slider ช่องทางหรือราคาเพื่อเห็นผลชัดขึ้น',
      weight: 1,
    })
  // lessons about the player's own decisions come first; luck and consequences fill the rest
  const decision = (l: Lesson) => /^(price-|lever-)/.test(l.id)
  const byWeight = (a: Lesson, b: Lesson) => b.weight - a.weight
  const picked = [...out.filter(decision).sort(byWeight).slice(0, 2), ...out.filter((l) => !decision(l)).sort(byWeight)].slice(0, 5)
  return picked.sort(byWeight)
}

export interface TurningPoint {
  label: string
  text: string
  tone: 'good' | 'bad'
  weight: number
}

/** The three biggest single drivers of the whole game (quarter + what happened). */
export function turningPoints(g: GameState): TurningPoint[] {
  const all = (g.sim.log ?? []).flatMap((l) => l.drivers.map((d) => ({ label: l.label, text: d.text, tone: d.tone, weight: d.weight, id: d.id })))
  const seen = new Set<string>()
  const out: TurningPoint[] = []
  for (const d of all.sort((a, b) => b.weight - a.weight)) {
    const key = d.id.replace(/-\d+$/, '')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(d)
    if (out.length === 3) break
  }
  return out
}

export interface WinnerNote {
  winnerId: string
  winnerName: string
  style: string
  versus: Standing
  winner: Standing
  gaps: { part: string; diff: number }[]
  text: string
}

const PART_NAME = { capital: 'เงินทุน', share: 'ส่วนแบ่งตลาด', cr: 'Combined Ratio เฉลี่ย', cx: 'ความพอใจลูกค้า' } as const

/** What the winner did differently (or, if we won, how the runner-up compares). */
export function winnerNote(g: GameState): WinnerNote | null {
  const o = g.outcome
  if (!o) return null
  const me = o.standings.find((s) => s.id === 'player')!
  const top = o.standings[0]
  const weWon = top.id === 'player'
  const other = weWon ? o.standings[1] : top
  const comp = g.competitors.find((c) => c.id === other.id)
  if (!comp || !me.parts || !other.parts) return null
  const gaps = (Object.keys(PART_NAME) as (keyof typeof PART_NAME)[])
    .map((k) => ({ part: PART_NAME[k], diff: other.parts![k] - me.parts![k] }))
    .sort((a, b) => (weWon ? a.diff - b.diff : b.diff - a.diff))
  const st = STYLE[comp.personality]
  const lead = gaps[0]
  const text = weWon
    ? `เราชนะ ${comp.name} (${st.label}) ห่าง ${me.score - other.score} คะแนน จุดที่เราทิ้งห่างที่สุดคือ${lead.part} (${Math.abs(lead.diff).toFixed(1)} คะแนน) ${comp.name} ${st.summary}`
    : `${comp.name} ชนะด้วยแนวทาง${st.label}: ${st.summary} จุดที่เขานำเรามากที่สุดคือ${lead.part} (${lead.diff.toFixed(1)} คะแนน) เทียบส่วนแบ่ง ${p1(other.share)} กับเรา ${p1(me.share)} และ CR เฉลี่ย ${p0(other.avgCombinedRatio)} กับเรา ${p0(me.avgCombinedRatio)}`
  return { winnerId: top.id, winnerName: weWon ? g.config.companyName : comp.name, style: st.label, versus: other, winner: top, gaps, text }
}
