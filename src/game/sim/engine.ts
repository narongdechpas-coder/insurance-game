import { quarterStamp } from '../initialState'
import { CARD_BY_ID, CARDS } from '../decisions/cards'
import { choiceImpact, optionOf, planCost, tacticOf } from '../decisions/plan'
import { responseOf, SCENARIO_BY_EVENT, type Responses, type SimHook } from '../decisions/scenarios'
import type { DecisionId, Duration, Impact, ImpactAxis, QuarterPlan, Speed } from '../decisions/types'
import { EVENT_BY_ID } from '../data/events'
import { SEGMENTS } from '../data/tables'
import type { CompanyKpis, GameState } from '../types'
import { attractiveness } from './init'
import { acquisitionRate, buildPnl, CHANNELS, commissionRate, distributionChannel, START_MIX } from './channels'
import { bookFactors, CHANNEL_IDS, RENEWAL_BASELINE, renewalOutlook, renewalShareFactor, rivalRenewal, segLR, channelAttraction, channelLRFactors, channelRates, nextChannelMix, playerInertia, renewalRates, serviceStars, shiftSegments, updateCompany } from './v2'
import { DIFFICULTY, DURATION_WEIGHTS, P } from './params'
import { rng } from './rng'
import type { Boost, Capacity, CompetitorMove, Driver, Firm, GameOutcome, Ops, QuarterReport, QueuedEffect, RivalReport, SimState, Standing } from './types'

/**
 * The quarterly simulation. Pure and deterministic: same state + plan + responses → same result.
 * Reads decisions through the impact axes (growth / profit / risk / cx) plus a few
 * mechanical levers (price, reinsurance, cat exposure, capacity). No React, no DOM.
 */

const AXES: ImpactAxis[] = ['growth', 'profit', 'risk', 'cx']

/** Capacity effects of strategy tactics (fractions of start-of-game demand). */
const TACTIC_HOOKS: Record<string, SimHook & { slow?: boolean }> = {
  ownApp: { contact: 0.18, slow: true },
  lineOA: { contact: 0.1 },
  onSite: { contact: 0.05, quarters: 1 },
  upgradeNetwork: { repair: 0.12, slow: true },
  dealerService: { repair: 0.15, quarters: 1 },
  ownEvCenter: { repair: 0.08, slow: true },
  evPartner: { repair: 0.06, quarters: 2 },
  laborRate: { repair: -0.04 },
  inspection: { contact: -0.04, quarters: 1 },
  cutTeam: { contact: -0.03 },
}

/** Cards whose core effect the engine models mechanically; only their extra axes go to the queue. */
const MECHANICAL: Partial<Record<DecisionId, ImpactAxis[]>> = {
  pricing: ['risk', 'cx'], // growth/profit come from the price itself
  reinsurance: [], // fully mechanical
  catExposure: ['growth'], // risk comes from the exposure stock
}

const PRICE_STEP: Record<string, number> = { cut2: -0.08, cut1: -0.04, hold: 0, raise1: 0.04, raise2: 0.08 }
/** How much of a price move customers see vs how much changes rate adequacy, per pricing tactic. */
const PRICE_TACTIC: Record<string, { market: number; rate: number }> = {
  lowRisk: { market: 0.6, rate: 0.5 },
  dealerPromo: { market: 0.8, rate: 0.7 },
  riskyOnly: { market: 0.4, rate: 0.8 },
  nonRenew: { market: 0.8, rate: 1.1 },
}

function spread(at: number, speed: Speed, duration: Duration): [number, number][] {
  const w = [...DURATION_WEIGHTS[duration]]
  const start = speed === 'slow' ? at + 1 : at
  if (speed === 'normal' && w.length > 1) {
    // half of the first quarter's effect slips to the next
    w[1] += w[0] * 0.4
    w[0] *= 0.6
  }
  return w.map((x, i) => [start + i, x])
}

function enqueue(queue: QueuedEffect[], at: number, impact: Partial<Impact>, speed: Speed, duration: Duration, source: string, axes: ImpactAxis[] = AXES) {
  for (const [q, w] of spread(at, speed, duration))
    for (const axis of axes) {
      const v = (impact[axis] ?? 0) * w
      if (v) queue.push({ at: q, axis, value: v, source })
    }
}

export function capacityAt(sim: SimState, q: number): Capacity {
  const c = { ...sim.capacity }
  for (const b of sim.boosts) if (q >= b.from && q <= b.until) c[b.ops] += b.value
  return { contact: Math.max(0.5, c.contact), claims: Math.max(0.5, c.claims), repair: Math.max(0.5, c.repair) }
}

function addHook(boosts: Boost[], hook: SimHook & { slow?: boolean }, q: number, source: string) {
  const from = hook.slow ? q + 1 : q
  const until = hook.quarters ? from + hook.quarters - 1 : Infinity
  for (const ops of ['contact', 'claims', 'repair'] as Ops[]) if (hook[ops]) boosts.push({ ops, value: hook[ops]!, from, until, source })
}

const earnedRate = (hist: number[]) => {
  const [a, b, c] = hist.slice(-3)
  const [w0, w1, w2] = P.rateLagWeights
  return c * w0 + b * w1 + a * w2
}
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const fmtPct = (x: number) => `${x > 0 ? '+' : ''}${(x * 100).toFixed(1)}`

interface Underwriting {
  gwp: number
  lossRatio: number
  expenseRatio: number
  catGross: number
  catNet: number
  netResult: number
  grossResult: number
}

function underwrite(gwp: number, attritionalLR: number, expenseRatio: number, catGross: number, qs: number, xl: { retention: number; cost: number }): Underwriting {
  const retainedCat = catGross * (1 - qs)
  const catNet = Math.min(retainedCat, xl.retention) + Math.max(0, retainedCat - xl.retention - P.xl.limit)
  const grossResult = gwp * (1 - attritionalLR - expenseRatio) - catGross
  const netResult = gwp * (1 - qs) * (1 - attritionalLR) - catNet - gwp * expenseRatio + P.cedingCommission * qs * gwp - xl.cost * gwp
  return { gwp, lossRatio: attritionalLR + catGross / gwp, expenseRatio, catGross, catNet, netResult, grossResult }
}

