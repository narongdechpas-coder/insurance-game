import { describe, expect, it } from 'vitest'
import { attributePlan, choiceKey, deltaOf, forecastCard, keptDraft, neutralResponses, playDraft, type Draft } from './choiceForecast'
import { DEFAULT_CONFIG } from './config'
import { keptPlan } from './decisions/plan'
import { keepPrices, settingsOf, staffOf } from './forecast'
import { createInitialState } from './initialState'
import { simulateQuarter } from './sim/engine'
import type { GameState } from './types'

/** Phase 3: numbers on cards come from the engine, arrows come from the numbers, attribution adds up. */

const start = () => createInitialState({ ...DEFAULT_CONFIG, seed: 7, quarters: 20 })
const draftOf = (s: GameState, over: Partial<Draft> = {}): Draft => ({ plan: keptPlan(s), responses: neutralResponses(s, {}), channels: settingsOf(s), steps: keepPrices(), staff: staffOf(s), orders: [], ...over })

describe('engine numbers on cards', () => {
  it('keeping everything is the reference: zero change', () => {
    const s = start()
    const d = draftOf(s)
    const t = deltaOf(playDraft(s, d), playDraft(s, keptDraft(s, d)))
    expect(t.dGwp).toBeCloseTo(0, 6)
    expect(t.dUw3).toBeCloseTo(0, 6)
    expect(t.arrows).toEqual({ growth: 0, profit: 0, risk: 0, cx: 0 })
  })

  it('arrows always point the way the numbers do', () => {
    const s = start()
    for (const card of ['marketing', 'reinsurance'] as const) {
      const fc = forecastCard(s, draftOf(s), card)
      for (const d of Object.values(fc)) {
        if (d.arrows.growth) expect(Math.sign(d.arrows.growth)).toBe(Math.sign(d.gwpPct))
        if (d.arrows.profit) expect(Math.sign(d.arrows.profit)).toBe(Math.sign(d.dUw3))
        if (d.arrows.cx) expect(Math.sign(d.arrows.cx)).toBe(Math.sign(d.dSat3))
        if (d.arrows.risk) expect(Math.sign(d.arrows.risk)).toBe(Math.sign(d.floodPct))
      }
    }
  })

  it('a card number equals playing it out by hand', () => {
    const s = start()
    const d = draftOf(s)
    const fc = forecastCard(s, d, 'marketing')
    const c = { option: 'campaign', tactic: 'ambassador' }
    const own = playDraft(s, { ...d, plan: { ...d.plan, marketing: c } })
    const base = playDraft(s, d)
    expect(fc[choiceKey(c)].dUw3).toBeCloseTo(own.uw3 - base.uw3, 6)
    // and the first quarter of that path is the real (calm) engine quarter
    const real = simulateQuarter(s, { ...d.plan, marketing: c }, {}, { calm: true })
    expect(own.gwp).toBeCloseTo(real.lastReport!.gwp, 6)
  })

  it('in Q1 buying Cat XL cuts the flood loss (risk arrow down); outside Q1 it changes nothing', () => {
    const s = start()
    const fc = forecastCard(s, draftOf(s), 'reinsurance')
    expect(fc[choiceKey({ option: 'buyMore', tactic: 'catXL' })].dFloodLoss).toBeLessThan(0)
    expect(fc[choiceKey({ option: 'buyMore', tactic: 'catXL' })].arrows.risk).toBeLessThan(0)
    const q2 = simulateQuarter(s, keptPlan(s), {}, { calm: true })
    const fc2 = forecastCard(q2, draftOf(q2), 'reinsurance')
    expect(fc2[choiceKey({ option: 'buyMore', tactic: 'catXL' })].dFloodLoss).toBeCloseTo(0, 6)
  })

  it('the confirm screen rows add up exactly to the whole plan', () => {
    const s = start()
    const d = draftOf(s, {
      plan: { ...keptPlan(s), marketing: { option: 'campaign', tactic: 'inHouse' }, reinsurance: { option: 'buyMore', tactic: 'catXL' } },
      steps: { ...keepPrices(), budget: 0 },
      staff: { claims: 130, contact: 40 },
      orders: ['chatbot'],
    })
    const a = attributePlan(s, d)
    expect(a.rows.map((r) => r.id).sort()).toEqual(['marketing', 'price', 'reinsurance', 'staff', 'systems'].sort())
    for (const k of ['dGwp', 'dUw3', 'dSat3', 'dFloodLoss'] as const)
      expect(a.rows.reduce((x, r) => x + r.delta[k], 0) + a.together[k]).toBeCloseTo(a.total[k], 6)
  })
})
