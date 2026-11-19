import { CARD_BY_ID, choiceFor } from './decisions/cards'
import type { Responses } from './decisions/scenarios'
import type { QuarterPlan } from './decisions/types'
import type { ChannelId } from './sim/channels'
import { simulateQuarter } from './sim/engine'
import type { QuarterReport } from './sim/types'
import { CHANNEL_IDS, SEG_PRICE_STEPS, SEGMENT_IDS, type SegmentId } from './sim/v2'
import type { GameState } from './types'

/**
 * Forecasts for the Decision Room. Each one runs the real engine in "calm" mode (no randomness,
 * no flood) on a copy of the game, so the player sees the same model that will score the quarter.
 * Numbers are estimates: rivals' moves and events can still change the outcome.
 */

export interface ChannelSetting {
  lever: number // 0..4, 2 = same as the market
  focus: SegmentId | null
}
export type ChannelSettings = Record<ChannelId, ChannelSetting>

export function settingsOf(s: GameState): ChannelSettings {
  return Object.fromEntries(CHANNEL_IDS.map((c) => [c, { lever: s.sim.v2.channels[c].lever, focus: s.sim.v2.channels[c].focus }])) as ChannelSettings
}

/** Price move per segment this quarter, as a step index into SEG_PRICE_STEPS (2 = keep). */
export type SegmentSteps = Record<SegmentId, number>
export const keepPrices = (): SegmentSteps => Object.fromEntries(SEGMENT_IDS.map((k) => [k, 2])) as SegmentSteps
export const stepsChanged = (st: SegmentSteps) => SEGMENT_IDS.some((k) => st[k] !== 2)

export function withChannelSettings(s: GameState, set: ChannelSettings, steps?: SegmentSteps): GameState {
  const sim = structuredClone(s.sim)
  for (const c of CHANNEL_IDS) {
    sim.v2.channels[c].lever = set[c].lever
    sim.v2.channels[c].focus = set[c].focus
  }
  if (steps) sim.v2.pendingSteps = Object.fromEntries(SEGMENT_IDS.map((k) => [k, SEG_PRICE_STEPS[steps[k]]]))
  return { ...s, sim }
}

const calm = (s: GameState, plan: QuarterPlan, responses: Responses) => simulateQuarter(s, plan, responses, { calm: true })

/** Next quarter under the draft plan, if nothing unexpected happens. */
export function forecastQuarter(s: GameState, plan: QuarterPlan, responses: Responses, set: ChannelSettings, steps?: SegmentSteps): QuarterReport {
  return calm(withChannelSettings(s, set, steps), plan, responses).lastReport!
}

export interface ChannelForecast {
  gwp: number
  commission: number // commission + acquisition cost, million THB
  lossRatio: number
  /** change vs keeping last quarter's settings */
  dGwp: number
  dCommission: number
}

export function forecastChannels(s: GameState, plan: QuarterPlan, responses: Responses, set: ChannelSettings, steps?: SegmentSteps): Record<ChannelId, ChannelForecast> {
  const now = forecastQuarter(s, plan, responses, set, steps)
  const base = forecastQuarter(s, plan, responses, settingsOf(s), steps)
  const col = (r: QuarterReport, c: ChannelId) => r.pnl.columns.find((x) => x.id === c)!
  return Object.fromEntries(
    CHANNEL_IDS.map((c) => {
      const a = col(now, c)
      const b = col(base, c)
      return [
        c,
        {
          gwp: a.writtenPremium,
          commission: a.commission + a.marketing,
          lossRatio: a.incurredLoss / a.earnedPremium,
          dGwp: a.writtenPremium - b.writtenPremium,
          dCommission: a.commission + a.marketing - (b.commission + b.marketing),
        },
      ]
    }),
  ) as Record<ChannelId, ChannelForecast>
}

export interface PriceForecast {
  option: string
  /** next quarter, vs holding the price */
  dShare: number
  dGwp: number
  /** loss ratio once the new rate is fully earned (3 quarters), vs holding */
  dLossRatioFull: number
  /** price gap to the market after this move (adverse selection starts above +4%) */
  gapAfter: number
}