/** Competitor AI: rule-based moves by personality, decided from last quarter's numbers. */
function competitorMoves(firms: Firm[], personalities: string[], names: string[], aggression: number, rivalPromoActive: boolean, r: ReturnType<typeof rng>): CompetitorMove[] {
  const moves: CompetitorMove[] = []
  firms.forEach((f, i) => {
    f.bonus = 0
    const name = names[i]
    switch (personalities[i]) {
      case 'aggressive':
        if (f.combinedRatio > 1.0 || f.price < 0.85) {
          f.price *= 1.04
          moves.push({ id: f.id, text: `${name} ขึ้นราคาหลังขาดทุนจากการรับประกัน` })
        } else if (rivalPromoActive || f.share < f.s0 * 0.97 || r.next() < 0.3 * aggression) {
          const cut = 0.04 * aggression
          f.price *= 1 - cut
          f.bonus = 0.04 * aggression
          moves.push({ id: f.id, text: `${name} ลดราคาชั้น 1 ผ่านดีลเลอร์ราว ${Math.round(cut * 100)}%` })
        } else moves.push({ id: f.id, text: `${name} คงราคา รอดูตลาด` })
        break
      case 'premium':
        if (f.price > 1.08) {
          f.satisfaction += 0.04
          moves.push({ id: f.id, text: `${name} คงราคา ลงทุนบริการพรีเมียมต่อ` })
          break
        }
        f.price *= 1.01
        f.satisfaction += 0.04
        moves.push({ id: f.id, text: `${name} ยกระดับบริการพรีเมียม และขึ้นราคาเล็กน้อย` })
        break
      case 'digital':
        if (f.combinedRatio > 1.0 || f.price < 0.9) {
          f.price *= 1.03
          moves.push({ id: f.id, text: `${name} ปรับราคาออนไลน์ขึ้นหลังกำไรบาง` })
        } else if (r.next() < 0.45) {
          f.price *= 1 - 0.02 * aggression
          f.bonus = 0.03 * aggression
          moves.push({ id: f.id, text: `${name} ลดราคาสำหรับลูกค้าที่ซื้อออนไลน์` })
        } else {
          f.bonus = 0.02 * aggression
          f.satisfaction += 0.03
          moves.push({ id: f.id, text: `${name} เปิดฟีเจอร์ใหม่ในแอป เคลมผ่านมือถือได้` })
        }
        break
      default:
        if (f.combinedRatio > 0.98) {
          f.price *= 1.03
          moves.push({ id: f.id, text: `${name} ขึ้นราคาเพื่อรักษากำไร` })
        } else moves.push({ id: f.id, text: `${name} คงราคา เน้นวินัยการรับประกัน` })
    }
    f.rateHist = [...f.rateHist.slice(-2), f.price]
  })
  return moves
}

function scoreParts(f: { capital: number; share: number; avgCR: number; satisfaction: number }, startCapital: number) {
  const c01 = (x: number) => clamp(x, 0, 1)
  return {
    capital: 30 * c01((f.capital / startCapital - 0.5) / 1.5), // 0.5× start → 0, 2× start → 30
    share: 25 * c01(f.share / 0.3), // 30% share → full
    cr: 25 * c01((1.05 - f.avgCR) / 0.12), // avg CR 105% → 0, 93% → full
    cx: 20 * c01((f.satisfaction - 2.5) / 2.5), // 2.5★ → 0, 5★ → full
  }
}

function scoreOf(f: { capital: number; share: number; avgCR: number; satisfaction: number }, startCapital: number) {
  const p = scoreParts(f, startCapital)
  return p.capital + p.share + p.cr + p.cx
}

function standings(state: GameState, sim: SimState): Standing[] {
  const all = [sim.player, ...sim.firms].map((f, i) => {
    const startCapital = i === 0 ? state.config.startingCapitalMB : (f.s0 / sim.player.s0) * state.config.startingCapitalMB
    const avgCR = f.quarters ? f.crSum / f.quarters : f.combinedRatio
    return {
      id: f.id,
      capital: f.capital,
      share: f.share,
      avgCombinedRatio: avgCR,
      satisfaction: f.satisfaction,
      parts: scoreParts({ capital: f.capital, share: f.share, avgCR, satisfaction: f.satisfaction }, startCapital),
      // a company that fell below the bankruptcy line cannot outrank a solvent one
      score: Math.round(scoreOf({ capital: f.capital, share: f.share, avgCR, satisfaction: f.satisfaction }, startCapital) * (f.capital < startCapital * P.bankruptcyFraction ? 0.3 : 1)),
    }
  })
  return all.sort((a, b) => b.score - a.score)
}

/** The renewal-season card: the expected rate and where it comes from. */
function renewalDetail(o: NonNullable<SimState['v2']['renewal']>) {
  const p = (x: number) => `${Math.round(x * 100)}%`
  return (
    `กรมธรรม์ที่ขายไปเมื่อปีก่อนครบรอบต่ออายุพร้อมกัน คาดว่าจะต่ออายุ ${p(o.rate)} (ค่ากลางตลาด ${p(o.baseline)}) ` +
    `จากความพอใจ ${o.satisfaction.toFixed(1)} ดาว · งานล้นเฉลี่ยทั้งปี ${Math.round(o.avgOverload * 100)}% · Service Quality ${Math.round(o.service)} ` +
    `· แยกช่องทาง: Dealer ${p(o.byChannel.dealer)} · Agent ${p(o.byChannel.agent)} · Direct ${p(o.byChannel.direct)}`
  )
}

/** Live ranking for the HUD, scored the same way as the final result. */
export function currentStandings(state: GameState): Standing[] {
  return standings(state, state.sim)
}

