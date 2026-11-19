import { CHANNEL_TABLE } from '../data/tables'
import type { QuarterPlan } from '../decisions/types'

/**
 * Distribution channels for the P&L view. Rates are GAME-DESIGN ESTIMATES (ประมาณการเพื่อเกม),
 * not market data. Commission is paid on written premium; losses and admin follow earned premium.
 */
export type ChannelId = 'dealer' | 'agent' | 'direct'

/** acquisition = channel marketing cost on written premium (ads, platform fees); direct has little commission but pays here. */
export const CHANNELS: { id: ChannelId; label: string; commission: number; acquisition: number; lrOffset: number; mktgWeight: number }[] = [
  { id: 'dealer', label: 'Dealer', commission: 0.19, acquisition: 0.01, lrOffset: 0.015, mktgWeight: 1 },
  { id: 'agent', label: 'Agent', commission: 0.27, acquisition: 0, lrOffset: -0.012, mktgWeight: 0.2 },
  { id: 'direct', label: 'Direct', commission: 0.03, acquisition: 0.15, lrOffset: 0.004, mktgWeight: 2.2 },
]

export type Mix = Record<ChannelId, number>
/** Channel mix at game start = each channel's share of the market (src/game/data/channels.json). */
export const START_MIX: Mix = Object.fromEntries(CHANNEL_TABLE.map((c) => [c.id, c.marketShare])) as Mix

/** How the distribution decision moves the channel mix this quarter (then renormalised). */
const SHIFT: Record<string, Partial<Mix>> = {
  dealer: { dealer: 0.05 },
  agent: { agent: 0.04 },
  digital: { direct: 0.05 },
}

export function distributionChannel(plan: QuarterPlan): ChannelId | null {
  const o = plan.distribution.option
  return o === 'dealer' ? 'dealer' : o === 'agent' ? 'agent' : o === 'digital' ? 'direct' : null
}

export function nextMix(mix: Mix, plan: QuarterPlan): Mix {
  const s = SHIFT[plan.distribution.option] ?? {}
  const m: Mix = { dealer: mix.dealer + (s.dealer ?? 0), agent: mix.agent + (s.agent ?? 0), direct: mix.direct + (s.direct ?? 0) }
  const t = m.dealer + m.agent + m.direct
  return { dealer: m.dealer / t, agent: m.agent / t, direct: m.direct / t }
}

export const commissionRate = (mix: Mix) => CHANNELS.reduce((a, c) => a + c.commission * mix[c.id], 0)
export const acquisitionRate = (mix: Mix) => CHANNELS.reduce((a, c) => a + c.acquisition * mix[c.id], 0)

/** Channel loss-ratio offsets, re-centred so the mix-weighted offset is zero (the total LR stays the engine's). */
export function lrOffsets(mix: Mix): Record<ChannelId, number> {
  const avg = CHANNELS.reduce((a, c) => a + c.lrOffset * mix[c.id], 0)
  return Object.fromEntries(CHANNELS.map((c) => [c.id, c.lrOffset - avg])) as Record<ChannelId, number>
}

/** One column of the underwriting P&L (million THB). */
export interface PnlColumn {
  id: ChannelId | 'total'
  label: string
  writtenPremium: number
  earnedPremium: number
  paidLoss: number
  incurredLoss: number
  commission: number
  marketing: number
  otherUw: number
  admin: number
  expenseTotal: number
  uwResult: number
}

export interface Pnl {
  columns: PnlColumn[] // dealer, agent, direct, total
  reinsurance: number // net cost of reinsurance this quarter (negative = recovery exceeded cost)
  netUwResult: number
  investmentIncome: number
}

