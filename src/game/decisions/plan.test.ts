import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { createInitialState } from '../initialState'
import { CARDS, defaultPlan, isUnlocked, QUARTER_BUDGET_MB } from './cards'
import { budgetLeft, changedCards, planCost, previewImpact, reviewPlan } from './plan'

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
    const p = { ...defaultPlan(), pricing: 'cut2', underwriting: 'broad', marketing: 'campaign', distribution: 'dealer' }
    const i = previewImpact(p)
    expect(i.growth).toBe(3) // 2+2+2+2 → clamped
    expect(i.profit).toBe(-3) // -2-1+0-1 = -4 → clamped
  })
  it('is deterministic', () => {
    const p = { ...defaultPlan(), pricing: 'raise1' }
    expect(previewImpact(p)).toEqual(previewImpact({ ...p }))
  })
})

describe('advisor review', () => {
  it('flags over-budget plans', () => {
    const p = { ...defaultPlan(), marketing: 'campaign', distribution: 'digital', reinsurance: 'buyMore', repair: 'ev' }
    expect(budgetLeft(p)).toBeLessThan(0)
    expect(reviewPlan(p, state).some((n) => n.id === 'budget')).toBe(true)
  })
  it('warns about retaining risk during the flood event', () => {
    const p = { ...defaultPlan(), reinsurance: 'retain' }
    expect(reviewPlan(p, state).find((n) => n.id === 'flood')?.tone).toBe('warning')
  })
  it('suggests a response to the rival promotion when doing nothing', () => {
    expect(reviewPlan(defaultPlan(), state).some((n) => n.id === 'rival-tip')).toBe(true)
  })
})
