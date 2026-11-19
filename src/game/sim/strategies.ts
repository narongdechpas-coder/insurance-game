import type { StaffTarget } from '../forecast'
import { OPS, TEAMS } from './ops'
import { CARD_BY_ID, CARDS, choiceFor, defaultPlan, isUnlocked } from '../decisions/cards'
import { budgetLeft } from '../decisions/plan'
import { scenariosFor, type Responses, type ScenarioResponse } from '../decisions/scenarios'
import type { DecisionId, QuarterPlan } from '../decisions/types'
import type { GameState } from '../types'

/**
 * Scripted players for balance testing. Each picks a plan + event responses every quarter
 * and stays within the quarter budget. Not used by the game UI.
 */
export type StrategyId = 'growth' | 'balanced' | 'profit' | 'passive' | 'smart'

const WANT: Record<Exclude<StrategyId, 'passive' | 'smart'>, Partial<Record<DecisionId, [string, string?]>>> = {
  growth: {
    pricing: ['cut2', 'flat'],
    distribution: ['dealer', 'commission'],
    marketing: ['campaign', 'inHouse'],
    reinsurance: ['retain', 'lessQS'],
    productMix: ['motor', 'budget2plus'],
    underwriting: ['broad', 'oldCars'],
    repair: ['costCut', 'laborRate'],
    catExposure: ['grow', 'lowlandGap'],
  },
  balanced: {
    pricing: ['hold'],
    distribution: ['digital', 'lineOA'],
    marketing: ['maintain'],
    reinsurance: ['buyMore', 'catXL'],
    productMix: ['diversify', 'propertySME'],
    underwriting: ['strict', 'riskScore'],
    repair: ['premium', 'upgradeNetwork'],
    catExposure: ['reduce', 'noNewLowland'],
  },
  profit: {
    pricing: ['raise1', 'riskyOnly'],
    distribution: ['balanced'],
    marketing: ['save', 'onlineOnly'],
    reinsurance: ['buyMore', 'quotaShare'],
    productMix: ['diversify', 'paTravel'],
    underwriting: ['strict', 'inspection'],
    repair: ['costCut', 'repairFirst'],
    catExposure: ['reduce', 'noNewLowland'],
  },
}

const score: Record<Exclude<StrategyId, 'passive'>, (r: ScenarioResponse) => number> = {
  growth: (r) => 3 * r.impact.growth + r.impact.cx - r.cost / 40,
  balanced: (r) => r.impact.growth + r.impact.profit + 1.2 * r.impact.cx - r.impact.risk - r.cost / 60,
  profit: (r) => 2 * r.impact.profit - 2 * r.impact.risk - r.cost / 15,
  smart: (r) => r.impact.growth + 1.3 * r.impact.profit + 1.2 * r.impact.cx - 1.2 * r.impact.risk - r.cost / 30,
}

/** Teams sized to the work (engine v3): careful players hire when a team ran near its limit. */
function staffFor(state: GameState, id: StrategyId): StaffTarget | undefined {
  if (id !== 'balanced' && id !== 'smart' && id !== 'profit') return undefined
  const r = state.lastReport?.ops
  if (!r) return undefined
  const o = state.sim.ops
  const want: StaffTarget = {}
  for (const t of TEAMS) {
    const load = r.demand[t] / r.capacity[t]
    const people = o.staff[t] + o.pending.filter((p) => p.team === t).reduce((a, p) => a + p.n, 0)
    if (load > 0.97 && id !== 'profit') want[t] = Math.ceil((people * load) / 0.92 / OPS.teams[t].step) * OPS.teams[t].step
    // a cost-focused player trims teams that sit idle as the book shrinks
    if (load < 0.8 && id === 'profit') want[t] = Math.ceil((people * load) / 0.9 / OPS.teams[t].step) * OPS.teams[t].step
  }
  return want
}

export function scriptedTurn(state: GameState, id: StrategyId): { plan: QuarterPlan; responses: Responses; staff?: StaffTarget } {
  const staff = staffFor(state, id)
  const t = scriptedPlan(state, id)
  return { ...t, staff }
}

function scriptedPlan(state: GameState, id: StrategyId): { plan: QuarterPlan; responses: Responses } {
  const q = state.quarter.index
  const plan = defaultPlan()
  const responses: Responses = {}
  const scen = scenariosFor(state.events.map((e) => e.id))
  if (id === 'passive') {
    for (const sc of scen) responses[sc.eventId] = [...sc.responses].sort((a, b) => a.cost - b.cost)[0].id
    return { plan, responses }
  }
  for (const sc of scen) responses[sc.eventId] = [...sc.responses].sort((a, b) => score[id](b) - score[id](a))[0].id
  if (id === 'smart') return smartPlan(state, plan, responses)
  // apply wanted cards in priority order while the budget allows
  for (const c of CARDS) {
    const want = WANT[id][c.id]
    if (!want || !isUnlocked(c, q)) continue
    const o = CARD_BY_ID[c.id].options.find((x) => x.id === want[0])!
    const prev = plan[c.id]
    plan[c.id] = want[1] ? { option: o.id, tactic: want[1] } : choiceFor(o)
    if (budgetLeft(plan, responses, state.sim.ops.owned) < 0) plan[c.id] = prev
  }
  return { plan, responses }
}

/** A thoughtful player: grows early with targeted cuts, watches capacity and flood season. */
function smartPlan(state: GameState, plan: QuarterPlan, responses: Responses) {
  const q = state.quarter.index
  const set = (id: DecisionId, option: string, tactic?: string) => {
    const prev = plan[id]
    plan[id] = tactic ? { option, tactic } : choiceFor(CARD_BY_ID[id].options.find((o) => o.id === option)!)
    if (budgetLeft(plan, responses, state.sim.ops.owned) < 0) plan[id] = prev
  }
  const loads = state.lastReport?.loads
  const flood = state.events.some((e) => e.id === 'flood-central')
  if (q < 2) set('pricing', 'cut1', 'renewal')
  else if ((state.lastReport?.lossRatio ?? 0) > 0.66) set('pricing', 'raise1', 'riskyOnly')
  if (flood) set('reinsurance', 'buyMore', 'catXL')
  if (!loads || loads.contact > 0.98) set('distribution', 'digital', 'lineOA')
  if (isUnlocked(CARD_BY_ID.repair, q) && (loads?.repair ?? 1) > 0.95) set('repair', 'premium', 'upgradeNetwork')
  if (isUnlocked(CARD_BY_ID.underwriting, q)) set('underwriting', 'strict', 'riskScore')
  if (isUnlocked(CARD_BY_ID.catExposure, q) && flood) set('catExposure', 'reduce', 'noNewLowland')
  return { plan, responses }
}