/** Consequence events raised by this quarter's results (max 2, most urgent first). */
const COOLDOWN: Record<string, number> = { 'word-of-mouth': 3, 'complaints-rise': 2, 'adverse-selection': 2 }

function consequencesFor(loads: Capacity, sim: SimState, plan: QuarterPlan, q: number): string[] {
  const out: string[] = []
  const t = P.consequenceThreshold
  if (loads.claims > t) out.push('claims-backlog')
  if (loads.contact > t) out.push('callcenter-overload')
  if (sim.looseStreak >= 1) out.push('adverse-selection')
  const cheapRepair = ['nonOEM', 'laborRate'].includes(tacticOf(plan, 'repair')?.id ?? '')
  if ((cheapRepair && sim.player.satisfaction < 3.7) || sim.player.satisfaction < 3.25) out.push('complaints-rise')
  if (loads.repair > t) out.push('repair-delay')
  if (sim.highCxStreak >= 2) out.push('word-of-mouth')
  const fresh = out.filter((id) => !COOLDOWN[id] || q - (sim.lastRaised[id] ?? -99) > COOLDOWN[id])
  const picked = fresh.slice(0, 2)
  for (const id of picked) sim.lastRaised[id] = q
  return picked
}

/** Outside-world events for next quarter (flood season in Q3–Q4 is a game assumption). */
function externalEvents(nextQ: number, lotusCut: boolean, r: ReturnType<typeof rng>): string[] {
  const out: string[] = []
  const season = nextQ % 4 >= 2
  // high season (calendar): Motor Show in Q2, Motor Expo and the year-end promotion race in Q4
  if (nextQ % 4 === 1) out.push('motor-show')
  if (nextQ % 4 === 3) out.push('motor-expo', 'year-end-promo')
  if (r.next() < (season ? 0.65 : 0.22)) out.push('flood-central')
  if (lotusCut || r.next() < 0.3) out.push('rival-promo')
  if (r.next() < 0.45) out.push('ev-growth')
  if (r.next() < 0.2) out.push('economy-slowdown')
  if (r.next() < 0.18) out.push('regulation-review')
  return out
}

type Personality = 'aggressive' | 'premium' | 'digital' | 'conservative'
/** How each rival personality answers a market event (text + effect kind). */
const RIVAL_EVENT_PLAY: Record<string, Record<Personality, { text: string; prepared: boolean }>> = {
  'flood-central': {
    aggressive: { text: 'ไม่เตรียมรับมือน้ำท่วมเป็นพิเศษ', prepared: false },
    premium: { text: 'เตรียมทีมสำรวจภัยและรถลากล่วงหน้า', prepared: true },
    digital: { text: 'ส่งแจ้งเตือนลูกค้าผ่านแอปให้ย้ายรถ', prepared: true },
    conservative: { text: 'ซื้อประกันภัยต่อเพิ่ม และเฝ้าดูสถานการณ์', prepared: true },
  },
  'economy-slowdown': {
    aggressive: { text: 'ลดราคาแรงเพื่อแย่งลูกค้าที่หาของถูก', prepared: false },
    premium: { text: 'ให้ส่วนลดต่ออายุลูกค้าเดิม', prepared: true },
    digital: { text: 'ออกแพ็กเกจราคาประหยัดบนแอป', prepared: false },
    conservative: { text: 'รัดเข็มขัดค่าใช้จ่ายภายใน', prepared: true },
  },
  'regulation-review': {
    aggressive: { text: 'รอผลตรวจก่อนค่อยแก้', prepared: false },
    premium: { text: 'ปรับกระบวนการสินไหมทั้งระบบ', prepared: true },
    digital: { text: 'แก้เฉพาะเรื่องที่ถูกร้องเรียนบ่อย', prepared: false },
    conservative: { text: 'ปรับกระบวนการสินไหมทั้งระบบ', prepared: true },
  },
}

export interface SimulateOptions {
  /** Override the random seed (tests, balance runs). */
  seed?: number
  /** Forecast mode: no randomness and no flood, so two plans can be compared like for like. */
  calm?: boolean
}

/** New business across the whole market is this much higher during a motor show (game assumption). */
const SHOW_BOOST = 1.06
/** Rivals' extra pull during the year-end promotion race. */
const YEAR_END_RIVAL_PULL = 0.08

