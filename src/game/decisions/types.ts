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

export type Speed = 'fast' | 'normal' | 'slow' // how soon the effect shows (used by the Phase 4 engine)
export type Duration = 'short' | 'normal' | 'long' // how long the effect lasts

/** Layer 2: HOW to carry out a stance. Must differ in real outcomes, not just in name. */
export interface Tactic {
  id: string
  label: string
  blurb: string
  cost: number // replaces the stance cost when chosen, million THB
  impact: Partial<Impact> // added on top of the stance impact
  speed: Speed
  duration: Duration
  recommended?: boolean
  icon: OptionIcon
}

export interface DecisionOption {
  id: string
  label: string
  blurb: string // the trade-off in one line
  cost: number // discretionary budget this quarter, million THB (when there is no tactic)
  impact: Impact
  icon: OptionIcon
  tactics?: Tactic[]
}

export type OptionIcon =
  | 'down2'
  | 'down'
  | 'hold'
  | 'up'
  | 'up2'
  | 'car'
  | 'scale'
  | 'spread'
  | 'shield'
  | 'open'
  | 'store'
  | 'users'
  | 'globe'
  | 'piggy'
  | 'megaphone'
  | 'wrench'
  | 'star'
  | 'bolt'
  | 'map'
  | 'umbrella'
  | 'safe'
  | 'smartphone'
  | 'mic'
  | 'trophy'
  | 'tv'
  | 'ticket'
  | 'userMinus'

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

/** One card's choice: the stance, and how to carry it out (when the stance has tactics). */
export interface Choice {
  option: string
  tactic?: string
}

/** The CEO's plan for one quarter: one choice per decision card. */
export type QuarterPlan = Record<DecisionId, Choice>
