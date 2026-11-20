import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { keptPlan } from '../decisions/plan'
import { createInitialState } from '../initialState'
import type { GameState } from '../types'
import { simulateQuarter } from './engine'
import { priceSensitivityFor } from './init'
import { withChannelSettings, settingsOf } from '../forecast'
import { SEGMENT_IDS } from './v2'

/** Quality pricing: well-liked companies lose fewer customers when they raise prices. */
const start = (sat: number): GameState => {
  const s = createInitialState({ ...DEFAULT_CONFIG, seed: 5, quarters: 20 })
  return { ...s, events: [], sim: { ...s.sim, player: { ...s.sim.player, satisfaction: sat } } }
}
const raise = (s: GameState) => {
  const steps = Object.fromEntries(SEGMENT_IDS.map((k) => [k, 4])) as never // +8% everywhere
  return simulateQuarter(withChannelSettings(s, settingsOf(s), steps), keptPlan(s), {}, { calm: true })
}
const hold = (s: GameState) => simulateQuarter(s, keptPlan(s), {}, { calm: true })

describe('quality pricing', () => {
  it('the multiplier follows satisfaction within its limits', () => {
    expect(priceSensitivityFor(3.8)).toBeCloseTo(1, 6)
    expect(priceSensitivityFor(4.8)).toBeCloseTo(0.65, 6)
    expect(priceSensitivityFor(2.8)).toBeCloseTo(1.35, 6)
    expect(priceSensitivityFor(1)).toBe(1.6)
    expect(priceSensitivityFor(5)).toBeCloseTo(0.58, 6)
  })

  it('a price rise costs a 4.8-star company far less share than a 2.8-star one', () => {
    const lossAt = (sat: number) => 1 - raise(start(sat)).kpis.marketShare / hold(start(sat)).kpis.marketShare
    const good = lossAt(4.8)
    const poor = lossAt(2.8)
    console.log('relative share lost on +8%: 4.8★', good.toFixed(4), '2.8★', poor.toFixed(4))
    expect(good).toBeGreaterThan(0)
    expect(good).toBeLessThan(poor * 0.7)
  })

  it('a price cut is not scaled by quality', () => {
    const cut = (s: GameState) => simulateQuarter(withChannelSettings(s, settingsOf(s), Object.fromEntries(SEGMENT_IDS.map((k) => [k, 0])) as never), keptPlan(s), {}, { calm: true })
    const gain = (sat: number) => cut(start(sat)).kpis.marketShare / hold(start(sat)).kpis.marketShare - 1
    expect(Math.abs(gain(4.8) - gain(2.8))).toBeLessThan(0.15 * gain(2.8))
  })

  it('renewing customers meet the price change of the year at the renewal season, scaled by quality at the end of Q4', () => {
    const year = (sat: number, rise: boolean) => {
      let s = start(sat)
      s = rise ? raise(s) : hold(s)
      for (let i = 0; i < 3; i++) s = hold({ ...s, events: [], sim: { ...s.sim, player: { ...s.sim.player, satisfaction: sat } } })
      return s.sim.v2.renewal!
    }
    const flat = year(3.8, false)
    expect(flat.priceChange).toBeCloseTo(0, 6)
    expect(flat.priceEffect).toBeCloseTo(0, 6)
    const mid = year(3.8, true)
    expect(mid.priceChange).toBeGreaterThan(0.05)
    expect(mid.priceEffect).toBeCloseTo(-0.5 * mid.priceChange * priceSensitivityFor(mid.satisfaction), 6)
    const happy = year(4.8, true)
    expect(-happy.priceEffect).toBeLessThan(-mid.priceEffect)
  })

  it('after the renewal season the new price becomes the reference', () => {
    let s = raise(start(3.8))
    for (let i = 0; i < 3; i++) s = hold(s)
    s = hold({ ...s, events: s.events.filter((e) => e.id === 'renewal-season') })
    expect(s.sim.v2.lastRenewalPrice).toBeCloseTo(s.sim.player.price, 6)
  })
})
