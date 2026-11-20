import { START_MIX } from './channels'
import { P } from './params'
import { createV2 } from './v2'
import { createOps, rivalStartOps } from './ops'
import { defaultPlan } from '../decisions/cards'
import type { Firm, SimState } from './types'
import type { Competitor, GameConfig } from '../types'

const SAT0: Record<Competitor['personality'], number> = { aggressive: 3.5, premium: 4.1, digital: 3.9, conservative: 3.7 }
const EXPOSURE0: Record<Competitor['personality'], number> = { aggressive: 1.2, premium: 0.9, digital: 1.0, conservative: 0.8 }

export function attractiveness(price: number, satisfaction: number, growthFlow: number, bonus: number, market = 0) {
  return -P.priceElasticity * qualityLog(Math.log(price), market, satisfaction) + P.satisfactionWeight * (satisfaction - P.satisfactionAnchor) + P.growthAxisWeight * growthFlow + bonus
}

/** How sensitive customers are to a price above the market, given satisfaction (1 = average). */
export function priceSensitivityFor(satisfaction: number) {
  const q = P.qualityPricing
  return Math.min(q.max, Math.max(q.min, 1 - q.perStar * (satisfaction - P.satisfactionAnchor)))
}

/** log price with the part above the market (log) price scaled by the quality multiplier. */
export function qualityLog(lnPrice: number, lnMarket: number, satisfaction: number) {
  const gap = lnPrice - lnMarket
  return lnMarket + (gap > 0 ? priceSensitivityFor(satisfaction) * gap : gap)
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
    ops: createOps(),
    settings: defaultPlan(),
    treaty: defaultPlan().reinsurance,
    queue: [],
    firms: competitors.map((c) => ({ ...firm(c.id, c.marketShare, SAT0[c.personality], c.marketShare * capitalPerShare, EXPOSURE0[c.personality]), ops: rivalStartOps(c.marketShare / playerShare, c.personality) })),
    looseStreak: 0,
    highCxStreak: 0,
    lastRaised: {},
    shareHistory: [Object.fromEntries([['player', playerShare], ...competitors.map((c) => [c.id, c.marketShare] as [string, number])])],
    mix: { ...START_MIX },
    prevWp: playerShare * P.marketGwp0,
    v2: createV2(),
    log: [],
  }
}
