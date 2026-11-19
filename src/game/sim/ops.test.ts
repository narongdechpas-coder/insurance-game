import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { defaultPlan } from '../decisions/cards'
import { budgetOf, keptPlan, planCost, reviewPlan } from '../decisions/plan'
import { capitalHealth } from '../capital'
import type { QuarterPlan } from '../decisions/types'
import { withChannelSettings, settingsOf, type StaffTarget } from '../forecast'
import { createInitialState } from '../initialState'
import type { GameState } from '../types'
import { simulateQuarter } from './engine'
import { OPS } from './ops'

/** Engine v3: people, costs and settings carry over; nothing can be stacked for free. */

const start = () => createInitialState({ ...DEFAULT_CONFIG, seed: 3, quarters: 20 })
const quiet = (s: GameState) => ({ ...s, events: s.events.filter((e) => e.id !== 'flood-central') })
function step(s: GameState, plan: Partial<QuarterPlan> = {}, staff?: StaffTarget, responses: Record<string, string> = {}) {
  const base = { ...keptPlan(s), ...plan } as QuarterPlan
  return simulateQuarter(withChannelSettings(quiet(s), settingsOf(s), undefined, staff), base, responses, { calm: true })
}
const total = (s: GameState) => s.lastReport!.pnl.columns.find((c) => c.id === 'total')!

