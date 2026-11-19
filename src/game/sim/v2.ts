import { CHANNEL_TABLE, SEGMENTS, type Level, type SegmentId } from '../data/tables'
import type { QuarterPlan } from '../decisions/types'
import type { ChannelId, Mix } from './channels'

/**
 * Engine v2 (docs/ENGINE_V2.md): impact on two levels.
 *
 * Company level: Brand Awareness and Service Quality (0–100), slow-moving stocks that act on
 * every channel. Channel level: each of Dealer / Agent / Direct has its own lever (commission
 * vs the market, or online ad spend for Direct) and its own mix of vehicle segments, so loss
 * ratio, cost and renewal differ by channel because of what each channel actually sells.
 *
 * Rivals are still modelled as one share each; the player's channel split sits on top of the
 * player's total share (channel attraction adds to the player's total attractiveness and moves
 * the mix). All coefficients are GAME-DESIGN ASSUMPTIONS, tuned for play, not market data.
 */

export type { SegmentId }
export type SegMix = Record<SegmentId, number>

export const CHANNEL_IDS: ChannelId[] = ['dealer', 'agent', 'direct']
export const SEGMENT_IDS = SEGMENTS.map((s) => s.id)
const SEG = Object.fromEntries(SEGMENTS.map((s) => [s.id, s])) as Record<SegmentId, (typeof SEGMENTS)[number]>
export const CH = Object.fromEntries(CHANNEL_TABLE.map((c) => [c.id, c])) as Record<ChannelId, (typeof CHANNEL_TABLE)[number]>

/** Player's channel mix at game start = each channel's share of the market. */
export const START_CHANNEL_MIX: Mix = Object.fromEntries(CHANNEL_TABLE.map((c) => [c.id, c.marketShare])) as Mix

export interface ChannelState {
  /** Segment mix this channel sells for us. */
  seg: SegMix
  /** Slider position 0..4 (2 = same as the market). */
  lever: number
  /** Segment this channel is told to push, or null. */
  focus: SegmentId | null
}

export interface CompanyState {
  brand: number // Brand Awareness 0–100
  service: number // Service Quality 0–100
}

/** One quarter of channel and segment results, kept for the channel report and the Product page. */
export interface ChannelSnapshot {
  quarter: number // index of the quarter played
  label: string // e.g. "Q1/1"
  channels: Record<ChannelId, { gwp: number; ep: number; lossRatio: number; combinedRatio: number; commission: number; uwResult: number; renewal: number; mix: number }>
  portfolio: SegMix
  segLossRatio: SegMix // estimated loss ratio by segment, scaled to the book's actual loss ratio
  brand: number
  service: number
  marketingSpend: number
  newBusiness: number // million THB of premium from share gained this quarter
}

/** Expected renewal for the coming renewal season, computed from the year that just ended. */
export interface RenewalOutlook {
  rate: number
  byChannel: Record<ChannelId, number>
  baseline: number // market-typical rate for this channel mix at game start
  satisfaction: number
  avgOverload: number
  service: number
  contactOverloaded: boolean
}

export interface V2State {
  company: CompanyState
  channels: Record<ChannelId, ChannelState>
  history: ChannelSnapshot[]
  /** overload accumulated over the current year (sum of excess loads, number of quarters) */
  year: { excess: number; quarters: number }
  /** set at the end of each Q4, applied in the next quarter's renewal season */
  renewal: RenewalOutlook | null
  /** price index each segment's customers see (1 = start) and its rate adequacy, newest last */
  segPrice: SegMix
  segRate: Record<SegmentId, number[]>
  /** price moves chosen for this quarter (fractions, e.g. -0.04), consumed by the engine */
  pendingSteps: Partial<SegMix>
}

export const BRAND0 = 50
export const SERVICE0 = 55

export function createV2(): V2State {
  return {
    company: { brand: BRAND0, service: SERVICE0 },
    channels: Object.fromEntries(CHANNEL_TABLE.map((c) => [c.id, { seg: { ...(c.segmentMix as SegMix) }, lever: 2, focus: null }])) as Record<ChannelId, ChannelState>,
    history: [],
    year: { excess: 0, quarters: 0 },
    renewal: null,
    segPrice: Object.fromEntries(SEGMENTS.map((s) => [s.id, 1])) as SegMix,
    segRate: Object.fromEntries(SEGMENTS.map((s) => [s.id, [1, 1, 1]])) as Record<SegmentId, number[]>,
    pendingSteps: {},
  }
}

