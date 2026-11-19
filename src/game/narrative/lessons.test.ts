import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { CARD_BY_ID, choiceFor, defaultPlan } from '../decisions/cards'
import { createInitialState } from '../initialState'
import { simulateQuarter } from '../sim/engine'
import { scriptedTurn } from '../sim/strategies'
import type { GameState } from '../types'
import { lessons, turningPoints, winnerNote } from './lessons'

const playOut = (seed: number, cut: boolean) => {
  let s: GameState = createInitialState({ ...DEFAULT_CONFIG, seed, quarters: 12 })
  while (!s.outcome) {
    const t = scriptedTurn(s, 'balanced')
    if (cut && s.quarter.index < 2) t.plan.pricing = choiceFor(CARD_BY_ID.pricing.options.find((o) => o.id === 'cut2')!)
    s = simulateQuarter(s, t.plan, t.responses)
  }
  return s
}

describe('end-of-game lessons', () => {
  it('logs every quarter', () => {
    const s = playOut(1001, false)
    expect(s.sim.log).toHaveLength(12)
    expect(s.sim.log[0].label).toBe('Q1/1')
  })
  it('a game with price cuts gets a price-cut lesson quoting its own numbers', () => {
    const l = lessons(playOut(1001, true))
    const cut = l.find((x) => x.id === 'price-cut')
    expect(cut).toBeTruthy()
    expect(cut!.text).toMatch(/ลดราคา 2 ไตรมาส \(ครั้งแรก Q1\/1\)/)
    expect(l.length).toBeGreaterThan(0)
    expect(l.length).toBeLessThanOrEqual(5)
  })
  it('gives three distinct turning points and a winner note', () => {
    const s = playOut(1002, false)
    const tp = turningPoints(s)
    expect(tp).toHaveLength(3)
    expect(new Set(tp.map((t) => t.text)).size).toBe(3)
    const w = winnerNote(s)
    expect(w).not.toBeNull()
    expect(w!.text.length).toBeGreaterThan(20)
  })
  it('works for a game that ends early', () => {
    let s: GameState = createInitialState({ ...DEFAULT_CONFIG, seed: 1003, quarters: 12 })
    const p = defaultPlan()
    p.pricing = choiceFor(CARD_BY_ID.pricing.options.find((o) => o.id === 'cut2')!)
    p.reinsurance = choiceFor(CARD_BY_ID.reinsurance.options.find((o) => o.id === 'retain')!)
    while (!s.outcome) s = simulateQuarter(s, p, {})
    expect(() => lessons(s)).not.toThrow()
    expect(winnerNote(s)).not.toBeNull()
  })
})