interface Inputs {
  mix: Mix
  prevMix: Mix
  wp: number
  prevWp: number
  attritionalLR: number
  catGross: number
  marketingSpend: number
  distributionSpend: number
  /** channel the distribution spend went to; null = spread by mix */
  distChannel: ChannelId | null
  otherSpend: number
  adminAmount: number
  reinsurance: number
  investmentIncome: number
  /** share of incurred loss already paid this quarter (claims-handling speed vs loss control) */
  paidRatio: number
  /** per-channel commission/acquisition on written premium (channel levers); default = CHANNELS */
  rates?: Record<ChannelId, { commission: number; acquisition: number }>
  /** per-channel loss-ratio multiplier from the segments each channel sells; default = fixed offsets */
  lrFactor?: Record<ChannelId, number>
}

/** Allocate the engine's company totals to channels. Columns always add up to the total. */
export function buildPnl(x: Inputs): Pnl {
  // centre the channel LR offsets on earned-premium weights, so the total incurred equals the engine's exactly
  const epTotal = 0.5 * (x.wp + x.prevWp)
  const epw = Object.fromEntries(CHANNELS.map((c) => [c.id, (0.5 * (x.wp * x.mix[c.id] + x.prevWp * x.prevMix[c.id])) / epTotal])) as Mix
  const off = x.lrFactor
    ? (() => {
        // channel LR = book LR × its segment factor, re-centred on earned weights so the total stays exact
        const raw = Object.fromEntries(CHANNELS.map((c) => [c.id, x.attritionalLR * (x.lrFactor![c.id] - 1)])) as Mix
        const avg = CHANNELS.reduce((a, c) => a + raw[c.id] * epw[c.id], 0)
        return Object.fromEntries(CHANNELS.map((c) => [c.id, raw[c.id] - avg])) as Record<ChannelId, number>
      })()
    : lrOffsets(epw)
  const mktgW = CHANNELS.reduce((a, c) => a + c.mktgWeight * x.mix[c.id], 0)
  const dist = x.distributionSpend
  const cols: PnlColumn[] = CHANNELS.map((c) => {
    const wp = x.wp * x.mix[c.id]
    const ep = 0.5 * (wp + x.prevWp * x.prevMix[c.id])
    const epShare = ep / (0.5 * (x.wp + x.prevWp))
    const incurred = (x.attritionalLR + off[c.id]) * ep + x.catGross * epShare
    const rate = x.rates?.[c.id] ?? { commission: c.commission, acquisition: c.acquisition }
    const commission = wp * rate.commission
    const marketing = wp * rate.acquisition + (x.marketingSpend * c.mktgWeight * x.mix[c.id]) / mktgW + (x.distChannel ? (x.distChannel === c.id ? dist : 0) : dist * x.mix[c.id])
    const otherUw = x.otherSpend * x.mix[c.id]
    const admin = x.adminAmount * epShare
    const expenseTotal = commission + marketing + otherUw + admin
    return {
      id: c.id,
      label: c.label,
      writtenPremium: wp,
      earnedPremium: ep,
      paidLoss: incurred * x.paidRatio - x.catGross * epShare * 0.37, // cat claims are paid more slowly
      incurredLoss: incurred,
      commission,
      marketing,
      otherUw,
      admin,
      expenseTotal,
      uwResult: ep - incurred - expenseTotal,
    }
  })
  const sum = (k: keyof Omit<PnlColumn, 'id' | 'label'>) => cols.reduce((a, c) => a + c[k], 0)
  const total: PnlColumn = {
    id: 'total',
    label: 'Total',
    writtenPremium: sum('writtenPremium'),
    earnedPremium: sum('earnedPremium'),
    paidLoss: sum('paidLoss'),
    incurredLoss: sum('incurredLoss'),
    commission: sum('commission'),
    marketing: sum('marketing'),
    otherUw: sum('otherUw'),
    admin: sum('admin'),
    expenseTotal: sum('expenseTotal'),
    uwResult: sum('uwResult'),
  }
  return { columns: [...cols, total], reinsurance: x.reinsurance, netUwResult: total.uwResult - x.reinsurance, investmentIncome: x.investmentIncome }
}
