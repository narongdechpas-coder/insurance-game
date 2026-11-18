import type { SpriteKey } from '../assets/registry'
import type { GameEvent } from '../game/types'

/** Illustration for each event icon. `null` = art not delivered yet (UI shows an icon placeholder). */
export const EVENT_ART: Record<GameEvent['icon'], SpriteKey | null> = {
  ev: 'icons/ev-charger',
  flood: 'events/flood',
  competitor: 'events/rival-promo',
  regulation: 'icons/clipboard',
  economy: null,
}