export function simulateQuarter(state: GameState, plan: QuarterPlan, responses: Responses, opts: SimulateOptions = {}): GameState {
  const q = state.quarter.index
  const r0 = rng((opts.seed ?? state.config.seed) * 31 + q * 7919 + 17)
  const r: typeof r0 = opts.calm ? { next: () => 0.999, range: (lo, hi) => (lo + hi) / 2, normal: () => 0, pick: (xs) => xs[0] } : r0
  const diff = DIFFICULTY[state.config.difficulty]
  const sim: SimState = structuredClone(state.sim)
  const pl = sim.player
  const active = new Set(state.events.map((e) => e.id))
  const before: CompanyKpis = { ...state.kpis }
  const prevShare = pl.share

  // 1. decisions → effect queue and capacity hooks
  for (const c of CARDS) {
    const t = tacticOf(plan, c.id)
    const axes = MECHANICAL[c.id] ?? AXES
    // pricing growth/profit come from the price mechanics (PRICE_TACTIC); its risk/cx axes still queue
    enqueue(sim.queue, q, choiceImpact(plan, c.id), t?.speed ?? 'normal', t?.duration ?? 'normal', c.id, axes)
    if (t && TACTIC_HOOKS[t.id]) addHook(sim.boosts, TACTIC_HOOKS[t.id], q, c.id)
  }
  for (const id of active) {
    const resp = responseOf(responses, id)
    if (!resp) continue
    enqueue(sim.queue, q, resp.impact, resp.speed, 'normal', id)
    if (resp.sim) addHook(sim.boosts, { ...resp.sim, slow: resp.speed === 'slow' }, q, id)
  }

  const flow: Impact = { growth: 0, profit: 0, risk: 0, cx: 0 }
  const flowBySource = new Map<string, Impact>()
  for (const e of sim.queue)
    if (e.at === q) {
      flow[e.axis] += e.value
      const f = flowBySource.get(e.source) ?? { growth: 0, profit: 0, risk: 0, cx: 0 }
      f[e.axis] += e.value
      flowBySource.set(e.source, f)
    }
  sim.queue = sim.queue.filter((e) => e.at > q)

  // 2. competitors move
  const comps = state.competitors
  const moves = competitorMoves(sim.firms, comps.map((c) => c.personality), comps.map((c) => c.name), diff.rivalAggression, active.has('rival-promo'), r)
  const lotusCut = moves.some((m) => m.id === comps.find((c) => c.personality === 'aggressive')?.id && m.text.includes('ลดราคา'))

  // 3. player mechanical levers
  const pricing = plan.pricing.option
  const pt = PRICE_TACTIC[tacticOf(plan, 'pricing')?.id ?? ''] ?? { market: 1, rate: 1 }
  const step = PRICE_STEP[pricing] ?? 0
  const prevPrice = pl.price
  pl.price *= 1 + step * pt.market
  const rateNow = pl.rateHist[pl.rateHist.length - 1] * (1 + step * pt.rate)
  pl.rateHist = [...pl.rateHist.slice(-2), rateNow]

  const reTactic = tacticOf(plan, 'reinsurance')?.id
  const qs = plan.reinsurance.option === 'buyMore' && reTactic === 'quotaShare' ? P.quotaShare.more : plan.reinsurance.option === 'retain' && reTactic === 'lessQS' ? P.quotaShare.less : P.quotaShare.keep
  const xl =
    reTactic === 'catXL' ? { retention: P.xl.buyRetention, cost: P.xl.buyCost } : reTactic === 'higherRetention' ? { retention: P.xl.highRetention, cost: P.xl.highCost } : { retention: P.xl.retention, cost: P.xl.cost }

  const catT = tacticOf(plan, 'catExposure')?.id
  const expMult = catT === 'noNewLowland' ? 0.93 : catT === 'zonePricing' ? 0.97 : catT === 'lowlandGap' ? 1.15 : 1
  pl.catExposure = clamp(pl.catExposure * expMult, 0.6, 1.6)

  const looseUW = plan.underwriting.option === 'broad' && (pricing === 'cut1' || pricing === 'cut2')
  sim.looseStreak = looseUW ? sim.looseStreak + 1 : 0

  // 4. market and shares
  const slowdown = active.has('economy-slowdown')
  sim.marketGwp *= 1 + P.marketGrowth + r.normal() * diff.marketNoise + (slowdown ? P.economy.marketShock : 0)
  const yieldNow = P.investmentYield * (slowdown ? P.economy.investmentFactor : 1)
  const all = [pl, ...sim.firms]
  // engine v2: segments move with this quarter's product/underwriting choices; channels pull with their levers and the brand
  shiftSegments(sim.v2, plan)
  const chAttr = channelAttraction(sim.v2, plan)
  // event responses that push a channel, change the loss ratio or protect renewals this quarter
  let respLR = 0
  let respInertia = 0
  for (const id of active) {
    const h = responseOf(responses, id)?.sim
    if (!h) continue
    for (const [c, v] of Object.entries(h.channelAttr ?? {})) chAttr[c as keyof typeof chAttr] += v
    respLR += h.lr ?? 0
    respInertia += h.inertia ?? 0
  }
  const showBoost = active.has('motor-show') || active.has('motor-expo') ? SHOW_BOOST : 1
  const rivalPromo = active.has('year-end-promo') ? YEAR_END_RIVAL_PULL : 0
  const plChannelBonus = CHANNEL_IDS.reduce((a, c) => a + sim.mix[c] * chAttr[c], 0)
  const bookNow = bookFactors(sim.v2, sim.mix)
  const attr = (f: Firm, price = f.price) =>
    f === pl
      ? attractiveness(price, f.satisfaction, flow.growth, f.bonus + plChannelBonus) - P.priceElasticity * (bookNow.elasticity - 1) * Math.log(price)
      : attractiveness(price, f.satisfaction, 0, f.bonus + rivalPromo)
  const targetShares = (priceOverride?: number) => {
    const raw = all.map((f) => f.s0 * Math.exp(attr(f, f === pl && priceOverride ? priceOverride : f.price) - f.a0))
    const sum = raw.reduce((a, b) => a + b, 0)
    return raw.map((x) => x / sum)
  }
  const target = targetShares()
  const targetNoPrice = targetShares(prevPrice)
  const plInertia = Math.min(0.88, playerInertia(sim.v2, sim.mix, P.shareInertia) + respInertia)
  all.forEach((f, i) => {
    const k = f === pl ? plInertia : P.shareInertia
    f.share = k * f.share + (1 - k) * target[i]
  })
  const total = all.reduce((a, f) => a + f.share, 0)
  all.forEach((f) => (f.share /= total))
  // renewal season: the whole market renews at once; the player's rate comes from last year
  let renewalResult: { rate: number; byChannel: Record<string, number>; dShare: number } | null = null
  if (active.has('renewal-season') && sim.v2.renewal) {
    const o = sim.v2.renewal
    let bonus = responseOf(responses, 'renewal-season')?.sim?.renewal ?? 0
    if (responses['renewal-season'] === 'retentionCalls' && o.contactOverloaded) bonus /= 2
    const rate = Math.min(0.95, o.rate + bonus)
    const before = pl.share
    all.forEach((f) => (f.share *= f === pl ? renewalShareFactor(rate) : renewalShareFactor(rivalRenewal(f.satisfaction))))
    const t2 = all.reduce((a, f) => a + f.share, 0)
    all.forEach((f) => (f.share /= t2))
    renewalResult = { rate, byChannel: Object.fromEntries(Object.entries(o.byChannel).map(([c, v]) => [c, Math.min(0.95, v + bonus)])), dShare: pl.share - before }
    sim.v2.renewal = null
  }
  const shareFromPrice = (1 - plInertia) * (target[0] - targetNoPrice[0])

  // 5. operations: demand vs capacity
  const cap = capacityAt(sim, q)
  const scale = (sim.marketGwp / P.marketGwp0) * showBoost
  const policies = (pl.share * scale) / pl.price
  const newBiz = Math.max(0, pl.share - prevShare) * scale
  const floodActive = active.has('flood-central')
  const floodHit = floodActive && r.next() < diff.floodChance
  const riskUp = Math.max(0, flow.risk)
  const claims = policies * P.claimsPerPolicy * (1 + 0.04 * riskUp) + (floodHit ? policies * P.floodClaimsSurge * pl.catExposure : 0)
  const loads: Capacity = {
    contact: (policies + P.newBusinessCallWeight * newBiz) / (sim.baseDemand.policies * cap.contact),
    claims: claims / (sim.baseDemand.claims * cap.claims),
    repair: (claims - (floodHit ? policies * P.floodClaimsSurge * pl.catExposure * 0.7 : 0)) / (sim.baseDemand.claims * cap.repair),
  }
  const excess = { contact: Math.max(0, loads.contact - 1), claims: Math.max(0, loads.claims - 1), repair: Math.max(0, loads.repair - 1) }
  const overloadStars = excess.contact * P.overload.contact.stars + excess.claims * P.overload.claims.stars + excess.repair * P.overload.repair.stars
  const overloadLR = excess.claims * P.overload.claims.lossRatio + excess.repair * P.overload.repair.lossRatio
  if (excess.contact > 0) sim.queue.push({ at: q + 1, axis: 'growth', value: P.overload.contact.growth * excess.contact * 4, source: 'callcenter-overload' })

  // 6. losses and money — player
  const gwp = pl.share * sim.marketGwp * showBoost
  const spend = planCost(plan, responses)
  const trend = (1 + P.claimsTrend) ** q
  const prevMix = sim.mix
  sim.mix = nextChannelMix(sim.mix, chAttr)
  const book = bookFactors(sim.v2, sim.mix)
  const rateLR = (book.lr * P.baseLossRatio * trend) / Math.min(P.rateCap, earnedRate(pl.rateHist))
  const marketPrice = sim.firms.reduce((a, f) => a + f.price * f.share, 0) / sim.firms.reduce((a, f) => a + f.share, 0)
  const priceGap = pl.price / marketPrice - 1
  const adverseLR = Math.max(0, priceGap - P.adverseSelection.freeGap) * P.adverseSelection.lrPerGap
  const attritional = rateLR + respLR - P.profitAxisLR * flow.profit + overloadLR + adverseLR + r.normal() * (P.attritionalNoise * book.volatility + P.riskAxisVolatility * riskUp)
  const catMult = floodActive ? (responseOf(responses, 'flood-central')?.sim?.catLossMult ?? 1) : 1
  const catGross = floodHit ? diff.floodSeverity * P.floodLossOfGwp * gwp * pl.catExposure * book.flood * r.range(P.floodSeverity[0], P.floodSeverity[1]) * (1 + 0.08 * riskUp) * catMult : 0
  // premium is written now and earned over two quarters; commission follows written premium and the channel mix
  const ep = 0.5 * (gwp + sim.prevWp)
  const prevWp = sim.prevWp
  sim.prevWp = gwp
  const rates = Object.fromEntries(CHANNELS.map((c) => [c.id, channelRates(c.id, sim.v2.channels[c.id].lever, c)])) as Record<(typeof CHANNEL_IDS)[number], { commission: number; acquisition: number }>
  const commission = CHANNEL_IDS.reduce((a, c) => a + gwp * sim.mix[c] * (rates[c].commission + rates[c].acquisition), 0)
  const adminAmount = P.adminRatio * ep - P.baselineSpend
  const expense = (commission + adminAmount + spend) / ep
  const uw = underwrite(ep, attritional, expense, catGross * (ep / gwp), qs, xl)
  const investment = pl.capital * yieldNow
  // regulation review: low satisfaction is fined unless the company fixed its claims process
  const eventImpacts: { label: string; amount: number }[] = []
  if (uw.catGross > 0) eventImpacts.push({ label: 'ความเสียหายน้ำท่วม (สุทธิหลังประกันภัยต่อ)', amount: -uw.catNet })
  const regulation = active.has('regulation-review')
  const fineFor = (share: number, sat: number, fix: number) =>
    regulation && sat < P.regulation.satisfactionBar ? P.regulation.fineAtShare20 * (share / 0.2) * (1 - fix) : 0
  const regResp = responses['regulation-review']
  const playerFine = fineFor(pl.share, pl.satisfaction, regResp === 'fullCompliance' ? 1 : regResp === 'quickFix' ? 0.5 : 0)
  if (playerFine > 0) {
    eventImpacts.push({ label: 'ค่าปรับจากการตรวจของหน่วยงานกำกับ', amount: -playerFine })
    pl.capital -= playerFine
  }
  pl.capital += uw.netResult + investment
  pl.combinedRatio = uw.lossRatio + uw.expenseRatio
  pl.crSum += pl.combinedRatio
  pl.quarters += 1

  // 7. losses and money — competitors (same model, standard treaty)
  const rivals: RivalReport[] = []
  sim.firms.forEach((f, i) => {
    const prev = state.sim.firms[i]
    const pers = comps[i].personality as Personality
    const play = (id: string) => (active.has(id) ? RIVAL_EVENT_PLAY[id][pers] : null)
    const eventActions: string[] = []
    const impacts: { label: string; amount: number }[] = []
    const g = f.share * sim.marketGwp * showBoost
    const lr = (P.baseLossRatio * trend) / Math.min(P.rateCap, earnedRate(f.rateHist)) + r.normal() * P.attritionalNoise
    const cat = floodHit || (floodActive && r.next() < diff.floodChance) ? diff.floodSeverity * P.floodLossOfGwp * g * f.catExposure * r.range(P.floodSeverity[0], P.floodSeverity[1]) : 0
    // rivals carry the same cost structure as the player at the starting channel mix (incl. routine spend)
    const res = underwrite(g, lr, P.adminRatio + commissionRate(START_MIX) + acquisitionRate(START_MIX), cat, P.quotaShare.keep, { retention: P.xl.retention * (g / 2000), cost: P.xl.cost })
    f.capital += res.netResult + f.capital * yieldNow
    f.combinedRatio = res.lossRatio + res.expenseRatio
    f.crSum += f.combinedRatio
    f.quarters += 1
    const floodPlay = play('flood-central')
    if (floodPlay) eventActions.push(floodPlay.text)
    if (cat) impacts.push({ label: 'ความเสียหายน้ำท่วม (สุทธิหลังประกันภัยต่อ)', amount: -res.catNet })
    const ecoPlay = play('economy-slowdown')
    if (ecoPlay) {
      eventActions.push(ecoPlay.text)
      if (pers === 'aggressive') f.price *= 0.98
      if (pers === 'premium') f.satisfaction += 0.04
    }
    const regPlay = play('regulation-review')
    let fine = 0
    if (regPlay) {
      eventActions.push(regPlay.text)
      const fix = regPlay.prepared ? 1 : pers === 'digital' ? 0.5 : 0
      if (regPlay.prepared) {
        const c = P.regulation.complianceAtShare20 * (f.share / 0.2)
        f.capital -= c
        impacts.push({ label: 'ค่าปรับปรุงกระบวนการสินไหม', amount: -c })
      }
      fine = fineFor(f.share, f.satisfaction, fix)
      if (fine) {
        f.capital -= fine
        impacts.push({ label: 'ค่าปรับจากการตรวจของหน่วยงานกำกับ', amount: -fine })
      }
    }
    const floodHurt = cat ? (floodPlay?.prepared ? 0.1 : 0.3) : 0
    f.satisfaction = clamp(f.satisfaction + diff.rivalService + P.satisfactionReversion * 0.5 * (P.satisfactionAnchor + 0.3 * diff.rivalService / 0.05 - f.satisfaction) - floodHurt - (fine ? 0.1 : 0), 1, 5)
    rivals.push({
      id: f.id,
      move: moves[i].text,
      eventActions,
      impacts,
      before: { share: prev.share, capital: prev.capital, combinedRatio: prev.combinedRatio, satisfaction: prev.satisfaction },
      after: { share: f.share, capital: f.capital, combinedRatio: f.combinedRatio, satisfaction: f.satisfaction },
    })
  })

  // 8. satisfaction
  const headroom = (d: number) => (d > 0 ? d * Math.max(0, 5 - pl.satisfaction) / 1.2 : d * Math.max(0, pl.satisfaction - 1) / 2.8)
  const companyDelta = updateCompany(sim.v2, {
    plan,
    responseIds: [...active].map((id) => responseOf(responses, id)?.id).filter(Boolean) as string[],
    excess,
    wordOfMouth: active.has('word-of-mouth'),
    complaints: active.has('complaints-rise'),
  })
  pl.satisfaction = clamp(pl.satisfaction + headroom(P.cxAxisStars * flow.cx - overloadStars + serviceStars(sim.v2.company.service)) + P.satisfactionReversion * (P.satisfactionAnchor - pl.satisfaction), 1, 5)
  sim.highCxStreak = pl.satisfaction >= 4.3 ? sim.highCxStreak + 1 : 0

  // year-long overload feeds the renewal season; at the end of Q4 the outlook is set for next quarter
  // average excess across the three teams (0.1 = teams ran 10% over capacity on average)
  sim.v2.year.excess += (excess.contact + excess.claims + excess.repair) / 3
  sim.v2.year.quarters += 1
  const renewalNext = q % 4 === 3 && q + 1 < state.config.quarters
  if (renewalNext) {
    sim.v2.renewal = renewalOutlook(sim.v2, sim.mix, pl.satisfaction, loads.contact > 1)
    sim.v2.year = { excess: 0, quarters: 0 }
  }

  // 9. next quarter's events
  const consequences = consequencesFor(loads, sim, plan, q)
  const nextEvents = [...consequences]
  for (const id of externalEvents(q + 1, lotusCut, r)) if (nextEvents.length < 3 && !nextEvents.includes(id)) nextEvents.push(id)
  if (renewalNext) {
    nextEvents.unshift('renewal-season')
    if (nextEvents.length > 3) nextEvents.pop()
  }
  if (nextEvents.length === 0) nextEvents.push('ev-growth')

  // 10. explain: the biggest drivers of this quarter, ranked by rough money impact
  const drivers: Driver[] = []
  if (step) {
    const pts = shareFromPrice * 100
    drivers.push({
      id: 'price',
      text: `${step < 0 ? 'ลด' : 'ขึ้น'}ราคา ${Math.abs(step * pt.market * 100).toFixed(0)}% ทำให้ส่วนแบ่ง${pts >= 0 ? 'เพิ่ม' : 'ลด'} ${Math.abs(pts).toFixed(1)} จุด`,
      tone: pts >= 0 ? 'good' : 'bad',
      weight: Math.abs(shareFromPrice) * sim.marketGwp * 0.6,
    })
  }
  const rateDrag = (rateLR - P.baseLossRatio * trend) * gwp
  if (Math.abs(rateDrag) > 8)
    drivers.push({
      id: 'rate',
      text: rateDrag > 0 ? `ราคาที่ลดไปก่อนหน้าทยอยกดกำไร Loss Ratio ${fmtPct(rateLR - P.baseLossRatio * trend)} จุด` : `ราคาที่ปรับขึ้นทยอยช่วยกำไร Loss Ratio ${fmtPct(rateLR - P.baseLossRatio * trend)} จุด`,
      tone: rateDrag > 0 ? 'bad' : 'good',
      weight: Math.abs(rateDrag),
    })
  if (playerFine > 0)
    drivers.push({ id: 'fine', text: `ถูกปรับจากการตรวจของหน่วยงานกำกับ ${Math.round(playerFine)} ล้านบาท เพราะความพอใจลูกค้าต่ำกว่าเกณฑ์`, tone: 'bad', weight: playerFine })
  else if (regulation) drivers.push({ id: 'reg-pass', text: 'ผ่านการตรวจของหน่วยงานกำกับโดยไม่ถูกปรับ', tone: 'good', weight: 20 })
  if (slowdown)
    drivers.push({ id: 'economy', text: 'เศรษฐกิจชะลอตัว ตลาดรวมหดและผลตอบแทนการลงทุนลดลงทั้งอุตสาหกรรม', tone: 'bad', weight: sim.marketGwp * 0.025 * pl.share * 0.3 + pl.capital * P.investmentYield * 0.4 })
  if (adverseLR > 0.005)
    drivers.push({
      id: 'adverse',
      text: `ราคาแพงกว่าตลาด ${Math.round(priceGap * 100)}% ลูกค้าดีย้ายออกก่อน พอร์ตที่เหลือเคลมมากขึ้น Loss Ratio ${fmtPct(adverseLR)} จุด`,
      tone: 'bad',
      weight: adverseLR * gwp,
    })
  if (floodHit)
    drivers.push({
      id: 'flood',
      text: `น้ำท่วมภาคกลางเกิดจริง เคลมรวม ${Math.round(uw.catGross)} ล้านบาท ประกันภัยต่อรับไป ${Math.round(uw.catGross - uw.catNet)} ล้าน`,
      tone: 'bad',
      weight: uw.catNet,
    })
  else if (floodActive) drivers.push({ id: 'flood-missed', text: 'ฝนหนักผ่านไปโดยไม่เกิดน้ำท่วมใหญ่', tone: 'good', weight: 15 })
  const opsNames: Record<Ops, string> = { contact: 'สายด่วนรับไม่ทัน', claims: 'เคลมเกินกำลังทีมสินไหม', repair: 'อู่ซ่อมรับรถไม่ทัน' }
  for (const k of ['contact', 'claims', 'repair'] as Ops[])
    if (excess[k] > 0.02)
      drivers.push({
        id: `overload-${k}`,
        text: `${opsNames[k]} (เกินกำลัง ${Math.round(excess[k] * 100)}%) ความพอใจลูกค้าตก`,
        tone: 'bad',
        weight: excess[k] * 900 + (k === 'contact' ? 0 : excess[k] * gwp * (k === 'claims' ? P.overload.claims.lossRatio : P.overload.repair.lossRatio)),
      })
  if (renewalResult) {
    const pts = renewalResult.dShare * 100
    drivers.push({
      id: 'renewal',
      text: `ฤดูต่ออายุ: ลูกค้าต่ออายุ ${Math.round(renewalResult.rate * 100)}% (ค่ากลาง ${Math.round(RENEWAL_BASELINE * 100)}%) ส่วนแบ่ง${pts >= 0 ? 'เพิ่ม' : 'ลด'} ${Math.abs(pts).toFixed(1)} จุด`,
      tone: pts >= 0 ? 'good' : 'bad',
      weight: Math.abs(renewalResult.dShare) * sim.marketGwp * 0.6 + 10,
    })
  }
  if (spend > 40) drivers.push({ id: 'spend', text: `ใช้งบกลยุทธ์และรับมือเหตุการณ์ ${spend} ล้านบาท`, tone: 'bad', weight: spend * 0.5 })
  const reCost = uw.grossResult - uw.netResult
  const cost = (id: DecisionId) => (tacticOf(plan, id)?.cost ?? optionOf(plan, id).cost)
  const marketingSpend = cost('marketing')
  const distributionSpend = cost('distribution')
  const pnl = buildPnl({
    mix: sim.mix,
    prevMix,
    wp: gwp,
    prevWp,
    attritionalLR: attritional,
    rates,
    lrFactor: channelLRFactors(sim.v2, sim.mix),
    // paid/incurred moves with how tightly losses are controlled: fast-track and generous service pay sooner,
    // strict loss control and an overloaded claims team pay later
    paidRatio: clamp(
      0.82 +
        (responseOf(responses, 'claims-backlog')?.id === 'fastTrack' ? 0.08 : 0) +
        (plan.repair.option === 'premium' ? 0.03 : 0) -
        (plan.repair.option === 'costCut' ? 0.04 : 0) -
        (plan.underwriting.option === 'strict' ? 0.02 : 0) -
        excess.claims * 0.5,
      0.55,
      0.95,
    ),
    catGross: uw.catGross,
    marketingSpend,
    distributionSpend,
    distChannel: distributionChannel(plan),
    otherSpend: spend - marketingSpend - distributionSpend,
    adminAmount,
    reinsurance: reCost,
    investmentIncome: investment,
  })
  if (Math.abs(reCost) > 20)
    drivers.push({
      id: 'reinsurance',
      text: reCost > 0 ? `ค่าประกันภัยต่อไตรมาสนี้ ${Math.round(reCost)} ล้านบาท (ราคาของความคุ้มครอง)` : `ประกันภัยต่อจ่ายคืนมากกว่าที่จ่ายไป ${Math.round(-reCost)} ล้านบาท`,
      tone: reCost > 0 ? 'bad' : 'good',
      weight: Math.abs(reCost) * 0.8,
    })
  for (const [src, f] of flowBySource) {
    if (src === 'pricing' || src === 'callcenter-overload') continue
    const label = CARD_BY_ID[src as DecisionId]?.title ?? EVENT_BY_ID[src]?.title ?? src
    const choice = CARD_BY_ID[src as DecisionId] ? (tacticOf(plan, src as DecisionId)?.label ?? optionOf(plan, src as DecisionId).label) : responseOf(responses, src)?.label
    if (Math.abs(f.cx) >= 0.5) drivers.push({ id: `cx-${src}`, text: `${label}: ${choice ?? ''} ${f.cx > 0 ? 'ช่วยให้ลูกค้าพอใจขึ้น' : 'ทำให้ลูกค้าพอใจน้อยลง'}`, tone: f.cx > 0 ? 'good' : 'bad', weight: Math.abs(f.cx) * 60 })
    if (Math.abs(f.profit) >= 0.5) drivers.push({ id: `pr-${src}`, text: `${label}: ${choice ?? ''} ${f.profit > 0 ? 'ช่วยลดต้นทุนเคลม' : 'เพิ่มต้นทุนเคลม'}`, tone: f.profit > 0 ? 'good' : 'bad', weight: Math.abs(f.profit) * P.profitAxisLR * gwp })
    if (Math.abs(f.growth) >= 0.8) drivers.push({ id: `gr-${src}`, text: `${label}: ${choice ?? ''} ${f.growth > 0 ? 'ดึงลูกค้าใหม่ได้' : 'ทำให้เสียลูกค้า'}`, tone: f.growth > 0 ? 'good' : 'bad', weight: Math.abs(f.growth) * 35 })
  }
  drivers.sort((a, b) => b.weight - a.weight)

  // 11. assemble next state
  const kpis: CompanyKpis = { capitalMB: Math.round(pl.capital), marketShare: pl.share, combinedRatio: pl.combinedRatio, satisfaction: pl.satisfaction }
  const competitors = state.competitors.map((c, i) => ({ ...c, marketShare: sim.firms[i].share }))
  const rank = 1 + competitors.filter((c) => c.marketShare > pl.share).length
  // channel and segment snapshot for the channel report and the Product page
  {
    const tot = pnl.columns.find((c) => c.id === 'total')!
    const bookLR = tot.incurredLoss / tot.earnedPremium
    const adequate = segLR(book.mix)
    const rr = renewalRates(sim.v2)
    sim.v2.history = [
      ...sim.v2.history,
      {
        quarter: q,
        label: `Q${state.quarter.q}/${state.quarter.year}`,
        channels: Object.fromEntries(
          CHANNEL_IDS.map((c) => {
            const col = pnl.columns.find((x) => x.id === c)!
            return [
              c,
              {
                gwp: col.writtenPremium,
                ep: col.earnedPremium,
                lossRatio: col.incurredLoss / col.earnedPremium,
                combinedRatio: (col.incurredLoss + col.expenseTotal) / col.earnedPremium,
                commission: col.commission + col.marketing,
                uwResult: col.uwResult,
                renewal: renewalResult ? (renewalResult.byChannel[c] ?? rr[c]) : rr[c],
                mix: sim.mix[c],
              },
            ]
          }),
        ) as SimState['v2']['history'][number]['channels'],
        portfolio: { ...book.mix },
        segLossRatio: Object.fromEntries(SEGMENTS.map((sg) => [sg.id, (bookLR * sg.adequateLR) / adequate])) as SimState['v2']['history'][number]['segLossRatio'],
        brand: sim.v2.company.brand,
        service: sim.v2.company.service,
        marketingSpend,
        newBusiness: Math.max(0, pl.share - prevShare) * sim.marketGwp,
      },
    ]
  }
  const report: QuarterReport = {
    v2: {
      brand: sim.v2.company.brand,
      service: sim.v2.company.service,
      brandDelta: companyDelta.brand,
      serviceDelta: companyDelta.service,
      channelMix: { ...sim.mix },
      portfolio: book.mix,
      channelSeg: Object.fromEntries(CHANNEL_IDS.map((c) => [c, { ...sim.v2.channels[c].seg }])) as QuarterReport['v2']['channelSeg'],
      renewal: renewalRates(sim.v2),
      levers: Object.fromEntries(CHANNEL_IDS.map((c) => [c, sim.v2.channels[c].lever])) as QuarterReport['v2']['levers'],
      renewalSeason: renewalResult,
    },
    quarter: state.quarter,
    plan,
    responses,
    before,
    after: kpis,
    gwp,
    lossRatio: uw.lossRatio,
    expenseRatio: uw.expenseRatio,
    uwResult: uw.netResult,
    investmentIncome: investment,
    reinsuranceCost: reCost,
    catLossGross: uw.catGross,
    catLossNet: uw.catNet,
    flood: floodHit ? 'hit' : floodActive ? 'missed' : 'none',
    spend,
    loads,
    drivers,
    competitorMoves: moves,
    rivals,
    eventImpacts,
    consequences,
    rank,
    earnedPremium: ep,
    pnl,
  }

  sim.shareHistory = [...(sim.shareHistory ?? []), Object.fromEntries([['player', pl.share], ...sim.firms.map((f) => [f.id, f.share] as [string, number])])]
  const next: GameState = {
    ...state,
    quarter: quarterStamp(q + 1),
    kpis,
    kpiHistory: [...state.kpiHistory, kpis],
    competitors,
    events: nextEvents
      .map((id) => EVENT_BY_ID[id])
      .filter((e) => e && SCENARIO_BY_EVENT[e.id])
      .map((e) => (e.id === 'renewal-season' && sim.v2.renewal ? { ...e, detail: renewalDetail(sim.v2.renewal) } : e)),
    sim,
    lastReport: report,
    outcome: null,
  }
  const bankrupt = pl.capital < state.config.startingCapitalMB * P.bankruptcyFraction
  if (bankrupt || q + 1 >= state.config.quarters) {
    const st = standings(next, sim)
    next.outcome = { reason: bankrupt ? 'bankrupt' : 'completed', standings: st, playerRank: 1 + st.findIndex((s) => s.id === 'player') } satisfies GameOutcome
  }
  return next
}