const sumMix = (m: SegMix) => SEGMENT_IDS.reduce((a, k) => a + m[k], 0)
function normalise(m: SegMix): SegMix {
  for (const k of SEGMENT_IDS) m[k] = Math.max(0, m[k])
  const t = sumMix(m) || 1
  return Object.fromEntries(SEGMENT_IDS.map((k) => [k, m[k] / t])) as SegMix
}

/** The whole book's segment mix: channel mixes weighted by the channel mix. */
export function portfolioMix(v: V2State, mix: Mix): SegMix {
  const out = Object.fromEntries(SEGMENT_IDS.map((k) => [k, 0])) as SegMix
  for (const c of CHANNEL_IDS) for (const k of SEGMENT_IDS) out[k] += mix[c] * v.channels[c].seg[k]
  return out
}

const weighted = (m: SegMix, f: (k: SegmentId) => number) => SEGMENT_IDS.reduce((a, k) => a + m[k] * f(k), 0)
const SENS: Record<Level, number> = { low: 0.7, mid: 1, high: 1.4 }
const VOL: Record<Level, number> = { low: 0.8, mid: 1, high: 1.5 }
export const segLR = (m: SegMix) => weighted(m, (k) => SEG[k].adequateLR)
export const segFlood = (m: SegMix) => weighted(m, (k) => SEG[k].floodExposure)
export const segSensitivity = (m: SegMix) => weighted(m, (k) => SENS[SEG[k].priceSensitivity])
export const segVolatility = (m: SegMix) => weighted(m, (k) => VOL[SEG[k].volatility])

/** Reference values at game start: every factor below is 1.0 for the starting book. */
const START = (() => {
  const v = createV2()
  const m = portfolioMix(v, START_CHANNEL_MIX)
  return { lr: segLR(m), flood: segFlood(m), sens: segSensitivity(m), vol: segVolatility(m), mix: m }
})()
export const START_PORTFOLIO = START.mix

/** Book-level multipliers relative to the start (loss ratio, flood exposure, price elasticity, noise). */
export function bookFactors(v: V2State, mix: Mix) {
  const m = portfolioMix(v, mix)
  return { lr: segLR(m) / START.lr, flood: segFlood(m) / START.flood, elasticity: segSensitivity(m) / START.sens, volatility: segVolatility(m) / START.vol, mix: m }
}

/** Channel loss-ratio multiplier vs the whole book (what makes channel LRs differ). */
export function channelLRFactors(v: V2State, mix: Mix): Record<ChannelId, number> {
  const book = segLR(portfolioMix(v, mix))
  return Object.fromEntries(CHANNEL_IDS.map((c) => [c, segLR(v.channels[c].seg) / book])) as Record<ChannelId, number>
}

/* ---------------- channel levers ---------------- */

export const leverStep = (c: ChannelId, lever: number) => CH[c].steps[Math.max(0, Math.min(4, lever))]

/** Commission and acquisition cost on written premium for one channel, with its lever. */
export function channelRates(c: ChannelId, lever: number, base: { commission: number; acquisition: number }) {
  const s = leverStep(c, lever)
  return CH[c].lever === 'commission' ? { commission: base.commission + s, acquisition: base.acquisition } : { commission: base.commission, acquisition: base.acquisition * (1 + s) }
}

/**
 * How much more (or less) a channel works for us because of its lever. Cuts hurt more than
 * raises help: intermediaries punish a cut quickly, and a raise is matched by rivals over time.
 */
/** Lever response coefficients (tuned in the balance runs; see docs/balance-report.md). */
export const LEVER_COEF = { commCut: 40, commRaise: 20, adCut: 1.6, adRaise: 1.3, renewCut: 1.2, renewRaise: 0.25 }

export function leverAttraction(c: ChannelId, lever: number): number {
  const s = leverStep(c, lever)
  const k = LEVER_COEF
  if (CH[c].lever === 'commission') return s >= 0 ? k.commRaise * s : k.commCut * s
  return s >= 0 ? k.adRaise * s : k.adCut * s
}

/** Renewal change from the lever: a commission cut makes intermediaries move renewals to rivals. */
export function leverRenewal(c: ChannelId, lever: number): number {
  const s = leverStep(c, lever)
  if (CH[c].lever === 'commission') return s >= 0 ? LEVER_COEF.renewRaise * s : LEVER_COEF.renewCut * s
  return s >= 0 ? 0.02 * s : 0.06 * s
}

