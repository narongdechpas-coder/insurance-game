import type { SpriteKey } from '../assets/registry'
import type { GameEvent } from '../game/types'

/** Illustration for each event icon. `null` = art not delivered yet (UI shows an icon placeholder). */
export const EVENT_ART: Record<GameEvent['icon'], SpriteKey | null> = {
  ev: 'events/ev-growth',
  flood: 'events/flood',
  competitor: 'events/rival-promo',
  regulation: 'events/regulation',
  economy: 'events/economy',
  service: 'events/call-overload',
  claims: 'events/claims-surge',
  repair: 'events/repair-delay',
  complaint: 'events/complaint',
  adverse: 'events/adverse-selection',
  referral: 'events/referral',
  motorShow: 'events/motor-show',
  motorExpo: 'events/motor-expo',
  yearEndPromo: 'events/year-end-promo',
  renewal: 'events/renewal-season',
}

/**
 * One bold symbol per event, for small spots (city event strip, event list, building bubbles,
 * confirm screen): the detailed dioramas turn to noise below ~64px. The event screen keeps its banners.
 */
export const EVENT_ICON: Record<GameEvent['icon'], SpriteKey> = {
  ev: 'icons/event-ev',
  flood: 'icons/event-flood',
  competitor: 'icons/event-competitor',
  regulation: 'icons/event-regulation',
  economy: 'icons/event-economy',
  service: 'icons/event-service',
  claims: 'icons/event-claims',
  repair: 'icons/event-repair',
  complaint: 'icons/event-complaint',
  adverse: 'icons/event-adverse',
  referral: 'icons/event-referral',
  motorShow: 'icons/event-motor-show',
  motorExpo: 'icons/event-motor-expo',
  yearEndPromo: 'icons/event-year-end-promo',
  renewal: 'icons/event-renewal',
}
