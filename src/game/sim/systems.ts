import OPS_JSON from '../data/operations.json'
import type { ChannelId, Mix } from './channels'

/**
 * Engine v3 phase 3a: systems vs people. A system takes quarters to build, carries a project risk,
 * and then customers (or partners) move onto it gradually. Customer systems remove work; partner
 * systems cut cost and make partners push our policies. Version 2 upgrades a live version 1.
 * All numbers in operations.json are game-design assumptions.
 */

type SysJson = typeof OPS_JSON.systems
export type SystemId = keyof SysJson
export const SYSTEM_IDS = Object.keys(OPS_JSON.systems) as SystemId[]
export const SYSTEMS = OPS_JSON.systems as Record<
  SystemId,
  { label: string; side: 'customer' | 'partner'; channel?: ChannelId; icon: string; v1: SysVersion; v2: SysVersion }
>
export interface SysEffects {
  calls?: number
  claimsWork?: number
  survey?: number
  issuance?: number
  issuanceChannel?: number
  renewal?: number
  pull?: number
  repair?: number
  lr?: number
  service?: number
}
export interface SysVersion {
  label: string
  dev: number
  cost: number
  maint: number
  effects: SysEffects
}

export interface SysState {
  /** version in use (0 = not live yet) */
  live: 0 | 1 | 2
  /** version being built, quarters of work left, and installment per quarter */
  building: { version: 1 | 2; left: number; perQuarter: number; slipped?: boolean } | null
  /** share of the full effect this version delivers (0.7 when the project under-delivered) */
  factor: number
  /** customer systems: share of each channel's customers using it; partner systems: one share */
  adoption: Record<ChannelId, number> | number
  /** quarter index the current version went live */
  liveAt: number
}

const CH: ChannelId[] = ['dealer', 'agent', 'direct']
const A = OPS_JSON.adoption

export function systemAlias(id: string): SystemId | null {
  const a = (OPS_JSON.systemAlias as Record<string, string>)[id]
  return a ? (a as SystemId) : id in OPS_JSON.systems ? (id as SystemId) : null
}

/** Systems under construction (each uses one IT team slot). */
export const buildingCount = (sys: Partial<Record<SystemId, SysState>>) => SYSTEM_IDS.filter((id) => sys[id]?.building).length

/** What ordering a system would do now: build v1, upgrade to v2, or nothing. */
export function nextVersion(s: SysState | undefined): 1 | 2 | null {
  if (!s) return 1
  if (s.building) return null
  if (s.live === 1) return 2
  return null
}

/** Effective use of a system: factor × adoption (customer systems weighted by the channel mix). */
export function usage(s: SysState | undefined, mix: Mix): number {
  if (!s || !s.live) return 0
  const a = typeof s.adoption === 'number' ? s.adoption : CH.reduce((x, c) => x + mix[c] * (s.adoption as Record<ChannelId, number>)[c], 0)
  return s.factor * a
}

export interface SystemsTick {
  /** this quarter's build installments (strategy spend) */
  spend: number
  /** upkeep of live systems (fixed cost) */
  maint: number
  /** events for the report: went live, delayed, under-delivered */
  news: { id: SystemId; version: 1 | 2; kind: 'live' | 'delayed' | 'partial' | 'started' }[]
}

/**
 * One quarter: start ordered builds (IT slots permitting), pay installments, finish builds (with
 * project risk), and move customers/partners onto live systems. Mutates `sys`.
 */
