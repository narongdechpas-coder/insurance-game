import { COMPETITORS } from './data/competitors'
import { EVENT_DECK } from './data/events'
import type { GameConfig, GameState, QuarterStamp } from './types'

export function quarterStamp(index: number): QuarterStamp {
  return { index, year: Math.floor(index / 4) + 1, q: ((index % 4) + 1) as 1 | 2 | 3 | 4 }
}

/** Deterministic starting state. Same config → same state. */
export function createInitialState(config: GameConfig): GameState {
  const competitors = COMPETITORS.map((c) => ({ ...c }))
  const playerShare = 1 - competitors.reduce((s, c) => s + c.marketShare, 0)
  const kpis = {
    capitalMB: config.startingCapitalMB,
    marketShare: playerShare,
    combinedRatio: 0.97, // mock opening position
    satisfaction: 3.8, // mock opening position
  }
  return {
    config,
    quarter: quarterStamp(0),
    kpis,
    kpiHistory: [kpis],
    competitors,
    events: EVENT_DECK.slice(0, 3),
  }
}
