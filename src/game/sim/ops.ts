import OPS_JSON from '../data/operations.json'
import type { SysState, SystemId } from './systems'
import type { Capacity, Ops } from './types'

/**
 * Engine v3 operations: the company's people, garages and lasting investments.
 * Everything here carries over from quarter to quarter until the player changes it.
 * Numbers come from src/game/data/operations.json (game-design assumptions).
 */

export const OPS = OPS_JSON
export type Team = 'claims' | 'contact'
export const TEAMS: Team[] = ['claims', 'contact']
export type InvestmentId = keyof typeof OPS.investments
export const INVESTMENT_IDS = Object.keys(OPS.investments) as InvestmentId[]

export interface TempBoost {
  source: string
  ops: Ops
  value: number
  from: number
  until: number
}

export interface OpsState {
  staff: Record<Team, number>
  /** hired people still in training: they are paid now and add capacity from `at` */
  pending: { team: Team; n: number; at: number }[]
  garages: number
  /** garages at the start (upkeep is paid only on garages added later); default = OPS.garages.start */
  garages0?: number
  /** investment id → quarter index it was made */
  owned: Partial<Record<InvestmentId, number>>
  temps: TempBoost[]
  /** headcount the player asked for this quarter (set by the decision room, consumed by the engine) */
  target: Partial<Record<Team, number>>
  /** phase 3a: systems built or being built */
  systems?: Partial<Record<SystemId, SysState>>
  /** systems the player ordered this quarter (build v1 or upgrade to v2), consumed by the engine */
  orders?: string[]
}

export function createOps(): OpsState {
  return { staff: { claims: OPS.teams.claims.start, contact: OPS.teams.contact.start }, pending: [], garages: OPS.garages.start, owned: {}, temps: [], target: {}, systems: {}, orders: [] }
}

/** Policies in force and work at game start (per quarter), from the assumptions. */
export function startUnits(gwp0: number) {
  const inForce = (gwp0 * 4 * 1e6) / OPS.avgPremiumPerPolicyYear
  const claims = (inForce * OPS.claimFrequencyYear) / 4
  return { inForce, claims, calls: inForce * OPS.callsPerPolicyQuarter, repairs: claims * OPS.garageShareOfClaims }
}

/** Capacity in real units (work per quarter) of each team, before temporary and lasting boosts. */
export function baseUnits(o: OpsState, q = -1) {
  // people whose training ends by quarter q already count (between quarters, before the engine merges them)
  const ready = (t: Team) => o.staff[t] + o.pending.filter((p) => p.team === t && p.at <= q).reduce((a, p) => a + p.n, 0)
  return {
    claims: ready('claims') * OPS.teams.claims.perPersonMonth * 3,
    contact: ready('contact') * OPS.teams.contact.perPersonMonth * 3,
    repair: o.garages * OPS.garages.jobsPerGarageQuarter,
  }
}

/** Boost from investments and temporary measures active in quarter q, as a fraction (0.12 = +12%). */
export function boostAt(o: OpsState, q: number): Capacity {
  const b: Capacity = { contact: 0, claims: 0, repair: 0 }
  for (const id of INVESTMENT_IDS) {
    const at = o.owned[id]
    const inv = OPS.investments[id]
    if (at !== undefined && q >= at + (inv.slow ? 1 : 0)) b[inv.ops as Ops] += inv.capacity
  }
  for (const t of o.temps) if (q >= t.from && q <= t.until) b[t.ops] += t.value
  return b
}

/** Capacity in real units for quarter q. */
export function unitsAt(o: OpsState, q: number): Capacity {
  const u = baseUnits(o, q)
  const b = boostAt(o, q)
  return { claims: u.claims * (1 + b.claims), contact: u.contact * (1 + b.contact), repair: u.repair * (1 + b.repair) }
}

/** Capacity as a multiple of start-of-game demand (what the overload maths uses). */
export function capacityMultiple(o: OpsState, q: number, gwp0: number): Capacity {
  const u = unitsAt(o, q)
  const s = startUnits(gwp0)
  return { claims: Math.max(0.3, u.claims / s.claims), contact: Math.max(0.3, u.contact / s.calls), repair: Math.max(0.3, u.repair / s.repairs) }
}

/** A temporary measure cannot be stacked on itself while it is still running. */
export function tempActive(o: OpsState, source: string, q: number) {
  return o.temps.some((t) => t.source === source && q >= t.from && q <= t.until)
}

export function isInvestment(id: string | undefined): id is InvestmentId {
  return !!id && id in OPS.investments
}

const quarterPay = (people: number) => (people * OPS.salaryPerPersonMonth * 3) / 1e6

