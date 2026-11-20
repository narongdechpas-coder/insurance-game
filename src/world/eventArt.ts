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
