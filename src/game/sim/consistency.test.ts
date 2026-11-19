import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../config'
import { SEGMENTS } from '../data/tables'
import { choiceCost } from '../decisions/plan'
import { keepPrices, withChannelSettings, type ChannelSettings, type SegmentSteps } from '../forecast'
import { createInitialState } from '../initialState'
import type { GameState } from '../types'
import { sumPnl } from './channels'
import { simulateQuarter } from './engine'
import { rng } from './rng'
import { scriptedTurn, type StrategyId } from './strategies'
import { CH, CHANNEL_IDS, SEGMENT_IDS } from './v2'

/**
 * Reconciliation: every number that appears in more than one place must agree.
 * Plays many quarters with random channel levers, segment focus, segment prices and
 * strategies, and checks after every quarter that channels, segments, the P&L, the KPIs,
 * the history and the log all add up.
 */

const EPS = 1e-6
const close = (a: number, b: number, tol = EPS) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b))

interface Issue {
  seed: number
  q: string
  check: string
  a: number
  b: number
}

function checkQuarter(prev: GameState, s: GameState, seed: number, issues: Issue[]) {
  const r = s.lastReport!
  const q = r.quarter ? `Q${r.quarter.q}/${r.quarter.year}` : '?'
  const add = (check: string, a: number, b: number, tol = EPS) => {
    if (!close(a, b, tol)) issues.push({ seed, q, check, a, b })
  }
  const cols = r.pnl.columns
  const tot = cols.find((c) => c.id === 'total')!
  const ch = (id: string) => cols.find((c) => c.id === id)!
  const keys = ['writtenPremium', 'earnedPremium', 'paidLoss', 'incurredLoss', 'commission', 'marketing', 'otherUw', 'admin', 'expenseTotal', 'uwResult'] as const

  // 1. P&L: channels add up to the total, and each column adds up internally
  for (const k of keys) add(`P&L ${k}: channels = total`, CHANNEL_IDS.reduce((a, c) => a + ch(c)[k], 0), tot[k])
  for (const c of [...CHANNEL_IDS, 'total']) {
    const x = ch(c)
    add(`P&L ${c}: expense lines = expense total`, x.commission + x.marketing + x.otherUw + x.admin, x.expenseTotal)
    add(`P&L ${c}: EP − incurred − expenses = U/W result`, x.earnedPremium - x.incurredLoss - x.expenseTotal, x.uwResult)
  }

  // 2. P&L agrees with the report and the KPIs
  add('premium: P&L written = report GWP', tot.writtenPremium, r.gwp)
  add('premium: P&L earned = report earned', tot.earnedPremium, r.earnedPremium)
  add('loss ratio: P&L total = report', tot.incurredLoss / tot.earnedPremium, r.lossRatio)
  add('combined ratio: P&L total = KPI', (tot.incurredLoss + tot.expenseTotal) / tot.earnedPremium, s.kpis.combinedRatio)
  add('U/W result: P&L net (after reinsurance) = report', r.pnl.netUwResult, r.uwResult)
  add('earned premium = half this quarter + half last quarter', tot.earnedPremium, 0.5 * (r.gwp + (prev.lastReport?.gwp ?? prev.kpis.marketShare * prev.sim.marketGwp)), 1e-3)

  // 3. capital moves only by the net U/W result, investment income and fines
  const fines = r.eventImpacts.filter((e) => e.label.includes('ค่าปรับ')).reduce((a, e) => a + e.amount, 0)
  add('capital change = net U/W + investment − fines', s.sim.player.capital - prev.sim.player.capital, r.uwResult + r.investmentIncome + fines, 1e-9)
  add('KPI capital = engine capital (rounded)', s.kpis.capitalMB, Math.round(s.sim.player.capital))

  // 4. channels: the mix shown = premium split, and mixes are proper shares
  add('channel mix sums to 100%', CHANNEL_IDS.reduce((a, c) => a + r.v2.channelMix[c], 0), 1)
  for (const c of CHANNEL_IDS) add(`channel ${c}: mix = its share of written premium`, r.v2.channelMix[c], ch(c).writtenPremium / tot.writtenPremium)

  // 5. commission per channel = market rate + lever (Dealer/Agent), ad spend scales acquisition (Direct)
  for (const c of CHANNEL_IDS) {
    const lever = r.v2.levers[c]
    const step = CH[c].steps[lever]
    if (CH[c].lever === 'commission') add(`channel ${c}: commission ÷ WP = base + lever`, ch(c).commission / ch(c).writtenPremium, { dealer: 0.19, agent: 0.27 }[c as 'dealer' | 'agent'] + step)
  }

  // 6. segments: each channel's mix and the book add up; the book = channel mixes weighted by channel
  for (const c of CHANNEL_IDS) add(`segments in ${c} sum to 100%`, SEGMENT_IDS.reduce((a, k) => a + r.v2.channelSeg[c][k], 0), 1)
  add('book segments sum to 100%', SEGMENT_IDS.reduce((a, k) => a + r.v2.portfolio[k], 0), 1)
  for (const k of SEGMENT_IDS) add(`book ${k} = Σ channel mix × channel segment`, r.v2.portfolio[k], CHANNEL_IDS.reduce((a, c) => a + r.v2.channelMix[c] * r.v2.channelSeg[c][k], 0))

  // 7. Product page: segment premiums add to GWP; segment loss ratios average to the book's
  const snap = s.sim.v2.history[s.sim.v2.history.length - 1]
  add('Product: Σ segment premium = GWP', SEGMENT_IDS.reduce((a, k) => a + r.gwp * snap.portfolio[k], 0), r.gwp)
  add('Product: book-weighted segment LR = book LR', SEGMENT_IDS.reduce((a, k) => a + snap.portfolio[k] * snap.segLossRatio[k], 0), tot.incurredLoss / tot.earnedPremium)

  // 8. channel report (history) = P&L columns
  for (const c of CHANNEL_IDS) {
    add(`channel report ${c}: premium = P&L`, snap.channels[c].gwp, ch(c).writtenPremium)
    add(`channel report ${c}: LR = P&L`, snap.channels[c].lossRatio, ch(c).incurredLoss / ch(c).earnedPremium)
    add(`channel report ${c}: CR = P&L`, snap.channels[c].combinedRatio, (ch(c).incurredLoss + ch(c).expenseTotal) / ch(c).earnedPremium)
    add(`channel report ${c}: cost = commission + marketing`, snap.channels[c].commission, ch(c).commission + ch(c).marketing)
    add(`channel report ${c}: mix = report mix`, snap.channels[c].mix, r.v2.channelMix[c])
  }

  // 9. pricing: our book price = segment prices weighted by the book at the start of the quarter
  const prevBook = prev.lastReport?.v2.portfolio ?? null
  if (prevBook) add('price: book price = Σ book × segment price', s.sim.player.price, SEGMENT_IDS.reduce((a, k) => a + prevBook[k] * s.sim.v2.segPrice[k], 0))

  // 10. market: shares sum to 100%, KPI share = engine share, premium = share × market
  add('market shares sum to 100%', s.sim.player.share + s.sim.firms.reduce((a, f) => a + f.share, 0), 1)
  add('KPI share = engine share', s.kpis.marketShare, s.sim.player.share)
  const boost = r.v2 && prev.events.some((e) => e.id === 'motor-show' || e.id === 'motor-expo') ? 1.06 : 1
  add('GWP = share × market size (× show boost)', r.gwp, s.sim.player.share * s.sim.marketGwp * boost)

  // 12. engine v3: the admin line is the fixed operating cost; people are paid for every head on the books
  add('admin = fixed operating cost', tot.admin, r.ops.costs.fixed)
  add('fixed = salaries + other fixed + upkeep + hiring + severance', r.ops.costs.fixed, r.ops.costs.salaries + r.ops.costs.otherFixed + r.ops.costs.maintenance + r.ops.costs.hiring + r.ops.costs.severance)
  add('salaries = every head × monthly pay × 3', r.ops.costs.salaries, ((r.ops.staff.claims + r.ops.staff.contact + r.ops.staff.training + r.ops.staff.other) * 30000 * 3) / 1e6)
  const owned = prev.sim.ops.owned
  add('other U/W = strategy spend − marketing − distribution + issuance + survey', tot.otherUw, r.spend - choiceCost(r.plan, 'marketing', owned) - choiceCost(r.plan, 'distribution', owned) + r.ops.costs.variable)

  // 11. the log keeps the same P&L and KPIs as the report
  const log = s.sim.log[s.sim.log.length - 1]
  add('log P&L = report P&L (total U/W)', log.pnl.columns.find((c) => c.id === 'total')!.uwResult, tot.uwResult)
  add('log capital = KPI capital', log.after.capitalMB, s.kpis.capitalMB)
}

