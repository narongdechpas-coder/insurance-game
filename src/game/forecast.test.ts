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