/** The distribution card (until the channel screen replaces it in 2b) pushes one channel. */
const DIST_PUSH: Record<string, ChannelId> = { dealer: 'dealer', agent: 'agent', digital: 'direct' }
const DIST_PUSH_ATTR = 0.12

/** Brand above or below its start pulls new customers, most in Direct (people find us themselves). */
export const brandAttraction = (c: ChannelId, brand: number) => 0.004 * (brand - BRAND0) * CH[c].brandSensitivity

export function channelAttraction(v: V2State, plan: QuarterPlan): Record<ChannelId, number> {
  const pushed = DIST_PUSH[plan.distribution.option]
  return Object.fromEntries(
    CHANNEL_IDS.map((c) => [c, leverAttraction(c, v.channels[c].lever) + brandAttraction(c, v.company.brand) + (pushed === c ? DIST_PUSH_ATTR : 0)]),
  ) as Record<ChannelId, number>
}

/** Next quarter's channel mix: drifts toward the channels that work harder for us. */
export function nextChannelMix(mix: Mix, attr: Record<ChannelId, number>, inertia = 0.72): Mix {
  const raw = Object.fromEntries(CHANNEL_IDS.map((c) => [c, START_CHANNEL_MIX[c] * Math.exp(attr[c])])) as Mix
  const t = CHANNEL_IDS.reduce((a, c) => a + raw[c], 0)
  const m = Object.fromEntries(CHANNEL_IDS.map((c) => [c, inertia * mix[c] + (1 - inertia) * (raw[c] / t)])) as Mix
  const s = CHANNEL_IDS.reduce((a, c) => a + m[c], 0)
  return Object.fromEntries(CHANNEL_IDS.map((c) => [c, m[c] / s])) as Mix
}

/** Mix-weighted renewal rate (base by channel + lever + service quality). */
export function renewalRates(v: V2State): Record<ChannelId, number> {
  const svc = 0.003 * (v.company.service - SERVICE0)
  return Object.fromEntries(CHANNEL_IDS.map((c) => [c, Math.max(0.5, Math.min(0.97, CH[c].baseRenewal + leverRenewal(c, v.channels[c].lever) + svc))])) as Record<ChannelId, number>
}
const RENEWAL0 = CHANNEL_IDS.reduce((a, c) => a + START_CHANNEL_MIX[c] * CH[c].baseRenewal, 0)

export const RENEWAL_BASELINE = RENEWAL0

/**
 * Renewal season (start of each year): how many customers renew, from the year that just ended.
 * Satisfaction moves every channel ±6 pts per star around 3.8; an overloaded year costs renewals.
 * Game assumptions, not market data.
 */
export function renewalOutlook(v: V2State, mix: Mix, satisfaction: number, contactOverloaded: boolean): RenewalOutlook {
  const avgOverload = v.year.quarters ? v.year.excess / v.year.quarters : 0
  const base = renewalRates(v)
  const byChannel = Object.fromEntries(
    CHANNEL_IDS.map((c) => [c, Math.max(0.55, Math.min(0.95, base[c] + 0.06 * (satisfaction - 3.8) - 1.0 * avgOverload))]),
  ) as Record<ChannelId, number>
  const rate = CHANNEL_IDS.reduce((a, c) => a + mix[c] * byChannel[c], 0)
  return { rate, byChannel, baseline: RENEWAL0, satisfaction, avgOverload, service: v.company.service, contactOverloaded }
}

/** Share multiplier from a renewal season: each point of renewal above/below the baseline. */
export const renewalShareFactor = (rate: number) => 1 + 0.6 * (rate - RENEWAL0)
/** Rivals face the same season, driven by their satisfaction. */
export const rivalRenewal = (satisfaction: number) => Math.max(0.55, Math.min(0.95, RENEWAL0 + 0.06 * (satisfaction - 3.8)))

/** Share inertia for the player: better renewal keeps more of last quarter's book. */
export function playerInertia(v: V2State, mix: Mix, base: number): number {
  const rr = renewalRates(v)
  const w = CHANNEL_IDS.reduce((a, c) => a + mix[c] * rr[c], 0)
  return Math.max(0.6, Math.min(0.84, base + 0.5 * (w - RENEWAL0)))
}

/* ---------------- segments ---------------- */

