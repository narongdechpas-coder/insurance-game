import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { EVENT_BY_ID } from '../data/events'
import { CARDS, defaultPlan } from '../decisions/cards'
import { choiceCost, choiceImpact } from '../decisions/plan'
import { SCENARIOS, type Responses } from '../decisions/scenarios'
import type { DecisionId, Impact, ImpactAxis, QuarterPlan } from '../decisions/types'
import { createInitialState } from '../initialState'
import type { GameState } from '../types'
import { simulateQuarter } from './engine'

/**
 * Strategy audit: do the arrows on each option (โต / กำไร / เสี่ยง / ลูกค้า) match what the engine
 * actually does? Each choice is played for one quarter on the same starting point, then two more
 * quarters of the default plan, and compared with the default plan over the same three quarters.
 *
 * - โต      = market share after 3 quarters (points)
 * - กำไร    = U/W result over 3 quarters, adding back the option's own budget (shown separately on the card)
 * - เสี่ยง  = spread of the 3-quarter U/W result over 24 random seeds (floods, noise)
 * - ลูกค้า  = satisfaction after 3 quarters (stars)
 *
 * Writes docs/strategy-audit.md. Run: REPORT=1 npx vitest run src/game/sim/strategy-audit
 */

const AXES: ImpactAxis[] = ['growth', 'profit', 'risk', 'cx']
const NAME: Record<ImpactAxis, string> = { growth: 'โต', profit: 'กำไร', risk: 'เสี่ยง', cx: 'ลูกค้า' }
/** smallest measured change that counts as an effect */
const NOISE: Record<ImpactAxis, number> = { growth: 0.0005, profit: 3, risk: 0.03, cx: 0.005 }
const SEEDS = Array.from({ length: 24 }, (_, i) => 500 + i)

function startState(): GameState {
  // one quiet default quarter first, so lags and the report exist
  const s = createInitialState({ ...DEFAULT_CONFIG, seed: 11, quarters: 20 })
  return simulateQuarter({ ...s, events: [] }, defaultPlan(), {}, { calm: true })
}

const FLOOD = EVENT_BY_ID['flood-central']
/** Risk runs keep a flood warning active every quarter: in this game, risk is mostly the big-loss tail. */
function run(base: GameState, plan: QuarterPlan, responses: Responses, events: GameState['events'], calm: boolean, seed?: number) {
  const withFlood = (evs: GameState['events']) => (calm ? evs : [...evs.filter((e) => e.id !== FLOOD.id), FLOOD])
  const floodAnswer = calm ? {} : { 'flood-central': responses['flood-central'] ?? 'absorb' }
  let s = simulateQuarter({ ...base, events: withFlood(events) }, plan, { ...floodAnswer, ...responses }, { calm, seed })
  let uw = s.lastReport!.uwResult
  for (let i = 0; i < 2; i++) {
    s = simulateQuarter({ ...s, events: withFlood([]) }, defaultPlan(), floodAnswer, { calm, seed })
    uw += s.lastReport!.uwResult
  }
  return { share: s.kpis.marketShare, sat: s.kpis.satisfaction, uw }
}

function measure(base: GameState, plan: QuarterPlan, responses: Responses, events: GameState['events'], cost: number) {
  const c = run(base, plan, responses, events, true)
  const spreads = SEEDS.map((sd) => run(base, plan, responses, events, false, sd).uw)
  const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length
  const sd = Math.sqrt(spreads.reduce((a, b) => a + (b - mean) ** 2, 0) / spreads.length)
  return { growth: c.share, profit: c.uw + cost, risk: sd, cx: c.sat }
}
type M = ReturnType<typeof measure>

interface Row {
  group: string
  label: string
  shown: Impact
  delta: Record<ImpactAxis, number>
}

const sign = (x: number, axis: ImpactAxis) => (Math.abs(x) < NOISE[axis] ? 0 : Math.sign(x))
/** risk is "higher = worse", like the arrow: measured risk delta is relative spread change */
const deltaOf = (m: M, b: M): Record<ImpactAxis, number> => ({
  growth: m.growth - b.growth,
  profit: m.profit - b.profit,
  risk: b.risk > 0 ? m.risk / b.risk - 1 : 0,
  cx: m.cx - b.cx,
})

