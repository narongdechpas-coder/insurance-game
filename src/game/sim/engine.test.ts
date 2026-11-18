import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { CARD_BY_ID, choiceFor, defaultPlan } from '../decisions/cards'
import type { QuarterPlan } from '../decisions/types'
import { createInitialState } from '../initialState'
import type { Difficulty, GameState } from '../types'
import { simulateQuarter } from './engine'
import { scriptedTurn, type StrategyId } from './strategies'

const withEvents = (s: GameState, ids: string[]) => ({ ...s, events: ids.map((id) => ({ ...s.events[0], id })) })
const plan = (over: Partial<Record<keyof QuarterPlan, string>>, tactics: Partial<Record<keyof QuarterPlan, string>> = {}) => {
  const p = defaultPlan()
  for (const [k, v] of Object.entries(over) as [keyof QuarterPlan, string][]) p[k] = choiceFor(CARD_BY_ID[k].options.find((o) => o.id === v)!)
  for (const [k, t] of Object.entries(tactics) as [keyof QuarterPlan, string][]) p[k] = { ...p[k], tactic: t }
  return p
}
const start = (difficulty: Difficulty = 'normal', seed = 7) => createInitialState({ ...DEFAULT_CONFIG, difficulty, seed })

describe('simulateQuarter', () => {
  it('is deterministic', () => {
    const s = start()
    const a = simulateQuarter(s, defaultPlan(), {})
    const b = simulateQuarter(s, defaultPlan(), {})
    expect(a.kpis).toEqual(b.kpis)
    expect(a.lastReport?.drivers).toEqual(b.lastReport?.drivers)
  })

  it('advances the quarter and records history', () => {
    const n = simulateQuarter(start(), defaultPlan(), {})
    expect(n.quarter.index).toBe(1)
    expect(n.kpiHistory.length).toBe(2)
    expect(n.events.length).toBeGreaterThan(0)
  })

  it('a price cut lifts share now and hurts the loss ratio later (lag)', () => {
    let a = withEvents(start(), ['ev-growth'])
    let b = a
    a = simulateQuarter(a, defaultPlan(), {}, { seed: 1 })
    b = simulateQuarter(b, plan({ pricing: 'cut2' }, { pricing: 'flat' }), {}, { seed: 1 })
    expect(b.kpis.marketShare).toBeGreaterThan(a.kpis.marketShare)
    const lr1 = b.lastReport!.lossRatio - a.lastReport!.lossRatio
    // keep both on hold for two more quarters: the gap in loss ratio grows as the cut earns through
    for (let i = 0; i < 2; i++) {
      a = simulateQuarter(withEvents(a, ['ev-growth']), defaultPlan(), {}, { seed: 2 + i })
      b = simulateQuarter(withEvents(b, ['ev-growth']), defaultPlan(), {}, { seed: 2 + i })
    }
    const lr3 = b.lastReport!.lossRatio - a.lastReport!.lossRatio
    expect(lr3).toBeGreaterThan(lr1)
  })

  it('a deep price cut overloads the call centre and raises a consequence event (sales up → service slower)', () => {
    const n = simulateQuarter(withEvents(start(), ['ev-growth']), plan({ pricing: 'cut2', distribution: 'dealer' }, { pricing: 'flat' }), {}, { seed: 3 })
    expect(n.lastReport!.loads.contact).toBeGreaterThan(1.08)
    expect(n.lastReport!.consequences).toContain('callcenter-overload')
    expect(n.events.map((e) => e.id)).toContain('callcenter-overload')
    expect(n.lastReport!.drivers.some((d) => d.id === 'overload-contact')).toBe(true)
  })

  it('answering the overload with temporary staff restores capacity next quarter', () => {
    const s1 = simulateQuarter(withEvents(start(), ['ev-growth']), plan({ pricing: 'cut2' }, { pricing: 'flat' }), {}, { seed: 3 })
    const fixed = simulateQuarter(s1, defaultPlan(), { 'callcenter-overload': 'tempStaff' }, { seed: 4 })
    const ignored = simulateQuarter(s1, defaultPlan(), { 'callcenter-overload': 'acceptWait' }, { seed: 4 })
    expect(fixed.lastReport!.loads.contact).toBeLessThan(ignored.lastReport!.loads.contact)
    expect(fixed.kpis.satisfaction).toBeGreaterThan(ignored.kpis.satisfaction)
  })

  it('a flood that hits is cheaper with Cat XL, and pre-positioned surveyors protect satisfaction', () => {
    const s = withEvents(start('hard', 11), ['flood-central'])
    // find a seed where the flood hits
    let seed = 0
    while (simulateQuarter(s, defaultPlan(), {}, { seed }).lastReport!.flood !== 'hit') seed++
    const base = simulateQuarter(s, defaultPlan(), { 'flood-central': 'monitor' }, { seed })
    const xl = simulateQuarter(s, plan({ reinsurance: 'buyMore' }, { reinsurance: 'catXL' }), { 'flood-central': 'monitor' }, { seed })
    const prep = simulateQuarter(s, defaultPlan(), { 'flood-central': 'preposition' }, { seed })
    expect(xl.lastReport!.catLossNet).toBeLessThan(base.lastReport!.catLossNet)
    expect(prep.kpis.satisfaction).toBeGreaterThan(base.kpis.satisfaction)
    expect(prep.lastReport!.loads.claims).toBeLessThan(base.lastReport!.loads.claims)
  })

  it('reports competitor moves and ranked drivers', () => {
    const n = simulateQuarter(start(), plan({ pricing: 'cut1' }), {}, { seed: 5 })
    expect(n.lastReport!.competitorMoves.length).toBe(4)
    const w = n.lastReport!.drivers.map((d) => d.weight)
    expect([...w].sort((a, b) => b - a)).toEqual(w)
  })

  it('channel P&L columns add up and match the engine result', () => {
    const n = simulateQuarter(start(), plan({ distribution: 'digital', marketing: 'campaign' }), {}, { seed: 9 })
    const { columns, netUwResult, reinsurance } = n.lastReport!.pnl
    const total = columns.find((c) => c.id === 'total')!
    const ch = columns.filter((c) => c.id !== 'total')
    for (const k of ['writtenPremium', 'earnedPremium', 'incurredLoss', 'commission', 'marketing', 'otherUw', 'admin', 'uwResult'] as const)
      expect(ch.reduce((a, c) => a + c[k], 0)).toBeCloseTo(total[k], 6)
    expect(netUwResult).toBeCloseTo(n.lastReport!.uwResult, 6)
    expect(total.uwResult - reinsurance).toBeCloseTo(n.lastReport!.uwResult, 6)
    expect(total.incurredLoss / total.earnedPremium).toBeCloseTo(n.lastReport!.lossRatio, 6)
    expect((total.incurredLoss + total.expenseTotal) / total.earnedPremium).toBeCloseTo(n.kpis.combinedRatio, 6)
    // direct channel pays far less commission than agents
    const d = ch.find((c) => c.id === 'direct')!, a = ch.find((c) => c.id === 'agent')!
    expect(d.commission / d.writtenPremium).toBeLessThan(a.commission / a.writtenPremium)
  })

  it('ends the game after the last quarter with standings', () => {
    let s: GameState = { ...start(), config: { ...start().config, quarters: 12 } }
    for (let i = 0; i < 12 && !s.outcome; i++) {
      const t = scriptedTurn(s, 'balanced')
      s = simulateQuarter(s, t.plan, t.responses)
    }
    expect(s.outcome).not.toBeNull()
    expect(s.outcome!.standings.length).toBe(5)
  })
})