/** Segment shifts per quarter from the product and underwriting cards (whole book, every channel). */
const SEG_SHIFT: Record<string, Partial<SegMix>> = {
  newType1: { newCar: 0.03 },
  budget2plus: { budget: 0.03 },
  evProduct: { ev: 0.03 },
  propertySME: { nonMotor: 0.03 },
  paTravel: { nonMotor: 0.02 },
  oldCars: { oldCar: 0.03 },
  youngDrivers: { budget: 0.02, newCar: 0.01 },
  inspection: { oldCar: -0.02 },
  riskScore: { oldCar: -0.015, budget: -0.01 },
}
const FOCUS_STEP = 0.05
const FOCUS_CAP = 0.15

export function shiftSegments(v: V2State, plan: QuarterPlan) {
  const tactics = [plan.productMix?.tactic, plan.underwriting?.tactic].filter(Boolean) as string[]
  for (const c of CHANNEL_IDS) {
    const ch = v.channels[c]
    let m = { ...ch.seg }
    // a kept setting moves the mix up to 3 quarters' worth, then holds (no endless drift)
    const start = CH[c].segmentMix as SegMix
    for (const t of tactics)
      for (const [k, d] of Object.entries(SEG_SHIFT[t] ?? {}) as [SegmentId, number][])
        if ((d > 0 && m[k] < start[k] + 3 * d) || (d < 0 && m[k] > Math.max(0, start[k] + 3 * d))) m[k] += d
    if (ch.focus) {
      const start = (CH[c].segmentMix as SegMix)[ch.focus]
      m[ch.focus] = Math.min(start + FOCUS_CAP, m[ch.focus] + FOCUS_STEP)
    }
    m = normalise(m)
    ch.seg = m
  }
}

/* ---------------- company level ---------------- */

/** Brand points per quarter from the marketing card (on top of a slow fade toward 40). */
// engine v3: the marketing level is kept until changed, so each level has a brand it settles at
// (fade 12%/quarter toward 40): maintain → 50, save → 30, cut the team → 25, campaign → 65–75
const BRAND_MOVE: Record<string, number> = {
  save: -1.2, onlineOnly: -0.6, stopEvents: -1.2, cutTeam: -1.8,
  maintain: 1.2,
  campaign: 3.6, inHouse: 3, ambassador: 4.2, sponsor: 3.6,
}
const BRAND_FADE = 0.12
/** Service points per quarter from decisions that build or erode service capability. */
// engine v3: repair settings are kept until changed (fade 5%/quarter → each settles ±20× its move);
// lasting investments raise the level service settles at instead (serviceBonus)
const SERVICE_MOVE: Record<string, number> = {
  premium: 0.5, dealerService: 0.5,
  costCut: -0.5, nonOEM: -0.75, laborRate: -0.25, repairFirst: 0,
}
/** one-off service lift from an event response (that quarter only) */
const SERVICE_ONCE: Record<string, number> = { tempStaff: 1, outsourceAdjusters: 1, hireClaims: 2, fastTrack: 0.5 }

export interface CompanyInputs {
  plan: QuarterPlan
  responseIds: string[]
  /** Excess load over capacity this quarter (0 = coping). */
  excess: { contact: number; claims: number; repair: number }
  /** service the company settles at above the start, from lasting investments (engine v3) */
  serviceBonus?: number
  wordOfMouth: boolean
  complaints: boolean
}

export function updateCompany(v: V2State, x: CompanyInputs): { brand: number; service: number } {
  const c = v.company
  const before = { ...c }
  const mk = x.plan.marketing
  const brandMove = (mk.tactic && BRAND_MOVE[mk.tactic] !== undefined ? BRAND_MOVE[mk.tactic] : BRAND_MOVE[mk.option]) ?? 0
  c.brand += brandMove - BRAND_FADE * (c.brand - 40) + (x.wordOfMouth ? 3 : 0) - (x.complaints ? 3 : 0)
  const rp = x.plan.repair
  let svc = (rp.tactic && SERVICE_MOVE[rp.tactic] !== undefined ? SERVICE_MOVE[rp.tactic] : SERVICE_MOVE[rp.option]) ?? 0
  for (const id of x.responseIds) svc += SERVICE_ONCE[id] ?? 0
  svc -= 15 * (x.excess.contact + x.excess.claims + x.excess.repair)
  c.service += svc - 0.05 * (c.service - SERVICE0 - (x.serviceBonus ?? 0))
  c.brand = Math.max(0, Math.min(100, c.brand))
  c.service = Math.max(0, Math.min(100, c.service))
  return { brand: c.brand - before.brand, service: c.service - before.service }
}