describe('engine v3 operations', () => {
  it('starts with 500 people and the same expense as before (≈200 MB a quarter)', () => {
    const s = step(start())
    const o = s.lastReport!.ops
    expect(o.staff.claims + o.staff.contact + o.staff.other).toBe(500)
    expect(o.costs.salaries).toBeCloseTo(45, 5)
    expect(o.costs.fixed).toBeCloseTo(160, 5)
    expect(o.costs.fixed + o.costs.variable).toBeGreaterThan(190)
    expect(o.costs.fixed + o.costs.variable).toBeLessThan(215)
    // claims and calls at start sit a little under capacity (like engine v2)
    expect(o.demand.claims / o.capacity.claims).toBeGreaterThan(0.85)
    expect(o.demand.claims / o.capacity.claims).toBeLessThan(1)
  })

  it('hiring is paid now and adds capacity next quarter; the people stay; at most 15% a quarter', () => {
    let s = step(start())
    const cap0 = s.lastReport!.ops.capacity.claims
    s = step(s, {}, { claims: 160 }) // asks for 40, recruiting takes 18 (15% of 120)
    const r1 = s.lastReport!.ops
    expect(r1.staff.training).toBe(18)
    expect(r1.capacity.claims).toBeCloseTo(cap0, 3)
    expect(r1.costs.hiring).toBeCloseTo((18 * OPS.salaryPerPersonMonth) / 1e6, 5)
    expect(r1.costs.salaries).toBeCloseTo((518 * OPS.salaryPerPersonMonth * 3) / 1e6, 5)
    s = step(s)
    s = step(s)
    const r3 = s.lastReport!.ops
    expect(r3.staff.claims).toBe(138)
    expect(r3.capacity.claims).toBeGreaterThan(cap0 * 1.12)
    expect(r3.costs.hiring).toBe(0)
    expect(r3.costs.salaries).toBeCloseTo((518 * OPS.salaryPerPersonMonth * 3) / 1e6, 5)
  })

  it('lay-offs cut capacity at once and pay severance once', () => {
    let s = step(start(), {}, { contact: 30 })
    expect(s.lastReport!.ops.staff.contact).toBe(30)
    expect(s.lastReport!.ops.costs.severance).toBeCloseTo((10 * OPS.salaryPerPersonMonth * OPS.severanceMonths) / 1e6, 5)
    s = step(s)
    expect(s.lastReport!.ops.costs.severance).toBe(0)
    expect(s.lastReport!.ops.staff.contact).toBe(30)
  })

  it('fixed cost does not shrink when premium falls', () => {
    let a = start()
    let b = start()
    for (let i = 0; i < 4; i++) {
      a = step(a)
      b = step(b, { pricing: { option: 'raise2' } })
    }
    expect(b.lastReport!.gwp).toBeLessThan(a.lastReport!.gwp * 0.95)
    expect(b.lastReport!.ops.costs.fixed).toBeCloseTo(a.lastReport!.ops.costs.fixed, 5)
    expect(total(b).admin / total(b).earnedPremium).toBeGreaterThan(total(a).admin / total(a).earnedPremium)
  })

  it('a lasting investment is paid once, kept, and costs upkeep every quarter', () => {
    const inv = { repair: { option: 'premium', tactic: 'upgradeNetwork' } } as Partial<QuarterPlan>
    let s = step(start(), inv)
    expect(s.lastReport!.spend).toBe(planCost({ ...defaultPlan(), ...inv } as QuarterPlan))
    const repair0 = s.lastReport!.ops.capacity.repair
    s = step(s) // kept setting: still upgradeNetwork, but already owned
    expect(s.sim.settings.repair.tactic).toBe('upgradeNetwork')
    expect(s.lastReport!.spend).toBe(planCost(defaultPlan()))
    expect(s.lastReport!.ops.capacity.repair).toBeGreaterThan(repair0 * 1.1)
    expect(s.lastReport!.ops.costs.maintenance).toBe(OPS.investments.upgradeNetwork.maintenanceMB)
    // choosing it again later does not stack
    s = step(s)
    s = step(s)
    expect(s.lastReport!.ops.capacity.repair).toBeLessThan(repair0 * 1.13)
  })

  it('a temporary measure cannot be stacked while it is running', () => {
    let s = step(start())
    const cap0 = s.lastReport!.ops.capacity.claims
    const ev = (st: GameState) => ({ ...st, events: [{ id: 'claims-backlog', title: '', detail: '', kind: 'threat', consequence: true } as never] })
    s = simulateQuarter(ev(s), keptPlan(s), { 'claims-backlog': 'outsourceAdjusters' }, { calm: true })
    const c1 = s.lastReport!.ops.capacity.claims
    s = simulateQuarter(ev(s), keptPlan(s), { 'claims-backlog': 'outsourceAdjusters' }, { calm: true })
    expect(c1).toBeCloseTo(cap0 * 1.3, 0)
    expect(s.lastReport!.ops.capacity.claims).toBeCloseTo(c1, 3)
  })

  it('settings are kept: the next quarter opens with what the company is doing now', () => {
    const s = step(start(), { marketing: { option: 'campaign', tactic: 'ambassador' }, underwriting: { option: 'strict', tactic: 'riskScore' } })
    const next = keptPlan(s)
    expect(next.marketing).toEqual({ option: 'campaign', tactic: 'ambassador' })
    expect(next.underwriting.option).toBe('strict')
    expect(next.pricing.option).toBe('hold')
  })

  it('a kept exposure stance settles instead of compounding', () => {
    let s = start()
    for (let i = 0; i < 12; i++) s = step(s, { catExposure: { option: 'reduce', tactic: 'noNewLowland' } })
    expect(s.sim.player.catExposure).toBeGreaterThan(0.79)
    expect(s.sim.player.catExposure).toBeLessThan(0.82)
  })

  it('reinsurance is a yearly treaty: changes outside Q1 wait for next year', () => {
    let s = step(start()) // Q1: keep
    s = step(s, { reinsurance: { option: 'buyMore', tactic: 'catXL' } }) // Q2: ignored
    expect(s.sim.settings.reinsurance.option).toBe('keep')
    s = step(s)
    s = step(s) // Q4
    s = step(s, { reinsurance: { option: 'buyMore', tactic: 'catXL' } }) // Q1 next year
    expect(s.sim.settings.reinsurance.option).toBe('buyMore')
  })

  it('a kept marketing level settles at its own brand level', () => {
    let up = start()
    let keep = start()
    for (let i = 0; i < 16; i++) {
      up = step(up, { marketing: { option: 'campaign' } })
      keep = step(keep)
    }
    expect(keep.sim.v2.company.brand).toBeGreaterThan(47)
    expect(keep.sim.v2.company.brand).toBeLessThan(53)
    expect(up.sim.v2.company.brand).toBeGreaterThan(62)
    expect(up.sim.v2.company.brand).toBeLessThan(72)
  })

  it('phase 4: minimum capital grows with premium; budget follows earned premium', () => {
    const s0 = start()
    expect(capitalHealth(s0).line).toBeCloseTo(1000, 0)
    expect(budgetOf(s0)).toBe(150)
    let a = s0
    for (let i = 0; i < 4; i++) a = step(a, { pricing: { option: 'cut2' } })
    expect(a.lastReport!.gwp).toBeGreaterThan(2100)
    expect(capitalHealth(a).line).toBeCloseTo(0.125 * 4 * a.lastReport!.gwp, 5)
    expect(budgetOf(a)).toBe(Math.round((0.075 * a.lastReport!.earnedPremium) / 5) * 5)
  })

  it('phase 4: rivals run teams and fixed costs like the player', () => {
    const s = step(start())
    for (const f of s.sim.firms) {
      expect(f.ops).toBeDefined()
      expect(f.lastLoads!.claims).toBeGreaterThan(0.5)
      expect(f.lastLoads!.claims).toBeLessThan(1.2)
    }
    const big = s.sim.firms.reduce((a, f) => (f.s0 > a.s0 ? f : a))
    const small = s.sim.firms.reduce((a, f) => (f.s0 < a.s0 ? f : a))
    expect(big.ops!.staff.claims).toBeGreaterThan(small.ops!.staff.claims)
  })

  it('phase 4: the advisor flags fixed cost above 12% of premium', () => {
    let s = start()
    for (let i = 0; i < 6; i++) s = step(s, { pricing: { option: 'raise2' } })
    const share = s.lastReport!.ops.costs.fixed / s.lastReport!.earnedPremium
    const flagged = reviewPlan(keptPlan(s), s).some((n) => n.id === 'fixed-cost')
    expect(flagged).toBe(share > 0.12)
  })

  it('phase 3a: a system takes quarters to build, then customers move onto it and calls fall', () => {
    let s = step(start())
    const calls0 = s.lastReport!.ops.demand.contact
    const order = (st: GameState, ids: string[]) => ({ ...st, sim: { ...st.sim, ops: { ...st.sim.ops, orders: ids } } })
    s = simulateQuarter(order(quiet(s), ['chatbot', 'claimsApp', 'autoRenew']), keptPlan(s), {}, { calm: true })
    // two IT slots: the third order waits
    expect(Object.keys(s.sim.ops.systems!)).toEqual(['chatbot', 'claimsApp'])
    expect(s.lastReport!.ops.systems.spend).toBeCloseTo(2 + 2, 5) // chatbot 2 MB in 1 quarter, app 4 MB over 2
    s = step(s) // chatbot live (dev 1), app still building
    expect(s.sim.ops.systems!.chatbot!.live).toBe(1)
    expect(s.lastReport!.ops.systems.maint).toBeCloseTo(0.1, 5)
    const callsLive = s.lastReport!.ops.demand.contact
    for (let i = 0; i < 4; i++) s = step(s)
    expect(s.sim.ops.systems!.claimsApp!.live).toBe(1)
    // a fully adopted chatbot + app remove about a quarter of calls (vs the same book without them)
    expect(s.lastReport!.ops.systems.calls).toBeLessThan(-0.2)
    expect(callsLive / calls0).toBeLessThan(1)
    // version 2 upgrades the live system and keeps its users
    const users = s.sim.ops.systems!.claimsApp!.adoption
    s = simulateQuarter(order(quiet(s), ['claimsApp']), keptPlan(s), {}, { calm: true })
    s = step(s)
    s = step(s)
    expect(s.sim.ops.systems!.claimsApp!.live).toBe(2)
    for (const [c, v] of Object.entries(users as Record<string, number>)) expect((s.sim.ops.systems!.claimsApp!.adoption as Record<string, number>)[c]).toBeGreaterThanOrEqual(v)
    expect(s.lastReport!.ops.systems.survey).toBeLessThan(-0.3)
  })
})