export interface OpsCosts {
  salaries: number
  otherFixed: number
  maintenance: number
  hiring: number
  severance: number
  /** fixed cost total (admin line) */
  fixed: number
  issuance: number
  survey: number
  /** variable cost total (other underwriting line) */
  variable: number
}

/**
 * One quarter of operations: apply the headcount the player asked for (hire = paid now, capacity
 * next quarter; lay off = capacity gone now, severance paid), add investments/temporary measures,
 * and return what it all costs. Mutates `o`.
 */
export function runOps(
  o: OpsState,
  q: number,
  x: { investments: string[]; temps: { source: string; ops: Ops; value: number; quarters: number }[]; extraHires: Partial<Record<Team, number>>; extraGarages: number },
) {
  // people who finished training join the team
  for (const p of o.pending) if (p.at <= q) o.staff[p.team] += p.n
  o.pending = o.pending.filter((p) => p.at > q)

  let hiring = 0
  let severance = 0
  for (const team of TEAMS) {
    const pend = o.pending.filter((p) => p.team === team).reduce((a, p) => a + p.n, 0)
    const now = o.staff[team] + pend
    const want = Math.max(0, Math.round((o.target[team] ?? now) + (x.extraHires[team] ?? 0)))
    if (want > now) {
      // recruiting and training can take in only so many people a quarter
      const n = Math.min(want - now, hireCap(o, team))
      o.pending.push({ team, n, at: q + 1 })
      hiring += (n * OPS.salaryPerPersonMonth * OPS.hireCostMonths) / 1e6
    } else if (want < now) {
      let cut = now - want
      // cancel people still in training first (no severance), then lay off
      for (const p of o.pending.filter((pp) => pp.team === team)) {
        const c = Math.min(cut, p.n)
        p.n -= c
        cut -= c
      }
      o.pending = o.pending.filter((p) => p.n > 0)
      const laid = Math.min(cut, o.staff[team])
      o.staff[team] -= laid
      severance += (laid * OPS.salaryPerPersonMonth * OPS.severanceMonths) / 1e6
    }
  }
  o.target = {}
  o.garages += x.extraGarages
  for (const id of x.investments) if (isInvestment(id) && o.owned[id] === undefined) o.owned[id] = q
  for (const t of x.temps)
    if (!tempActive(o, t.source, q)) o.temps.push({ source: t.source, ops: t.ops, value: t.value, from: q, until: q + t.quarters - 1 })
  o.temps = o.temps.filter((t) => t.until >= q)

  const paid = o.staff.claims + o.staff.contact + o.pending.reduce((a, p) => a + p.n, 0) + OPS.otherStaff
  const maintenance =
    INVESTMENT_IDS.reduce((a, id) => a + (o.owned[id] !== undefined ? OPS.investments[id].maintenanceMB : 0), 0) +
    Math.max(0, o.garages - (o.garages0 ?? OPS.garages.start)) * OPS.garages.maintenanceMBPerGarage
  const salaries = quarterPay(paid)
  return { salaries, otherFixed: OPS.otherFixedMB, maintenance, hiring, severance }
}

/** Most people a team can take on in one quarter (recruiting and training bottleneck). */
export function hireCap(o: OpsState, team: Team) {
  return Math.max(OPS.teams[team].step, Math.ceil(o.staff[team] * OPS.hireCapOfTeam))
}

/** Variable operating cost for a quarter's volume (million baht). */
export function variableCosts(policiesWritten: number, claims: number) {
  const issuance = (policiesWritten * OPS.issuancePerPolicy) / 1e6
  const survey = (claims * OPS.surveyPerClaim) / 1e6
  return { issuance, survey }
}

/** Service quality the company settles at, given its lasting investments. */
export function serviceBonus(o: OpsState) {
  return INVESTMENT_IDS.reduce((a, id) => a + (o.owned[id] !== undefined ? OPS.investments[id].service : 0), 0)
}

/** Headcount the company pays for (for the Operation page). */
export function headcount(o: OpsState) {
  return { ...o.staff, training: o.pending.reduce((a, p) => a + p.n, 0), other: OPS.otherStaff }
}

/** A rival's starting teams: sized to its share; Golden starts with an upgraded garage network, BlueWave with its app. */
export function rivalStartOps(k: number, pers: string): OpsState {
  const o = createOps()
  o.staff = { claims: Math.round(o.staff.claims * k), contact: Math.round(o.staff.contact * k * (pers === 'digital' ? 0.72 : 1)) }
  o.garages = Math.round(o.garages * k)
  o.garages0 = o.garages
  if (pers === 'premium') o.owned = { upgradeNetwork: -1 }
  if (pers === 'digital') o.owned = { ownApp: -1, selfService: -1 }
  return o
}

