import { writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { createInitialState } from '../initialState'
import type { GameState } from '../types'
import { simulateQuarter } from './engine'
import { scriptedTurn, type StrategyId } from './strategies'
import { LEVER_COEF } from './v2'
import { P } from './params'

function run(strategy: StrategyId, levers: Record<string, number>, focus: Record<string, string | null>, seed: number) {
  let s: GameState = createInitialState({ ...DEFAULT_CONFIG, difficulty: 'normal', seed, quarters: 12 })
  while (!s.outcome) {
    const sim = structuredClone(s.sim)
    for (const c of ['dealer', 'agent', 'direct'] as const) {
      sim.v2.channels[c].lever = levers[c] ?? 2
      sim.v2.channels[c].focus = (focus[c] ?? null) as never
    }
    s = { ...s, sim }
    const t = scriptedTurn(s, strategy)
    s = { ...s, sim: { ...s.sim, ops: { ...s.sim.ops, target: t.staff ?? {}, orders: t.orders } } }
    s = simulateQuarter(s, t.plan, t.responses)
  }
  const me = s.outcome!.standings.find((x) => x.id === 'player')!
  return { score: me.score, rank: s.outcome!.playerRank, cap: me.capital, share: me.share, cr: me.avgCombinedRatio, sat: me.satisfaction, bk: s.outcome!.reason === 'bankrupt', mix: s.sim.mix }
}
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
describe.runIf(process.env.REPORT)('lever report', () => it('writes docs/lever-report.md', () => {
  const seeds = Array.from({ length: 40 }, (_, i) => 1000 + i)
  const cases: [string, StrategyId, Record<string, number>, Record<string, string | null>][] = [
    ['balanced, levers neutral', 'balanced', {}, {}],
    ['balanced, all commission -4 / ads -50%', 'balanced', { dealer: 0, agent: 0, direct: 0 }, {}],
    ['balanced, all commission -2 / ads -25%', 'balanced', { dealer: 1, agent: 1, direct: 1 }, {}],
    ['balanced, all +2 / +25%', 'balanced', { dealer: 3, agent: 3, direct: 3 }, {}],
    ['balanced, all +4 / +50%', 'balanced', { dealer: 4, agent: 4, direct: 4 }, {}],
    ['balanced, agent +4 only', 'balanced', { agent: 4 }, {}],
    ['balanced, direct ads +50% only', 'balanced', { direct: 4 }, {}],
    ['balanced, focus budget everywhere', 'balanced', {}, { dealer: 'budget', agent: 'budget', direct: 'budget' }],
    ['balanced, focus newCar everywhere', 'balanced', {}, { dealer: 'newCar', agent: 'newCar', direct: 'newCar' }],
    ['balanced, focus nonMotor everywhere', 'balanced', {}, { dealer: 'nonMotor', agent: 'nonMotor', direct: 'nonMotor' }],
    ['passive, levers neutral', 'passive', {}, {}],
    ['passive, all -4', 'passive', { dealer: 0, agent: 0, direct: 0 }, {}],
    ['growth, levers neutral', 'growth', {}, {}],
    ['profit, levers neutral', 'profit', {}, {}],
    ['smart, levers neutral', 'smart', {}, {}],
  ]
  const lines: string[] = []
  const cfgs = JSON.parse(process.env.CFGS ?? '[{}]')
  for (const cfg of cfgs) {
  const { baseLR, ...lc } = cfg
  Object.assign(LEVER_COEF, lc)
  if (baseLR) (P as { baseLossRatio: number }).baseLossRatio = baseLR
  lines.push('== ' + JSON.stringify(LEVER_COEF) + ' baseLR ' + P.baseLossRatio)
  for (const [name, st, lv, fo] of cases.filter((c) => !process.env.ONLY || c[0].match(process.env.ONLY))) {
    const rs = seeds.map((sd) => run(st, lv, fo, sd))
    const m = rs[0].mix
    lines.push(`${name.padEnd(42)} score ${med(rs.map((r) => r.score))} rank ${(rs.reduce((a, r) => a + r.rank, 0) / rs.length).toFixed(1)} win ${Math.round((100 * rs.filter((r) => r.rank === 1).length) / rs.length)}% bk ${Math.round((100 * rs.filter((r) => r.bk).length) / rs.length)}% cap ${Math.round(med(rs.map((r) => r.cap)))} share ${(med(rs.map((r) => r.share)) * 100).toFixed(1)} CR ${(med(rs.map((r) => r.cr)) * 100).toFixed(1)} sat ${med(rs.map((r) => r.sat)).toFixed(2)} mix ${(m.dealer * 100).toFixed(0)}/${(m.agent * 100).toFixed(0)}/${(m.direct * 100).toFixed(0)}`)
  }
  }
  const md = `# Lever report (auto-generated: REPORT=1 npx vitest run src/game/sim)

ระดับ Normal · 12 ไตรมาส · 40 seed ต่อแถว · ค่ามัธยฐาน · ตัวเลขทั้งหมดเป็นผลจำลองจากสมมติฐานของเกม ไม่ใช่ข้อมูลตลาด
slider: 0 = −4 จุด (Direct −50%), 2 = เท่าตลาด, 4 = +4 จุด (Direct +50%) · mix = Dealer/Agent/Direct ของเราตอนจบเกม

\`\`\`
${lines.join('\n')}
\`\`\`
`
  writeFileSync('docs/lever-report.md', md)
}))
