import { CARD_BY_ID, CARDS, choiceFor, isUnlocked } from './decisions/cards'
import { keptPlan } from './decisions/plan'
import { SCENARIO_BY_EVENT, type Responses } from './decisions/scenarios'
import type { Choice, DecisionId, Impact, QuarterPlan } from './decisions/types'
import { keepPrices, settingsOf, staffOf, withChannelSettings, type ChannelSettings, type SegmentSteps, type StaffTarget } from './forecast'
import { simulateQuarter } from './sim/engine'
import type { GameState } from './types'

/**
 * Phase 3: numbers on every option, from the engine itself. A draft is played for three quarters
 * in calm mode (no randomness, no flood) with its settings kept, and compared with keeping what the
 * company does now. The arrows on the cards are read from these numbers, so they always agree.
 */

export interface Draft {
  plan: QuarterPlan
  responses: Responses
  channels: ChannelSettings
  steps: SegmentSteps
  staff: StaffTarget
  orders: string[]
}

export interface Outcome {
  /** written premium next quarter (MB) */
  gwp: number
  /** net U/W result over three quarters, after every cost incl. the plan's own spend (MB) */
  uw3: number
  /** satisfaction after three quarters */
  sat3: number
  /** the busiest team next quarter (load, 1 = full) */
  peakLoad: number
  peakTeam: 'contact' | 'claims' | 'repair'
  /** net flood loss if the central flood hit next quarter (MB) */
  floodLoss: number
}

export interface Delta {
  dGwp: number
  dUw3: number
  dSat3: number
  peakLoad: number
  peakTeam: Outcome['peakTeam']
  dFloodLoss: number
  /** relative change of premium and flood loss, for the arrows */
  gwpPct: number
  floodPct: number
  arrows: Impact
}

const calm = (s: GameState, plan: QuarterPlan, responses: Responses, force = false) => simulateQuarter(s, plan, responses, { calm: true, forceFlood: force })

/** The plan a later quarter keeps: same cards, no new price moves, no one-off pushes. */
const keep = (p: QuarterPlan): QuarterPlan => ({ ...p, pricing: { option: 'hold' }, distribution: { option: CARD_BY_ID.distribution.defaultOption } })

export function playDraft(s: GameState, dIn: Draft): Outcome {
  // events not answered yet count as "do nothing", like the reference
  const d = { ...dIn, responses: { ...neutralResponses(s, {}), ...dIn.responses } }
  const start = withChannelSettings(s, d.channels, d.steps, d.staff, d.orders)
  const q1 = calm(start, d.plan, d.responses)
  const q2 = calm({ ...q1, events: [] }, keep(d.plan), {})
  const q3 = calm({ ...q2, events: [] }, keep(d.plan), {})
  const flood = calm(start, d.plan, d.responses, true)
  const L = q1.lastReport!.loads
  const peakTeam = (['contact', 'claims', 'repair'] as const).reduce((a, k) => (L[k] > L[a] ? k : a), 'contact' as Outcome['peakTeam'])
  return {
    gwp: q1.lastReport!.gwp,
    uw3: q1.lastReport!.uwResult + q2.lastReport!.uwResult + q3.lastReport!.uwResult,
    sat3: q3.kpis.satisfaction,
    peakLoad: L[peakTeam],
    peakTeam,
    floodLoss: flood.lastReport!.catLossNet,
  }
}

/** Arrow thresholds (game design): what counts as a small, clear or big move. */
const step = (v: number, cuts: [number, number, number]) => {
  const a = Math.abs(v)
  const n = a >= cuts[2] ? 3 : a >= cuts[1] ? 2 : a >= cuts[0] ? 1 : 0
  return Math.sign(v) * n
}

export function deltaOf(o: Outcome, base: Outcome): Delta {
  const gwpPct = base.gwp ? o.gwp / base.gwp - 1 : 0
  const floodPct = base.floodLoss ? o.floodLoss / base.floodLoss - 1 : 0
  return {
    dGwp: o.gwp - base.gwp,
    dUw3: o.uw3 - base.uw3,
    dSat3: o.sat3 - base.sat3,
    peakLoad: o.peakLoad,
    peakTeam: o.peakTeam,
    dFloodLoss: o.floodLoss - base.floodLoss,
    gwpPct,
    floodPct,
    arrows: {
      growth: step(gwpPct, [0.01, 0.03, 0.06]),
      profit: step(o.uw3 - base.uw3, [5, 20, 50]),
      risk: step(floodPct, [0.03, 0.1, 0.25]),
      cx: step(o.sat3 - base.sat3, [0.02, 0.06, 0.12]),
    },
  }
}

/** The draft with nothing changed: every card as the company runs it now. */
export function keptDraft(s: GameState, d: Draft): Draft {
  return { ...d, plan: keptPlan(s), channels: settingsOf(s), steps: keepPrices(), staff: staffOf(s), orders: [], responses: neutralResponses(s, d.responses) }
}

