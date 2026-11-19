import { EVENT_BY_ID } from '../game/data/events'
import { CARD_BY_ID } from '../game/decisions/cards'
import type { Driver } from '../game/sim/types'
import type { LocationId } from '../game/types'
import { hasSprite, type SpriteKey } from './registry'

/**
 * Half portraits: the advisor and one head per department, each in three moods.
 * Art lives at public/assets/portraits/<who>-<mood>.png (sliced from docs/prompts/portraits.md).
 * Every lookup returns null until the art exists, so callers keep their current art.
 */
export type Mood = 'normal' | 'happy' | 'shocked'
export type Who = LocationId | 'advisor'

export function portraitKey(who: Who, mood: Mood = 'normal'): SpriteKey | null {
  for (const m of [mood, 'normal']) {
    const k = `portraits/${who}-${m}`
    if (hasSprite(k)) return k
  }
  return null
}

/** Location status → face: a threat shocks, an opportunity pleases, anything else is calm. */
export function moodOfStatus(status: 'good' | 'watch' | 'alert' | 'chance'): Mood {
  return status === 'alert' ? 'shocked' : status === 'chance' ? 'happy' : 'normal'
}

const DRIVER_DEPT: Record<string, LocationId> = {
  price: 'hq',
  rate: 'hq',
  adverse: 'hq',
  spend: 'hq',
  economy: 'hq',
  flood: 'risk',
  'flood-missed': 'risk',
  reinsurance: 'risk',
  'overload-contact': 'customers',
  'overload-claims': 'claims',
  'overload-repair': 'repair',
  fine: 'claims',
  'reg-pass': 'claims',
  renewal: 'customers',
}

/** Which department head explains a "why" line. cx-/pr-/gr-<source> belong to that card's or event's home. */
export function driverDept(id: string): LocationId {
  if (DRIVER_DEPT[id]) return DRIVER_DEPT[id]
  const src = id.replace(/^(cx|pr|gr)-/, '')
  return CARD_BY_ID[src as keyof typeof CARD_BY_ID]?.location ?? EVENT_BY_ID[src]?.locations[0] ?? 'hq'
}

const SEVERE = /^(overload-|flood$|fine$|adverse$)/
export function driverMood(d: Pick<Driver, 'id' | 'tone' | 'weight'>): Mood {
  if (d.tone === 'good') return 'happy'
  return SEVERE.test(d.id) || d.weight >= 60 ? 'shocked' : 'normal'
}
