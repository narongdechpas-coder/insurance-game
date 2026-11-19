import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './config'
import { defaultPlan } from './decisions/cards'
import { capacityWarning, forecastChannels, forecastPricing, settingsOf } from './forecast'
import { createInitialState } from './initialState'

const s = createInitialState({ ...DEFAULT_CONFIG, seed: 7 })

describe('forecasts (calm engine runs)', () => {
  it('a price cut buys share now and costs loss ratio once earned; a raise does the opposite', () => {
    const f = Object.fromEntries(forecastPricing(s, defaultPlan(), {}, settingsOf(s)).map((x) => [x.option, x]))
    expect(f.hold.dShare).toBe(0)
    expect(f.cut2.dShare).toBeGreaterThan(f.cut1.dShare)
    expect(f.cut1.dShare).toBeGreaterThan(0)
    expect(f.cut2.dLossRatioFull).toBeGreaterThan(f.cut1.dLossRatioFull)
    expect(f.cut1.dLossRatioFull).toBeGreaterThan(0)
    expect(f.raise1.dShare).toBeLessThan(0)
    expect(f.raise1.dLossRatioFull).toBeLessThan(0)
  })
  it('a higher dealer commission forecasts more dealer premium and more dealer commission', () => {
    const set = settingsOf(s)
    set.dealer.lever = 4
    const f = forecastChannels(s, defaultPlan(), {}, set)
    expect(f.dealer.dGwp).toBeGreaterThan(0)
    expect(f.dealer.dCommission).toBeGreaterThan(0)
    expect(f.agent.dGwp).toBeLessThanOrEqual(0.5)
  })
  it('the forecast is the same every time (no randomness)', () => {
    const a = forecastChannels(s, defaultPlan(), {}, settingsOf(s))
    const b = forecastChannels(s, defaultPlan(), {}, settingsOf(s))
    expect(a).toEqual(b)
  })
  it('warns when a deep price cut would overload the teams', () => {
    const p = defaultPlan()
    p.pricing = { option: 'cut2' }
    expect(capacityWarning(s, defaultPlan(), {}, settingsOf(s))).toBeNull()
    expect(capacityWarning(s, p, {}, settingsOf(s))).toMatch(/ล้น/)
  })
})

describe('pricing by segment', () => {
  it('cutting one segment grows it inside the book and moves share, premium and loss ratio', async () => {
    const { forecastSegments, keepPrices } = await import('./forecast')
    const steps = { ...keepPrices(), budget: 0 } // 2+/3+ −8%
    const f = forecastSegments(s, defaultPlan(), {}, settingsOf(s), steps)
    const b = f.find((x) => x.segment === 'budget')!
    expect(b.dShare).toBeGreaterThan(0)
    expect(b.dLossRatioFull).toBeGreaterThan(0)
    expect(f.find((x) => x.segment === 'newCar')!.dShare).toBe(0)
    // a price-sensitive segment reacts more than a low-sensitivity one for the same cut
    const ev = forecastSegments(s, defaultPlan(), {}, settingsOf(s), { ...keepPrices(), ev: 0 }).find((x) => x.segment === 'ev')!
    expect(b.dShare / 0.23).toBeGreaterThan(ev.dShare / 0.0925)
  })
  it('raising a segment above the market flags adverse selection', async () => {
    const { forecastSegments, keepPrices } = await import('./forecast')
    const f = forecastSegments(s, defaultPlan(), {}, settingsOf(s), { ...keepPrices(), oldCar: 4 })
    const o = f.find((x) => x.segment === 'oldCar')!
    expect(o.gapAfter).toBeGreaterThan(0.04)
    expect(o.dShare).toBeLessThan(0)
  })
  it('the engine keeps segment prices across quarters and shifts the book toward the cheaper segment', async () => {
    const { withChannelSettings, keepPrices } = await import('./forecast')
    const { simulateQuarter } = await import('./sim/engine')
    const { START_PORTFOLIO } = await import('./sim/v2')
    let g = simulateQuarter(withChannelSettings(s, settingsOf(s), { ...keepPrices(), budget: 0 }), defaultPlan(), {}, { calm: true })
    expect(g.sim.v2.segPrice.budget).toBeCloseTo(0.92, 6)
    expect(g.sim.v2.segPrice.newCar).toBe(1)
    g = simulateQuarter({ ...g, events: [] }, defaultPlan(), {}, { calm: true })
    expect(g.sim.v2.segPrice.budget).toBeCloseTo(0.92, 6)
    expect(g.lastReport!.v2.portfolio.budget).toBeGreaterThan(START_PORTFOLIO.budget)
  })
})