function play(seed: number, strategy: StrategyId, quarters: 12 | 20, issues: Issue[]) {
  const r = rng(seed * 97 + 5)
  let s: GameState = createInitialState({ ...DEFAULT_CONFIG, seed, quarters })
  let n = 0
  while (!s.outcome) {
    const t = scriptedTurn(s, strategy)
    // random channel levers, focus and segment prices on top of the strategy
    const set = Object.fromEntries(
      CHANNEL_IDS.map((c) => [c, { lever: Math.floor(r.next() * 5), focus: r.next() < 0.3 ? SEGMENT_IDS[Math.floor(r.next() * 5)] : null }]),
    ) as ChannelSettings
    const steps = Object.fromEntries(SEGMENT_IDS.map((k) => [k, r.next() < 0.3 ? Math.floor(r.next() * 5) : 2])) as SegmentSteps
    const prev = s
    // random hiring and lay-offs on top (engine v3)
    const staff = r.next() < 0.3 ? { claims: 90 + Math.floor(r.next() * 80), contact: 25 + Math.floor(r.next() * 30) } : t.staff
    s = simulateQuarter(withChannelSettings(s, set, steps, staff), t.plan, t.responses)
    checkQuarter(prev, s, seed, issues)
    n++
  }
  // 12. debrief: the whole-game P&L = the sum of every quarter
  const whole = sumPnl(s.sim.log.map((l) => l.pnl))!
  const sumUw = s.sim.log.reduce((a, l) => a + l.pnl.columns.find((c) => c.id === 'total')!.uwResult, 0)
  if (!close(whole.columns.find((c) => c.id === 'total')!.uwResult, sumUw)) issues.push({ seed, q: 'game', check: 'debrief P&L = Σ quarters', a: whole.columns[3].uwResult, b: sumUw })
  return n
}