export function runSystems(sys: Partial<Record<SystemId, SysState>>, q: number, orders: string[], brand: number, rand: () => number): SystemsTick {
  const tick: SystemsTick = { spend: 0, maint: 0, news: [] }
  for (const raw of orders) {
    const id = systemAlias(raw)
    if (!id) continue
    const v = nextVersion(sys[id])
    if (!v || buildingCount(sys) >= OPS_JSON.itSlots) continue
    const spec = SYSTEMS[id][v === 1 ? 'v1' : 'v2']
    const cur = sys[id]
    sys[id] = {
      live: cur?.live ?? 0,
      factor: cur?.factor ?? 1,
      adoption: cur?.adoption ?? (SYSTEMS[id].side === 'customer' ? { dealer: 0, agent: 0, direct: 0 } : 0),
      liveAt: cur?.liveAt ?? -1,
      building: { version: v, left: spec.dev, perQuarter: spec.cost / spec.dev },
    }
    tick.news.push({ id, version: v, kind: 'started' })
  }
  for (const id of SYSTEM_IDS) {
    const s = sys[id]
    if (!s) continue
    // a build finished last quarter goes live now, unless the project slips one quarter (once)
    const done = s.building
    if (done && done.left === 0) {
      if (!done.slipped && rand() < OPS_JSON.systemRisk.delay) {
        done.slipped = true
        tick.news.push({ id, version: done.version, kind: 'delayed' })
      } else {
        s.factor = rand() < OPS_JSON.systemRisk.partial ? OPS_JSON.systemRisk.partialFactor : 1
        const first = s.live === 0
        s.live = done.version
        s.liveAt = q
        s.building = null
        // first launch: customers and partners start moving over; an upgrade keeps its users
        if (first) s.adoption = SYSTEMS[id].side === 'customer' ? { ...(A.customer.start as Record<ChannelId, number>) } : A.partner.start
        tick.news.push({ id, version: s.live, kind: s.factor < 1 ? 'partial' : 'live' })
      }
    }
    // adoption grows on systems that were live before this quarter
    if (s.live && s.liveAt < q) {
      if (typeof s.adoption === 'number') s.adoption = Math.min(1, s.adoption + A.partner.step)
      else {
        const boost = Math.max(0, ((brand - 50) / 10) * A.customer.brandPer10)
        for (const c of CH) s.adoption[c] = Math.min(1, s.adoption[c] + (A.customer.step as Record<ChannelId, number>)[c] + boost)
      }
    }
    if (s.live) tick.maint += SYSTEMS[id][s.live === 1 ? 'v1' : 'v2'].maint
    // pay this quarter's build installment
    const b = s.building
    if (b && b.left > 0) {
      tick.spend += b.perQuarter
      b.left -= 1
    }
  }
  return tick
}

/** Combined effect of all live systems this quarter. */
export function systemEffects(sys: Partial<Record<SystemId, SysState>>, mix: Mix) {
  const out = { calls: 0, claimsWork: 0, survey: 0, issuance: 0, repair: 0, lr: 0, service: 0, pull: { dealer: 0, agent: 0, direct: 0 } as Record<ChannelId, number>, renewal: { dealer: 0, agent: 0, direct: 0 } as Record<ChannelId, number> }
  for (const id of SYSTEM_IDS) {
    const s = sys[id]
    if (!s?.live) continue
    const spec = SYSTEMS[id]
    const e = spec[s.live === 1 ? 'v1' : 'v2'].effects as SysEffects
    const u = usage(s, mix)
    out.calls += (e.calls ?? 0) * u
    out.claimsWork += (e.claimsWork ?? 0) * u
    out.survey += (e.survey ?? 0) * u
    out.issuance += (e.issuance ?? 0) * u
    out.repair += (e.repair ?? 0) * u
    out.lr += (e.lr ?? 0) * u
    out.service += (e.service ?? 0) * u
    if (spec.channel) {
      out.pull[spec.channel] += (e.pull ?? 0) * u
      out.issuance += (e.issuanceChannel ?? 0) * u * mix[spec.channel]
    }
    if (e.renewal && typeof s.adoption !== 'number') for (const c of CH) out.renewal[c] += e.renewal * s.factor * s.adoption[c]
  }
  return out
}

/** Build installments this quarter if `orders` are placed now (ongoing builds + new orders that fit the IT slots). */
export function systemSpendPreview(sys: Partial<Record<SystemId, SysState>> = {}, orders: string[] = []): number {
  let spend = SYSTEM_IDS.reduce((a, id) => a + (sys[id]?.building && sys[id]!.building!.left > 0 ? sys[id]!.building!.perQuarter : 0), 0)
  let slots = OPS_JSON.itSlots - buildingCount(sys)
  for (const raw of orders) {
    const id = systemAlias(raw)
    if (!id || slots <= 0) continue
    const v = nextVersion(sys[id])
    if (!v) continue
    const spec = SYSTEMS[id][v === 1 ? 'v1' : 'v2']
    spend += spec.cost / spec.dev
    slots--
  }
  return spend
}