/** What each pricing stance does, compared with holding the price (rest of the plan unchanged). */
export function forecastPricing(s: GameState, plan: QuarterPlan, responses: Responses, set: ChannelSettings): PriceForecast[] {
  const st = withChannelSettings(s, set)
  const path = (pricing: QuarterPlan['pricing']) => {
    const p1 = { ...plan, pricing }
    const q1 = calm(st, p1, responses)
    // then hold for two quarters, so the rate change is fully earned
    const hold = { ...plan, pricing: choiceFor(CARD_BY_ID.pricing.options.find((o) => o.id === 'hold')!) }
    const q3 = calm(calm({ ...q1, events: [] }, hold, {}), hold, {})
    const market = q1.sim.firms.reduce((a, f) => a + f.price * f.share, 0) / q1.sim.firms.reduce((a, f) => a + f.share, 0)
    return { r1: q1.lastReport!, lr3: q3.lastReport!.lossRatio, gap: q1.sim.player.price / market - 1 }
  }
  const keep = plan.pricing.option === 'hold' ? plan.pricing : choiceFor(CARD_BY_ID.pricing.options.find((o) => o.id === 'hold')!)
  const base = path(keep)
  return CARD_BY_ID.pricing.options.map((o) => {
    const choice = o.id === plan.pricing.option ? plan.pricing : choiceFor(o)
    const f = o.id === 'hold' ? base : path(choice)
    return {
      option: o.id,
      dShare: f.r1.after.marketShare - base.r1.after.marketShare,
      dGwp: f.r1.gwp - base.r1.gwp,
      dLossRatioFull: f.lr3 - base.lr3,
      gapAfter: f.gap,
    }
  })
}

const OPS_TH = { contact: 'สายด่วน', claims: 'ทีมสินไหม', repair: 'อู่ในเครือ' } as const

/** Plan-time warning: which teams the draft plan is expected to overload next quarter. */
export function capacityWarning(s: GameState, plan: QuarterPlan, responses: Responses, set: ChannelSettings, steps?: SegmentSteps): string | null {
  const r = forecastQuarter(s, plan, responses, set, steps)
  const over = (Object.keys(OPS_TH) as (keyof typeof OPS_TH)[]).filter((k) => r.loads[k] > 1.05).sort((a, b) => r.loads[b] - r.loads[a])
  if (!over.length) return null
  const list = over.map((k) => `${OPS_TH[k]} (เกินกำลังราว ${Math.round((r.loads[k] - 1) * 100)}%)`).join(', ')
  return `ถ้าใช้แผนนี้ คาดว่างานจะล้น ${list} ความพอใจจะตกและต้นทุนเคลมสูงขึ้น ลองเพิ่มกำลังทีมหรือลดความเร่งของยอดขายค่ะ`
}

export interface SegmentForecast {
  segment: SegmentId | 'all'
  /** next quarter, vs keeping every price */
  dShare: number
  dGwp: number
  /** book loss ratio once the new rates are fully earned (3 quarters), vs keeping prices */
  dLossRatioFull: number
  /** this segment's price vs the market after the move (adverse selection above +4%) */
  gapAfter: number
}

/**
 * Per-segment price forecast: each row = that segment's chosen move alone; 'all' = every move together.
 * Calm engine runs (no randomness, no flood); the rest of the plan stays as drafted.
 */
export function forecastSegments(s: GameState, plan: QuarterPlan, responses: Responses, set: ChannelSettings, steps: SegmentSteps): SegmentForecast[] {
  const hold = { ...plan, pricing: choiceFor(CARD_BY_ID.pricing.options.find((o) => o.id === 'hold')!) }
  const path = (st: SegmentSteps) => {
    const q1 = calm(withChannelSettings(s, set, st), plan, responses)
    const q3 = calm(calm({ ...q1, events: [] }, hold, {}), hold, {})
    const market = q1.sim.firms.reduce((a, f) => a + f.price * f.share, 0) / q1.sim.firms.reduce((a, f) => a + f.share, 0)
    return { r1: q1.lastReport!, lr3: q3.lastReport!.lossRatio, prices: q1.sim.v2.segPrice, market }
  }
  const base = path(keepPrices())
  const row = (seg: SegmentId | 'all', st: SegmentSteps): SegmentForecast => {
    const f = seg === 'all' || st[seg] !== 2 ? path(st) : base
    return {
      segment: seg,
      dShare: f.r1.after.marketShare - base.r1.after.marketShare,
      dGwp: f.r1.gwp - base.r1.gwp,
      dLossRatioFull: f.lr3 - base.lr3,
      gapAfter: seg === 'all' ? 0 : f.prices[seg] / f.market - 1,
    }
  }
  const one = (k: SegmentId) => ({ ...keepPrices(), [k]: steps[k] })
  return [...SEGMENT_IDS.map((k) => row(k, one(k))), row('all', steps)]
}
