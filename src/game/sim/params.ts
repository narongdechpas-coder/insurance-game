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
  baseLossRatio: 0.545, // attritional; floods add ≈4–5 pts on average → CR ≈ 96–97% at neutral play (lowered from 0.58 in engine v2: growth must be able to pay)
  rateLagWeights: [0.3, 0.4, 0.3], // earned rate = current, last, the one before
  rateCap: 1.1, // rate above 110% of adequate buys no further loss-ratio benefit (only the price, and adverse selection)
  claimsTrend: 0.005, // claims cost inflation per quarter: holding price slowly erodes margin
  profitAxisLR: 0.02, // loss-ratio points per +1 profit effect
  riskAxisVolatility: 0.006, // extra LR noise per +1 risk effect
  attritionalNoise: 0.012,
  /** Pricing well above the market: good risks leave first, so the book left behind claims more. */
  adverseSelection: { freeGap: 0.04, lrPerGap: 0.55 },
  /**
   * Quality lets a company charge more: above the market price, price sensitivity is scaled by
   * satisfaction (each star above 3.8 makes customers 35% less sensitive, each star below 35% more),
   * within 0.55–1.6. Cutting below the market is not scaled (bargain hunters come either way).
   */
  qualityPricing: { perStar: 0.35, min: 0.55, max: 1.6 },

  // expenses
  adminRatio: 0.125, // includes a routine strategy spend of `baselineSpend`
  baselineSpend: 50, // spend up to this is already inside the admin ratio
  commissionRatio: 0.18,
  investmentYield: 0.006, // on capital, per quarter

  // reinsurance (per-quarter treaty, simplified)
  quotaShare: { keep: 0.2, more: 0.35, less: 0.1 },
  // Quota share ceding commission on a sliding scale: 35% at a 55% loss ratio, one point more commission
  // for each point the ceded loss ratio is better (one point less when worse), within 28%–42%.
  // At the provisional point it sits near our own expense ratio on the ceded share (game ≈ 34–37%).
  // Simplified: settled every quarter on that quarter's loss ratio (real treaties settle on the year).
  // Assumption for the game, not a market quote.
  slidingScale: { provisional: 0.35, atLR: 0.55, slide: 1, min: 0.28, max: 0.42 },
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
    // halved in engine v2 (2b): overload hurts, but growth that is staffed for can pay
    contact: { stars: 0.4, growth: -0.6 }, // per unit of excess load
    claims: { stars: 0.5, lossRatio: 0.03 },
    repair: { stars: 0.3, lossRatio: 0.015 },
  },
  consequenceThreshold: 1.12, // load above this raises a consequence event

  // market events
  economy: { marketShock: -0.025, investmentFactor: 0.6 },
  regulation: { fineAtShare20: 45, satisfactionBar: 3.6, complianceAtShare20: 22 },

  // end of game
  bankruptcyFraction: 0.5, // (engine v2 rule, kept for reference: capital below 50% of start)
  /** engine v3: minimum capital = this share of a year's written premium (game rule, NOT the regulator's CAR) */
  minCapitalOfAnnualGwp: 0.125,
  /** engine v3: the strategy budget each quarter = this share of last quarter's earned premium */
  budgetOfEarnedPremium: 0.075,
} as const

export const DIFFICULTY = {
  easy: { rivalAggression: 0.5, floodChance: 0.3, marketNoise: 0.006, rivalService: 0.025, floodSeverity: 0.85 },
  normal: { rivalAggression: 1.0, floodChance: 0.5, marketNoise: 0.012, rivalService: 0.06, floodSeverity: 1 },
  hard: { rivalAggression: 1.6, floodChance: 0.7, marketNoise: 0.02, rivalService: 0.075, floodSeverity: 1.2 },
} satisfies Record<Difficulty, { rivalAggression: number; floodChance: number; marketNoise: number; rivalService: number; floodSeverity: number }>

/** Spread of an effect over quarters, by how long it lasts. */
export const DURATION_WEIGHTS = { short: [1], normal: [0.6, 0.4], long: [0.35, 0.3, 0.2, 0.15] } as const