/* ---------- balance report: REPORT=1 npx vitest run src/game/sim ---------- */
function run(strategy: StrategyId, difficulty: Difficulty, seed: number, quarters: 12 | 20 = 12) {
  let s: GameState = { ...createInitialState({ ...DEFAULT_CONFIG, difficulty, seed, quarters }) }
  const consequences: Record<string, number> = {}
  let floods = 0
  while (!s.outcome) {
    const t = scriptedTurn(s, strategy)
    s = simulateQuarter(s, t.plan, t.responses)
    for (const c of s.lastReport!.consequences) consequences[c] = (consequences[c] ?? 0) + 1
    if (s.lastReport!.flood === 'hit') floods++
  }
  const me = s.outcome!.standings.find((x) => x.id === 'player')!
  return { ...me, rank: s.outcome!.playerRank, bankrupt: s.outcome!.reason === 'bankrupt', quarters: s.quarter.index, consequences, floods }
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

describe.runIf(process.env.REPORT)('balance report', () => {
  it('writes docs/balance-report.md', () => {
    const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i)
    const rows: string[] = []
    const strategies: StrategyId[] = ['passive', 'growth', 'balanced', 'profit']
    const names: Record<StrategyId, string> = { passive: 'ไม่ทำอะไร (คงเดิม)', growth: 'เน้นโต', balanced: 'สมดุล', profit: 'เน้นกำไร', smart: 'คิดตามสถานการณ์' }
    for (const difficulty of ['easy', 'normal', 'hard'] as Difficulty[]) {
      rows.push(`\n### ${difficulty}\n`, '| แนวเล่น | คะแนน (มัธยฐาน) | อันดับเฉลี่ย | ชนะ (อันดับ 1) | ล้มละลาย | ทุนปลายเกม (ล้านบาท) | ส่วนแบ่ง | CR เฉลี่ย | ความพอใจ | consequence ที่เกิดบ่อยสุด |', '|---|---|---|---|---|---|---|---|---|---|')
      for (const st of strategies) {
        const rs = SEEDS.map((seed) => run(st, difficulty, seed))
        const cons: Record<string, number> = {}
        rs.forEach((r) => Object.entries(r.consequences).forEach(([k, v]) => (cons[k] = (cons[k] ?? 0) + v)))
        const top = Object.entries(cons).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${k} (${(v / rs.length).toFixed(1)}/เกม)`).join(', ')
        rows.push(
          `| ${names[st]} | ${median(rs.map((r) => r.score))} | ${(rs.reduce((a, r) => a + r.rank, 0) / rs.length).toFixed(1)} | ${Math.round((100 * rs.filter((r) => r.rank === 1).length) / rs.length)}% | ${Math.round((100 * rs.filter((r) => r.bankrupt).length) / rs.length)}% | ${median(rs.map((r) => Math.round(r.capital))).toLocaleString('en-US')} | ${(median(rs.map((r) => r.share)) * 100).toFixed(1)}% | ${(median(rs.map((r) => r.avgCombinedRatio)) * 100).toFixed(1)}% | ${median(rs.map((r) => r.satisfaction)).toFixed(2)} | ${top || '-'} |`,
        )
      }
    }
    const md = `# Balance report (auto-generated)

เกม 12 ไตรมาส × ${SEEDS.length} seed ต่อช่อง · ทุนเริ่ม 2,000 ล้านบาท · ส่วนแบ่งเริ่ม 20%
**ตัวเลขทั้งหมดเป็นผลจำลองจากค่าประมาณการเพื่อเกม (src/game/sim/params.ts) ไม่ใช่ข้อมูลตลาดจริง**

แนวเล่น (scripted, ดู src/game/sim/strategies.ts):
- **ไม่ทำอะไร**: คงทุกการ์ด ตอบเหตุการณ์ด้วยทางที่ถูกที่สุด
- **เน้นโต**: ลดราคาเชิงรุก ทุ่มดีลเลอร์ แคมเปญใหญ่ รับความเสี่ยงเอง เปิดรับกว้าง
- **สมดุล**: คงราคา ลงทุนดิจิทัลและอู่ ซื้อ Cat XL คุมพื้นที่เสี่ยง ตอบเหตุการณ์แบบแก้ที่ต้นเหตุ
- **เน้นกำไร**: ขึ้นราคากลุ่มเสี่ยง ประหยัดการตลาด ซื้อ Quota share เข้มงวดการรับประกัน
${rows.join('\n')}
`
    writeFileSync('docs/balance-report.md', md)
    console.log(md)
  })
})
