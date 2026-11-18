import type { Responses } from '../decisions/scenarios'
import type { ImpactAxis, QuarterPlan } from '../decisions/types'
import type { CompanyKpis, QuarterStamp } from '../types'
import type { Mix, Pnl } from './channels'

/** Operational capacity, as a multiple of the demand the company had at game start. */
export interface Capacity {
  contact: number
  claims: number
  repair: number
}
export type Ops = keyof Capacity

/** An effect from a decision, spread over the quarters it is felt in. */
export interface QueuedEffect {
  at: number // quarter index it applies in
  axis: ImpactAxis
  value: number
  source: string // card id / event id, for "why" explanations
}

/** Temporary capacity boost (expires after `until`). */
export interface Boost {
  ops: Ops
  value: number
  from: number // first quarter index it applies in
  until: number // last quarter index it applies in (Infinity = permanent)
  source: string
}

export interface Firm {
  id: string
  share: number
  price: number // price index customers see (1 = start)
  rateHist: number[] // rate-adequacy index, newest last (earned with a lag)
  satisfaction: number
  capital: number
  combinedRatio: number
  catExposure: number
  bonus: number // short-lived attractiveness from this quarter's moves
  s0: number // share at game start
  a0: number // attractiveness at game start (so neutral play keeps shares stable)
  crSum: number // for the average combined ratio at game end
  quarters: number
}

export interface SimState {
  marketGwp: number // in-game market premium per quarter, million THB
  baseDemand: { policies: number; claims: number } // demand at game start (capacity 1.0 = this)
  player: Firm
  capacity: Capacity
  boosts: Boost[]
  queue: QueuedEffect[]
  firms: Firm[] // competitors, same order as GameState.competitors
  /** Quarters in a row the player ran a loose underwriting appetite with a price cut. */
  looseStreak: number
  highCxStreak: number
  /** player's channel mix and last written premium (for earned premium and the channel P&L) */
  mix: Mix
  prevWp: number
  /** quarter index each consequence event was last raised (cooldowns) */
  lastRaised: Record<string, number>
  /** market share of every company after each quarter (index 0 = game start); keys: 'player' + competitor ids */
  shareHistory: Record<string, number>[]
}

export type FloodOutcome = 'none' | 'hit' | 'missed'

export interface Driver {
  id: string
  text: string
  tone: 'good' | 'bad'
  weight: number // comparable magnitude used to rank "why" (≈ million THB of capital)
}

export interface CompetitorMove {
  id: string
  text: string
}

/** What one rival decided this quarter and how the quarter treated it. */
export interface RivalReport {
  id: string
  move: string // pricing / service decision
  eventActions: string[] // how it answered this quarter's market events
  impacts: { label: string; amount: number }[] // money effects of events (negative = cost), million THB
  before: { share: number; capital: number; combinedRatio: number; satisfaction: number }
  after: { share: number; capital: number; combinedRatio: number; satisfaction: number }
}

export interface QuarterReport {
  quarter: QuarterStamp
  plan: QuarterPlan
  responses: Responses
  before: CompanyKpis
  after: CompanyKpis
  gwp: number
  lossRatio: number
  expenseRatio: number
  uwResult: number
  investmentIncome: number
  reinsuranceCost: number // cost of protection this quarter (negative = recovered more than paid)
  catLossGross: number
  catLossNet: number
  flood: FloodOutcome
  spend: number
  loads: Capacity // demand ÷ capacity (>1 = overloaded)
  drivers: Driver[]
  competitorMoves: CompetitorMove[]
  rivals: RivalReport[]
  /** player's own event money effects (fine, …), million THB, negative = cost */
  eventImpacts: { label: string; amount: number }[]
  consequences: string[] // event ids raised for next quarter
  earnedPremium: number
  pnl: Pnl
  rank: number
}

export interface Standing {
  id: string // 'player' or competitor id
  score: number
  capital: number
  share: number
  avgCombinedRatio: number
  satisfaction: number
  /** Score by component (capital /30, share /25, combined ratio /25, satisfaction /20), before any bankruptcy penalty. */
  parts?: { capital: number; share: number; cr: number; cx: number }
}

export interface GameOutcome {
  reason: 'completed' | 'bankrupt'
  standings: Standing[] // sorted best first
  playerRank: number
}