describe('numbers reconcile across channels, segments, pricing, P&L and KPIs', () => {
  it('holds for random plans over many games', () => {
    const issues: Issue[] = []
    let quarters = 0
    const strategies: StrategyId[] = ['passive', 'balanced', 'growth', 'profit', 'smart']
    for (let i = 0; i < 30; i++) quarters += play(2000 + i, strategies[i % strategies.length], i % 3 === 0 ? 20 : 12, issues)
    const byCheck = new Map<string, Issue[]>()
    for (const x of issues) byCheck.set(x.check, [...(byCheck.get(x.check) ?? []), x])
    const report = [...byCheck.entries()].map(([k, v]) => `${k}: ${v.length} quarters (e.g. seed ${v[0].seed} ${v[0].q}: ${v[0].a} vs ${v[0].b})`)
    expect(quarters).toBeGreaterThan(300)
    expect(report, report.join('\n')).toEqual([])
  })

  it('segment table assumptions still add up (start portfolio derived from channels)', () => {
    expect(SEGMENTS.length).toBe(5)
    const s = createInitialState(DEFAULT_CONFIG)
    expect(s.sim.v2.segPrice).toEqual(Object.fromEntries(SEGMENT_IDS.map((k) => [k, 1])))
    expect(keepPrices()).toEqual(Object.fromEntries(SEGMENT_IDS.map((k) => [k, 2])))
  })
})