/** Satisfaction pull from service quality (stars per quarter). */
export const serviceStars = (service: number) => 0.004 * (service - SERVICE0)

/* ---------------- pricing by segment ---------------- */

/** The five price moves a segment row offers (fractions of price). */
export const SEG_PRICE_STEPS = [-0.08, -0.04, 0, 0.04, 0.08]

/** Old pricing-card tactics, expressed as the segments they target (bots and the forecast use them). */
const TACTIC_SEGS: Record<string, SegmentId[]> = {
  lowRisk: ['newCar', 'budget'],
  dealerPromo: ['newCar', 'ev'],
  riskyOnly: ['oldCar', 'ev'],
}

/**
 * This quarter's price and rate move for every segment: the player's per-segment choice plus
 * any pricing-card stance (spread over the segments its tactic targets, so the book-level move
 * is the same as the card always gave).
 */
export function segmentMoves(v: V2State, step: number, tactic: string | undefined, pt: { market: number; rate: number }) {
  const targets = (tactic && TACTIC_SEGS[tactic]) || SEGMENT_IDS
  const cov = targets.reduce((a, k) => a + START.mix[k], 0)
  const out = {} as Record<SegmentId, { price: number; rate: number }>
  for (const k of SEGMENT_IDS) {
    const own = v.pendingSteps[k] ?? 0
    const card = targets.includes(k) ? step / cov : 0
    const clampStep = (x: number) => Math.max(-0.15, Math.min(0.15, x))
    out[k] = { price: clampStep(own + card * pt.market), rate: clampStep(own + card * pt.rate) }
  }
  return out
}

const earned = (hist: number[], w: readonly number[]) => {
  const [a, b, c] = hist.slice(-3)
  return c * w[0] + b * w[1] + a * w[2]
}

/**
 * Book loss-ratio multiplier from segment rates: each segment's adequate loss ratio over its earned
 * rate, weighted by the book. Equals 1 at the start and the old single-rate formula when every
 * segment moves together.
 */
export function segmentRateLR(v: V2State, mix: SegMix, lagWeights: readonly number[], cap: number) {
  return SEGMENT_IDS.reduce((a, k) => a + (mix[k] * SEG[k].adequateLR) / START.lr / Math.min(cap, earned(v.segRate[k], lagWeights)), 0)
}

/** Estimated loss ratio by segment, scaled so the book-weighted average equals the book's actual LR. */
export function segmentLossRatios(v: V2State, mix: SegMix, bookLR: number, lagWeights: readonly number[], cap: number): SegMix {
  const raw = Object.fromEntries(SEGMENT_IDS.map((k) => [k, SEG[k].adequateLR / Math.min(cap, earned(v.segRate[k], lagWeights))])) as SegMix
  const avg = SEGMENT_IDS.reduce((a, k) => a + mix[k] * raw[k], 0)
  return Object.fromEntries(SEGMENT_IDS.map((k) => [k, (raw[k] * bookLR) / avg])) as SegMix
}

/** Player's price pull: each segment's price, weighted by the book and by how price-sensitive it is. */
export function segmentPriceTerm(prices: SegMix, mix: SegMix, elasticity: number) {
  return -elasticity * SEGMENT_IDS.reduce((a, k) => a + mix[k] * (SENS[SEG[k].priceSensitivity] / START.sens) * Math.log(prices[k]), 0)
}

/** Book-weighted price index (what "our price" means in the market). */
export const bookPrice = (prices: SegMix, mix: SegMix) => SEGMENT_IDS.reduce((a, k) => a + mix[k] * prices[k], 0)

/** Adverse selection, segment by segment: a segment priced well above the market keeps its worst risks. */
export function segmentAdverseLR(prices: SegMix, mix: SegMix, market: number, freeGap: number, perGap: number) {
  return SEGMENT_IDS.reduce((a, k) => a + mix[k] * Math.max(0, prices[k] / market - 1 - freeGap) * perGap, 0)
}

/** A segment priced below the rest of our book grows inside every channel (and the reverse). */
export function driftByPrice(v: V2State, k = 0.25) {
  const avg = SEGMENT_IDS.reduce((a, s) => a + START.mix[s] * v.segPrice[s], 0)
  for (const c of CHANNEL_IDS) {
    const m = { ...v.channels[c].seg }
    for (const s of SEGMENT_IDS) m[s] *= Math.exp(-k * SENS[SEG[s].priceSensitivity] * Math.log(v.segPrice[s] / avg))
    v.channels[c].seg = normalise(m)
  }
}
