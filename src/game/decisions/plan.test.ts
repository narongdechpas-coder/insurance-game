import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { createInitialState } from '../initialState'
import { CARD_BY_ID, CARDS, choiceFor, defaultPlan, isUnlocked, QUARTER_BUDGET_MB } from './cards'
import { budgetLeft, changedCards, planCost, previewImpact, reviewPlan, tacticOf } from './plan'
import type { DecisionId, QuarterPlan } from './types'

/** Plan from option ids (each gets its recommended tactic); `tactics` overrides the tactic. */
function mk(options: Partial<Record<DecisionId, string>>, tactics: Partial<Record<DecisionId, string>> = {}): QuarterPlan {
  const p = defaultPlan()
  for (const [id, opt] of Object.entries(options) as [DecisionId, string][]) {
    p[id] = choiceFor(CARD_BY_ID[id].options.find((o) => o.id === opt)!)
  }
  for (const [id, t] of Object.entries(tactics) as [DecisionId, string][]) p[id] = { ...p[id], tactic: t }
  return p
}

const state = createInitialState(DEFAULT_CONFIG)

describe('cards data', () => {
  it('every default option exists and option ids are unique per card', () => {
    for (const c of CARDS) {
      expect(c.options.some((o) => o.id === c.defaultOption)).toBe(true)
      expect(new Set(c.options.map((o) => o.id)).size).toBe(c.options.length)
    }
  })
  it('Q1 unlocks exactly the 4 core cards', () => {
    expect(CARDS.filter((c) => isUnlocked(c, 0)).map((c) => c.id)).toEqual(['pricing', 'distribution', 'marketing', 'reinsurance'])
    expect(CARDS.every((c) => isUnlocked(c, 0, true))).toBe(true)
  })
})

describe('plan helpers', () => {
  it('default plan: no changes, neutral impact, only baseline marketing spend', () => {
    const p = defaultPlan()
    expect(changedCards(p)).toEqual([])
    expect(previewImpact(p)).toEqual({ growth: 0, profit: 0, risk: 0, cx: 0 })
    expect(planCost(p)).toBe(25)
    expect(budgetLeft(p)).toBe(QUARTER_BUDGET_MB - 25)
  })
  it('impacts add up and clamp to ±3', () => {
    const p = mk({ pricing: 'cut2', underwriting: 'broad', marketing: 'campaign', distribution: 'dealer' })
    const i = previewImpact(p)
    expect(i.growth).toBe(3) // 2+2+2+2 → clamped
    expect(i.profit).toBe(-3) // -2-1+0-1 = -4 → clamped
  })
  it('is deterministic', () => {
    const p = mk({ pricing: 'raise1' })
    expect(previewImpact(p)).toEqual(previewImpact(structuredClone(p)))
  })
})

describe('tactics (layer 2)', () => {
  it('choosing a stance pre-selects its recommended tactic', () => {
    const p = mk({ marketing: 'campaign' })
    expect(p.marketing.tactic).toBe('inHouse')
    expect(tacticOf(p, 'marketing')?.recommended).toBe(true)
  })
  it('tactic replaces the stance cost', () => {
    expect(planCost(mk({ marketing: 'campaign' }))).toBe(60)
    expect(planCost(mk({ marketing: 'campaign' }, { marketing: 'ambassador' }))).toBe(95)
  })
  it('tactic modifies the stance impact', () => {
    const base = previewImpact(mk({ marketing: 'campaign' }))
    const amb = previewImpact(mk({ marketing: 'campaign' }, { marketing: 'ambassador' }))
    const sp = previewImpact(mk({ marketing: 'campaign' }, { marketing: 'sponsor' }))
    expect(amb.growth).toBe(base.growth + 1)
    expect(sp.growth).toBe(base.growth - 1)
    expect(sp.cx).toBe(base.cx + 1)
  })
  it('every tactic in a stance differs from its siblings in cost or impact', () => {
    for (const c of CARDS)
      for (const o of c.options) {
        const sigs = (o.tactics ?? []).map((t) => JSON.stringify([t.cost, t.impact, t.speed, t.duration]))
        expect(new Set(sigs).size).toBe(sigs.length)
        if (o.tactics) expect(o.tactics.filter((t) => t.recommended).length).toBe(1)
      }
  })
  it('stances without tactics carry no tactic', () => {
    expect(mk({ marketing: 'maintain' }).marketing.tactic).toBeUndefined()
  })
})

describe('advisor review', () => {
  it('warns about cutting the marketing team while a rival attacks', () => {
    expect(reviewPlan(mk({ marketing: 'save' }, { marketing: 'cutTeam' }), state).some((n) => n.id === 'cut-team')).toBe(true)
  })
  it('flags over-budget plans', () => {
    const p = mk({ marketing: 'campaign', distribution: 'digital', reinsurance: 'buyMore', repair: 'ev' })
    expect(budgetLeft(p)).toBeLessThan(0)
    expect(reviewPlan(p, state).some((n) => n.id === 'budget')).toBe(true)
  })
  it('warns about retaining risk during the flood event', () => {
    const p = mk({ reinsurance: 'retain' })
    expect(reviewPlan(p, state).find((n) => n.id === 'flood')?.tone).toBe('warning')
  })
  it('suggests a response to the rival promotion when doing nothing', () => {
    expect(reviewPlan(defaultPlan(), state).some((n) => n.id === 'rival-tip')).toBe(true)
  })
})
