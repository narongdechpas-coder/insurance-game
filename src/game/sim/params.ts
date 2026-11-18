import type { Difficulty } from '../types'

/**
 * Simulation parameters. ALL VALUES ARE GAME-DESIGN ESTIMATES (ประมาณการเพื่อเกม),
 * chosen so the game is playable and explainable — NOT Thai market statistics.
 * Money in million THB per quarter unless stated.
 */
export const P = {
  // market
  marketGwp0: 10000, // in-game market premium per quarter (player 20% → ≈2,000)
  marketGrowth: 0.012, // per quarter
  shareInertia: 0.72, // weight on last quarter's share (renewals)
  priceElasticity: 2.6, // attractiveness per ln(price)
  satisfactionWeight: 0.14, // attractiveness per star above/below 3.8
  growthAxisWeight: 0.1, // attractiveness per +1 growth effect

  // underwriting
  baseLossRatio: 0.58, // attritional; floods add ≈4–5 pts on average → CR ≈ 97% at neutral play
  rateLagWeights: [0.3, 0.4, 0.3], // earned rate = current, last, the one before
  rateCap: 1.1, // rate above 110% of adequate buys no further loss-ratio benefit (only the price, and adverse selection)
  claimsTrend: 0.005, // claims cost inflation per quarter: holding price slowly erodes margin
  profitAxisLR: 0.02, // loss-ratio points per +1 profit effect
  riskAxisVolatility: 0.006, // extra LR noise per +1 risk effect
  attritionalNoise: 0.012,
  /** Pricing well above the market: good risks leave first, so the book left behind claims more. */
  adverseSelection: { freeGap: 0.04, lrPerGap: 0.55 },

  // expenses
  adminRatio: 0.125, // includes a routine strategy spend of `baselineSpend`
  baselineSpend: 50, // spend up to this is already inside the admin ratio
  commissionRatio: 0.18,
  investmentYield: 0.006, // on capital, per quarter

  // reinsurance (per-quarter treaty, simplified)
  quotaShare: { keep: 0.2, more: 0.35, less: 0.1 },
  cedingCommission: 0.3,
  xl: { retention: 300, limit: 2000, cost: 0.01, buyRetention: 150, buyCost: 0.016, highRetention: 500, highCost: 0.006 },

  // catastrophe (flood)
  floodLossOfGwp: 0.22, // gross flood loss ≈ 22% of quarterly GWP at exposure 1.0
  floodSeverity: [0.75, 1.3],

  // satisfaction
  satisfactionAnchor: 3.8,
  satisfactionReversion: 0.15,
  cxAxisStars: 0.07, // scaled by headroom: harder to gain near 5★, harder to lose near 1★

  // operations: capacity = 1.0 is exactly the start-of-game demand
  startCapacity: { contact: 1.06, claims: 1.08, repair: 1.12 },
  newBusinessCallWeight: 1.6, // a new customer calls this many times more than a renewing one
  claimsPerPolicy: 1, // normalised
  floodClaimsSurge: 0.75, // extra claims (× normal) when a flood hits at exposure 1.0
  overload: {
    contact: { stars: 0.8, growth: -1.2 }, // per unit of excess load
    claims: { stars: 1.0, lossRatio: 0.06 },
    repair: { stars: 0.6, lossRatio: 0.03 },
  },
  consequenceThreshold: 1.12, // load above this raises a consequence event

  // market events
  economy: { marketShock: -0.025, investmentFactor: 0.6 },
  regulation: { fineAtShare20: 45, satisfactionBar: 3.6, complianceAtShare20: 22 },

  // end of game
  bankruptcyFraction: 0.5, // capital below 50% of start = game over (game rule, not a solvency regulation)
} as const

export const DIFFICULTY = {
  easy: { rivalAggression: 0.5, floodChance: 0.3, marketNoise: 0.006, rivalService: 0, floodSeverity: 0.85 },
  normal: { rivalAggression: 1.0, floodChance: 0.5, marketNoise: 0.012, rivalService: 0.02, floodSeverity: 1 },
  hard: { rivalAggression: 1.6, floodChance: 0.7, marketNoise: 0.02, rivalService: 0.05, floodSeverity: 1.2 },
} satisfies Record<Difficulty, { rivalAggression: number; floodChance: number; marketNoise: number; rivalService: number; floodSeverity: number }>

/** Spread of an effect over quarters, by how long it lasts. */
export const DURATION_WEIGHTS = { short: [1], normal: [0.6, 0.4], long: [0.35, 0.3, 0.2, 0.15] } as const