function problems(rows: Row[]) {
  const out: string[] = []
  for (const r of rows)
    for (const a of AXES) {
      const s = Math.sign(r.shown[a])
      const m = sign(r.delta[a], a)
      if (s !== 0 && m !== s) out.push(`${r.group} · ${r.label}: ลูกศร${NAME[a]} ${r.shown[a] > 0 ? '+' : ''}${r.shown[a]} แต่ผลจริง ${fmt(r.delta[a], a)}`)
      if (s === 0 && m !== 0 && Math.abs(r.delta[a]) > NOISE[a] * 6) out.push(`${r.group} · ${r.label}: ลูกศร${NAME[a]} 0 แต่ผลจริง ${fmt(r.delta[a], a)}`)
    }
  // ranking inside a group: more arrows must mean more effect
  const groups = [...new Set(rows.map((r) => r.group))]
  for (const g of groups) {
    const rs = rows.filter((r) => r.group === g)
    for (const a of AXES)
      for (const x of rs)
        for (const y of rs)
          if (x.shown[a] > y.shown[a] && x.delta[a] < y.delta[a] - NOISE[a] * 2)
            out.push(`${g}: ${x.label} (${NAME[a]} ${x.shown[a]}) ได้ผลน้อยกว่า ${y.label} (${NAME[a]} ${y.shown[a]}) · ${fmt(x.delta[a], a)} vs ${fmt(y.delta[a], a)}`)
  }
  return out
}

function fmt(v: number, a: ImpactAxis) {
  if (a === 'growth') return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)} จุดส่วนแบ่ง`
  if (a === 'profit') return `${v >= 0 ? '+' : ''}${Math.round(v)} ล้าน`
  if (a === 'risk') return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)}% ความแกว่ง`
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)} ดาว`
}

describe.runIf(process.env.REPORT)('strategy audit', () => {
  it('writes docs/strategy-audit.md', () => {
    const base = startState()
    const rows: Row[] = []
    const baseline = measure(base, defaultPlan(), {}, [], 0)

    // strategy cards (pricing and distribution have their own screens now; their sliders are audited by the forecasts)
    for (const c of CARDS.filter((x) => x.id !== 'pricing' && x.id !== 'distribution')) {
      for (const o of c.options) {
        const choices = o.tactics ? o.tactics.map((t) => ({ option: o.id, tactic: t.id, label: `${o.label} · ${t.label}` })) : [{ option: o.id, tactic: undefined, label: o.label }]
        for (const ch of choices) {
          const plan = { ...defaultPlan(), [c.id]: { option: ch.option, tactic: ch.tactic } } as QuarterPlan
          // the default stance already spends its own budget: add back only the difference
          const m = measure(base, plan, {}, [], choiceCost(plan, c.id as DecisionId) - choiceCost(defaultPlan(), c.id as DecisionId))
          rows.push({ group: c.title, label: ch.label, shown: choiceImpact(plan, c.id as DecisionId), delta: deltaOf(m, baseline) })
        }
      }
    }

    // event responses: compared within each event (same event active, different answers)
    for (const sc of SCENARIOS) {
      const ev = EVENT_BY_ID[sc.eventId]
      if (!ev) continue
      const zero = sc.responses.find((r) => AXES.every((a) => r.impact[a] === 0)) ?? sc.responses[sc.responses.length - 1]
      const ref = measure(base, defaultPlan(), { [sc.eventId]: zero.id }, [ev], zero.cost)
      for (const resp of sc.responses) {
        const m = measure(base, defaultPlan(), { [sc.eventId]: resp.id }, [ev], resp.cost)
        // shown impact relative to the reference answer, so "ปล่อยไว้" with growth −1 reads as worse than the rest
        const shown = Object.fromEntries(AXES.map((a) => [a, resp.impact[a] - zero.impact[a]])) as Impact
        rows.push({ group: `เหตุการณ์: ${ev.title}`, label: resp.label, shown, delta: deltaOf(m, ref) })
      }
    }

    const issues = problems(rows)
    const arrow = (v: number) => (v > 0 ? '+'.repeat(v) : v < 0 ? '−'.repeat(-v) : '0')
    const table = rows.map((r) => `| ${r.group} | ${r.label} | ${AXES.map((a) => `${arrow(r.shown[a])} / ${fmt(r.delta[a], a)}`).join(' | ')} |`)
    const md = `# Strategy audit (auto-generated)

ลูกศรบนการ์ดเทียบกับผลจริงจาก engine · เล่นตัวเลือกนั้น 1 ไตรมาส แล้วตามด้วยแผนปกติ 2 ไตรมาส เทียบกับแผนปกติทั้ง 3 ไตรมาส
กำไรบวกงบของตัวเลือกคืนแล้ว (งบแสดงแยกบนการ์ด) · ความเสี่ยงวัดจากความแกว่งของผล U/W ใน ${SEEDS.length} การสุ่ม · ทางรับมือเหตุการณ์เทียบกับทางที่ลูกศรเป็น 0 ของเหตุการณ์เดียวกัน
ตัวเลขทั้งหมดเป็นผลจำลองของเกม

## จุดที่ลูกศรไม่ตรงกับผลจริง (${issues.length})

${issues.length ? issues.map((x) => `- ${x}`).join('\n') : '- ไม่มี'}

## ทุกตัวเลือก (ลูกศร / ผลจริง)

| กลุ่ม | ตัวเลือก | โต | กำไร | เสี่ยง | ลูกค้า |
|---|---|---|---|---|---|
${table.join('\n')}
`
    writeFileSync('docs/strategy-audit.md', md)
    expect(rows.length).toBeGreaterThan(40)
  })
})
