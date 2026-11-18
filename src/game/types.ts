/**
 * Domain model for Insure Universe.
 * Pure data types only — no React, no Three.js. The simulation engine (Phase 4)
 * will read and write these shapes deterministically.
 */

export type Difficulty = 'easy' | 'normal' | 'hard'
export type GameLength = 12 | 20 // quarters (3 or 5 years)

/** The 10 interconnected business systems that run behind the game world. */
export type ModuleId =
  | 'market'
  | 'vehicleRisk'
  | 'pricing'
  | 'catRisk'
  | 'distribution'
  | 'brand'
  | 'claims'
  | 'cx'
  | 'repair'
  | 'finance'

/** Clickable places in the Command Center world. */
export type LocationId = 'hq' | 'dealer' | 'marketing' | 'customers' | 'claims' | 'repair' | 'risk'

export type Status = 'good' | 'watch' | 'alert' | 'chance'

export interface GameConfig {
  companyName: string
  quarters: GameLength
  difficulty: Difficulty
  startingCapitalMB: number // million THB
  seed: number
}

export interface Competitor {
  id: string
  name: string
  personality: 'aggressive' | 'premium' | 'digital' | 'conservative'
  color: string
  marketShare: number // share of the in-game market, 0..1
}

export type EventKind = 'opportunity' | 'threat' | 'competitor'

export interface GameEvent {
  id: string
  kind: EventKind
  title: string // short, shown on event card
  detail: string // narrative explanation
  icon: 'ev' | 'flood' | 'competitor' | 'regulation' | 'economy'
  locations: LocationId[] // where in the world this event lands
  modules: ModuleId[]
}

/** Player company KPIs. Kept intentionally small for the HUD. */
export interface CompanyKpis {
  capitalMB: number
  marketShare: number // 0..1 of in-game market
  combinedRatio: number // e.g. 0.97
  satisfaction: number // 0..5 stars
}

export interface QuarterStamp {
  index: number // 0-based quarter counter
  year: number // 1-based game year
  q: 1 | 2 | 3 | 4
}

export interface GameState {
  config: GameConfig
  quarter: QuarterStamp
  kpis: CompanyKpis
  kpiHistory: CompanyKpis[]
  competitors: Competitor[]
  events: GameEvent[] // events active this quarter
}
