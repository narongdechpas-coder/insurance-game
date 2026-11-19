import { START_MIX } from './channels'
import { P } from './params'
import { createV2 } from './v2'
import type { Firm, SimState } from './types'
import type { Competitor, GameConfig } from '../types'

const SAT0: Record<Competitor['personality'], number> = { aggressive: 3.5, premium: 4.1, digital: 3.9, conservative: 3.7 }
const EXPOSURE0: Record<Competitor['personality'], number> = { aggressive: 1.2, premium: 0.9, digital: 1.0, conservative: 0.8 }

export function attractiveness(price: number, satisfaction: number, growthFlow: number, bonus: number) {
  return -P.priceElasticity * Math.log(price) + P.satisfactionWeight * (satisfaction - P.satisfactionAnchor) + P.growthAxisWeight * growthFlow + bonus
}

function firm(id: string, share: number, satisfaction: number, capital: number, catExposure: number): Firm {
  return {
    id,
    share,
    price: 1,
    rateHist: [1, 1, 1],
    satisfaction,
    capital,
    combinedRatio: 0.97,
    catExposure,
    bonus: 0,
    s0: share,
    a0: attractiveness(1, satisfaction, 0, 0),
    crSum: 0,
    quarters: 0,
  }
}

/** Starting simulation state. Capital scales with share so every company starts equally strong. */
export function createSimState(config: GameConfig, competitors: Competitor[], playerShare: number): SimState {
  const capitalPerShare = config.startingCapitalMB / playerShare
  const policies = playerShare // normalised: policies ∝ share × market ÷ price
  return {
    marketGwp: P.marketGwp0,
    baseDemand: { policies, claims: policies * P.claimsPerPolicy },
    player: firm('player', playerShare, P.satisfactionAnchor, config.startingCapitalMB, 1.0),
    capacity: { ...P.startCapacity },
    boosts: [],
    queue: [],
    firms: competitors.map((c) => firm(c.id, c.marketShare, SAT0[c.personality], c.marketShare * capitalPerShare, EXPOSURE0[c.personality])),
    looseStreak: 0,
    highCxStreak: 0,
    lastRaised: {},
    shareHistory: [Object.fromEntries([['player', playerShare], ...competitors.map((c) => [c.id, c.marketShare] as [string, number])])],
    mix: { ...START_MIX },
    prevWp: playerShare * P.marketGwp0,
    v2: createV2(),
  }
}