/** Each open event answered with its "do nothing" response (all arrows zero), the reference for responses. */
export function neutralResponses(s: GameState, current: Responses): Responses {
  const out: Responses = { ...current }
  for (const e of s.events) {
    const sc = SCENARIO_BY_EVENT[e.id]
    if (!sc) continue
    const zero = sc.responses.find((r) => r.impact.growth === 0 && r.impact.profit === 0 && r.impact.risk === 0 && r.impact.cx === 0) ?? sc.responses[sc.responses.length - 1]
    out[e.id] = zero.id
  }
  return out
}

export const choiceKey = (c: Choice) => `${c.option}${c.tactic ? `:${c.tactic}` : ''}`

/** Every choice on a card (each stance with each tactic), against keeping the card as the company runs it now. */
export function forecastCard(s: GameState, d: Draft, card: DecisionId): Record<string, Delta> {
  const kept = keptPlan(s)[card]
  const base = playDraft(s, { ...d, plan: { ...d.plan, [card]: kept } })
  const out: Record<string, Delta> = {}
  for (const o of CARD_BY_ID[card].options) {
    const choices: Choice[] = o.tactics ? o.tactics.map((t) => ({ option: o.id, tactic: t.id })) : [{ option: o.id }]
    for (const c of choices) out[choiceKey(c)] = deltaOf(playDraft(s, { ...d, plan: { ...d.plan, [card]: c } }), base)
    // the stance tile shows its recommended tactic
    if (o.tactics) out[o.id] = out[choiceKey(choiceFor(o))]
  }
  return out
}

/** Every response to one event, against its "do nothing" response. */
export function forecastResponses(s: GameState, d: Draft, eventId: string): Record<string, Delta> {
  const sc = SCENARIO_BY_EVENT[eventId]
  if (!sc) return {}
  const ref = neutralResponses(s, {})[eventId]
  const base = playDraft(s, { ...d, responses: { ...d.responses, [eventId]: ref } })
  return Object.fromEntries(sc.responses.map((r) => [r.id, deltaOf(playDraft(s, { ...d, responses: { ...d.responses, [eventId]: r.id } }), base)]))
}

export interface AttributionRow {
  id: string
  label: string
  delta: Delta
}

/**
 * Confirm screen: what each change in the draft does on its own (vs keeping everything as it is),
 * plus a "together" row so the rows add up exactly to the whole plan.
 */
export function attributePlan(s: GameState, d: Draft): { rows: AttributionRow[]; together: Delta; total: Delta; base: Outcome; full: Outcome } {
  const kd = keptDraft(s, d)
  const base = playDraft(s, kd)
  const full = playDraft(s, d)
  const rows: AttributionRow[] = []
  const add = (id: string, label: string, part: Partial<Draft>) => rows.push({ id, label, delta: deltaOf(playDraft(s, { ...kd, ...part }), base) })
  const kept = kd.plan
  for (const c of CARDS) {
    if (!isUnlocked(c, s.quarter.index) || c.id === 'pricing' || c.id === 'distribution') continue
    const a = d.plan[c.id]
    const b = kept[c.id]
    if (a.option !== b.option || (a.tactic ?? null) !== (b.tactic ?? null)) add(c.id, c.title, { plan: { ...kept, [c.id]: a } })
  }
  if (Object.values(d.steps).some((x) => x !== 2)) add('price', 'ราคาเบี้ยรายกลุ่ม', { steps: d.steps })
  if (Object.keys(d.channels).some((c) => d.channels[c as keyof ChannelSettings].lever !== kd.channels[c as keyof ChannelSettings].lever || d.channels[c as keyof ChannelSettings].focus !== kd.channels[c as keyof ChannelSettings].focus))
    add('channels', 'ช่องทางขาย', { channels: d.channels })
  if (Object.entries(d.staff).some(([t, n]) => n !== kd.staff[t as keyof StaffTarget])) add('staff', 'ทีมงาน', { staff: d.staff })
  if (d.orders.length) add('systems', 'ระบบที่สั่งพัฒนา', { orders: d.orders })
  for (const [ev, r] of Object.entries(d.responses)) {
    if (kd.responses[ev] === r) continue
    const sc = SCENARIO_BY_EVENT[ev]
    if (sc) add(`event:${ev}`, `ตอบเหตุการณ์: ${sc.responses.find((x) => x.id === r)?.label ?? r}`, { responses: { ...kd.responses, [ev]: r } })
  }
  const total = deltaOf(full, base)
  const sum = (k: 'dGwp' | 'dUw3' | 'dSat3' | 'dFloodLoss') => rows.reduce((a, r) => a + r.delta[k], 0)
  const together: Delta = { ...total, dGwp: total.dGwp - sum('dGwp'), dUw3: total.dUw3 - sum('dUw3'), dSat3: total.dSat3 - sum('dSat3'), dFloodLoss: total.dFloodLoss - sum('dFloodLoss') }
  return { rows, together, total, base, full }
}
