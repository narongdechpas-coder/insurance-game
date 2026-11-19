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
    for (const t of tactics) for (const [k, d] of Object.entries(SEG_SHIFT[t] ?? {})) m[k as SegmentId] += d as number
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
const BRAND_MOVE: Record<string, number> = {
  save: -1, onlineOnly: -0.5, stopEvents: -1, cutTeam: -2,
  maintain: 0.3,
  campaign: 6, inHouse: 5, ambassador: 8, sponsor: 6,
}
/** Service points per quarter from decisions that build or erode service capability. */
const SERVICE_MOVE: Record<string, number> = {
  premium: 2, dealerService: 2, upgradeNetwork: 3,
  costCut: -2, nonOEM: -3, laborRate: -1, repairFirst: 0,
  ownApp: 1.5, lineOA: 1,
  tempStaff: 1, selfService: 2, outsourceAdjusters: 1, hireClaims: 2, fastTrack: 0.5,
}

export interface CompanyInputs {
  plan: QuarterPlan
  responseIds: string[]
  /** Excess load over capacity this quarter (0 = coping). */
  excess: { contact: number; claims: number; repair: number }
  wordOfMouth: boolean
  complaints: boolean
}

export function updateCompany(v: V2State, x: CompanyInputs): { brand: number; service: number } {
  const c = v.company
  const before = { ...c }
  const mk = x.plan.marketing
  const brandMove = (mk.tactic && BRAND_MOVE[mk.tactic] !== undefined ? BRAND_MOVE[mk.tactic] : BRAND_MOVE[mk.option]) ?? 0
  c.brand += brandMove - 0.03 * (c.brand - 40) + (x.wordOfMouth ? 3 : 0) - (x.complaints ? 3 : 0)
  const rp = x.plan.repair
  let svc = (rp.tactic && SERVICE_MOVE[rp.tactic] !== undefined ? SERVICE_MOVE[rp.tactic] : SERVICE_MOVE[rp.option]) ?? 0
  const dt = x.plan.distribution.tactic
  if (dt && SERVICE_MOVE[dt]) svc += SERVICE_MOVE[dt]
  for (const id of x.responseIds) svc += SERVICE_MOVE[id] ?? 0
  svc -= 15 * (x.excess.contact + x.excess.claims + x.excess.repair)
  c.service += svc - 0.05 * (c.service - SERVICE0)
  c.brand = Math.max(0, Math.min(100, c.brand))
  c.service = Math.max(0, Math.min(100, c.service))
  return { brand: c.brand - before.brand, service: c.service - before.service }
}

/** Satisfaction pull from service quality (stars per quarter). */
export const serviceStars = (service: number) => 0.004 * (service - SERVICE0)
