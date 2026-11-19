import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { CARD_BY_ID, choiceFor, defaultPlan } from '../decisions/cards'
import type { QuarterPlan } from '../decisions/types'
import { createInitialState } from '../initialState'
import type { GameState } from '../types'
import { simulateQuarter } from './engine'
import { bookFactors, CHANNEL_IDS, START_CHANNEL_MIX, START_PORTFOLIO } from './v2'

const plan = (over: Partial<Record<keyof QuarterPlan, string>> = {}, tactics: Partial<Record<keyof QuarterPlan, string>> = {}) => {
  const p = defaultPlan()
  for (const [k, v] of Object.entries(over) as [keyof QuarterPlan, string][]) p[k] = choiceFor(CARD_BY_ID[k].options.find((o) => o.id === v)!)
  for (const [k, t] of Object.entries(tactics) as [keyof QuarterPlan, string][]) p[k] = { ...p[k], tactic: t }
  return p
}
const start = (seed = 7) => createInitialState({ ...DEFAULT_CONFIG, difficulty: 'normal', seed })
const quiet = (s: GameState): GameState => ({ ...s, events: [] })
const withLever = (s: GameState, c: 'dealer' | 'agent' | 'direct', lever: number): GameState => {
  const sim = structuredClone(s.sim)
  sim.v2.channels[c].lever = lever
  return { ...s, sim }
}
const run = (s: GameState, p: QuarterPlan, n: number) => {
  for (let i = 0; i < n; i++) s = simulateQuarter(quiet(s), p, {})
  return s
}

describe('engine v2', () => {
  it('starts from the channel table: book factors are neutral and the portfolio is derived from channels', () => {
    const s = start()
    const f = bookFactors(s.sim.v2, s.sim.mix)
    expect(f.lr).toBeCloseTo(1, 6)
    expect(f.flood).toBeCloseTo(1, 6)
    expect(s.sim.mix).toEqual(START_CHANNEL_MIX)
    expect(START_PORTFOLIO.newCar).toBeCloseTo(0.3675, 4)
  })

  it('a higher dealer commission grows share and the dealer channel, at a higher commission cost', () => {
    const base = run(start(), plan(), 3)
    const high = run(withLever(start(), 'dealer', 4), plan(), 3)
    expect(high.kpis.marketShare).toBeGreaterThan(base.kpis.marketShare)
    expect(high.sim.mix.dealer).toBeGreaterThan(base.sim.mix.dealer)
    const dealerRate = (s: GameState) => {
      const d = s.lastReport!.pnl.columns.find((c) => c.id === 'dealer')!
      return d.commission / d.writtenPremium
    }
    expect(dealerRate(high)).toBeCloseTo(dealerRate(base) + 0.04, 3)
  })

  it('a commission cut saves cost but intermediaries send less business and renew less', () => {
    const base = run(start(), plan(), 3)
    const low = run(withLever(start(), 'agent', 0), plan(), 3)
    expect(low.kpis.marketShare).toBeLessThan(base.kpis.marketShare)
    expect(low.lastReport!.v2.renewal.agent).toBeLessThan(base.lastReport!.v2.renewal.agent)
  })

  it('taking older cars shifts the book toward that segment and raises the loss-ratio factor', () => {
    const s = run(start(), plan({ underwriting: 'broad' }, { underwriting: 'oldCars' }), 3)
    expect(s.lastReport!.v2.portfolio.oldCar).toBeGreaterThan(START_PORTFOLIO.oldCar + 0.05)
    expect(bookFactors(s.sim.v2, s.sim.mix).lr).toBeGreaterThan(1)
  })

  it('channel loss ratios differ because channels sell different segments, and still add up to the total', () => {
    const s = run(start(), plan(), 2)
    const cols = s.lastReport!.pnl.columns
    const lr = (id: string) => {
      const c = cols.find((x) => x.id === id)!
      return c.incurredLoss / c.earnedPremium
    }
    expect(lr('agent')).toBeGreaterThan(lr('direct')) // agent sells older cars; direct sells 2+/3+
    const total = cols.find((c) => c.id === 'total')!
    const sum = CHANNEL_IDS.reduce((a, id) => a + cols.find((c) => c.id === id)!.incurredLoss, 0)
    expect(sum).toBeCloseTo(total.incurredLoss, 6)
  })

  it('a big campaign builds brand; saving on marketing lets it fade', () => {
    const up = run(start(), plan({ marketing: 'campaign' }), 3)
    const down = run(start(), plan({ marketing: 'save' }), 3)
    expect(up.lastReport!.v2.brand).toBeGreaterThan(55)
    expect(down.lastReport!.v2.brand).toBeLessThan(50)
  })

  it('service quality grows with investment and falls when teams are overloaded', () => {
    const invest = run(start(), plan({ repair: 'premium' }), 3)
    const overload = run(start(), plan({ pricing: 'cut2' }), 3)
    expect(invest.lastReport!.v2.service).toBeGreaterThan(55)
    expect(overload.lastReport!.v2.service).toBeLessThan(invest.lastReport!.v2.service)
  })
})
