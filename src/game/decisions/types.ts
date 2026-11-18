import type { LocationId, ModuleId } from '../types'

export type DecisionId =
  | 'pricing'
  | 'productMix'
  | 'underwriting'
  | 'distribution'
  | 'marketing'
  | 'repair'
  | 'catExposure'
  | 'reinsurance'

/** Direction of effect on the four outcome axes, -2 (strongly worse) … +2 (strongly better). */
export interface Impact {
  growth: number // premium volume / market share
  profit: number // underwriting result (higher = better)
  risk: number // volatility / tail exposure (higher = MORE risk, i.e. worse)
  cx: number // customer satisfaction
}

export type ImpactAxis = keyof Impact

export interface DecisionOption {
  id: string
  label: string
  blurb: string // the trade-off in one line
  cost: number // discretionary budget this quarter, million THB
  impact: Impact
  icon: 'down2' | 'down' | 'hold' | 'up' | 'up2' | 'car' | 'scale' | 'spread' | 'shield' | 'open' | 'store' | 'users' | 'globe' | 'piggy' | 'megaphone' | 'wrench' | 'star' | 'bolt' | 'map' | 'umbrella' | 'safe'
}

export interface DecisionCard {
  id: DecisionId
  title: string
  question: string
  location: LocationId
  modules: ModuleId[]
  unlockQuarter: number // 0-based quarter index when the card becomes available
  defaultOption: string
  options: DecisionOption[]
}

/** The CEO's plan for one quarter: one chosen option per decision card. */
export type QuarterPlan = Record<DecisionId, string>
