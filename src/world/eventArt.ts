import type { SpriteKey } from '../assets/registry'
import type { GameEvent } from '../game/types'

/** Illustration for each event icon. `null` = art not delivered yet (UI shows an icon placeholder). */
export const EVENT_ART: Record<GameEvent['icon'], SpriteKey | null> = {
  ev: 'events/ev-growth',
  flood: 'events/flood',
  competitor: 'events/rival-promo',
  regulation: 'events/regulation',
  economy: 'events/economy',
  service: 'characters/call-agent',
  claims: 'events/claims-surge',
  repair: 'environments/tyres',
  complaint: 'icons/clipboard',
  adverse: 'icons/shield',
  referral: 'characters/manager',
  motorShow: 'events/motor-show',
  motorExpo: 'events/motor-expo',
  yearEndPromo: 'events/year-end-promo',
}
