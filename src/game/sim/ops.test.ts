import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { defaultPlan } from '../decisions/cards'
import { keptPlan, planCost } from '../decisions/plan'
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

  it('hiring is paid now and adds capacity next quarter; the people stay', () => {
    let s = step(start())
    const cap0 = s.lastReport!.ops.capacity.claims
    s = step(s, {}, { claims: 140 })
    const r1 = s.lastReport!.ops
    expect(r1.staff.training).toBe(20)
    expect(r1.capacity.claims).toBeCloseTo(cap0, 3)
    expect(r1.costs.hiring).toBeCloseTo((20 * OPS.salaryPerPersonMonth) / 1e6, 5)
    expect(r1.costs.salaries).toBeCloseTo((520 * OPS.salaryPerPersonMonth * 3) / 1e6, 5)
    s = step(s)
    s = step(s)
    const r3 = s.lastReport!.ops
    expect(r3.staff.claims).toBe(140)
    expect(r3.capacity.claims).toBeGreaterThan(cap0 * 1.15)
    expect(r3.costs.hiring).toBe(0)
    expect(r3.costs.salaries).toBeCloseTo((520 * OPS.salaryPerPersonMonth * 3) / 1e6, 5)
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
})
