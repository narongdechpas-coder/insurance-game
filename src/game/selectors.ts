import type { GameState, LocationId, Status } from './types'

/** Rank of the player among all companies (1 = biggest). */
export function playerRank(s: GameState): number {
  return 1 + s.competitors.filter((c) => c.marketShare > s.kpis.marketShare).length
}

/**
 * Status of each place in the world, derived from active events.
 * Threats outrank competitor moves, which outrank opportunities.
 */
export function locationStatus(s: GameState, id: LocationId): Status {
  const hits = s.events.filter((e) => e.locations.includes(id))
  if (hits.some((e) => e.kind === 'threat')) return 'alert'
  if (hits.some((e) => e.kind === 'competitor')) return 'watch'
  if (hits.some((e) => e.kind === 'opportunity')) return 'chance'
  return 'good'
}

export function eventsAt(s: GameState, id: LocationId) {
  return s.events.filter((e) => e.locations.includes(id))
}

export const STATUS_LABEL: Record<Status, string> = {
  good: 'ราบรื่น',
  watch: 'ต้องจับตา',
  alert: 'ต้องรับมือ',
  chance: 'มีโอกาส',
}
