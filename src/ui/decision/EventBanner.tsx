import type { ReactNode } from 'react'
import { hasSprite, spriteUrl } from '../../assets/registry'
import type { GameEvent } from '../../game/types'

/** Wide banner art per event icon: public/assets/banners/<name>.webp (picked up by the sprite meta step). */
const BANNER: Record<GameEvent['icon'], string> = {
  ev: 'banners/ev',
  flood: 'banners/flood',
  competitor: 'banners/competitor',
  regulation: 'banners/regulation',
  economy: 'banners/economy',
  service: 'banners/service',
  claims: 'banners/claims',
  repair: 'banners/repair',
  complaint: 'banners/complaint',
  adverse: 'banners/adverse',
  referral: 'banners/referral',
  motorShow: 'banners/motor-show',
  motorExpo: 'banners/motor-expo',
  yearEndPromo: 'banners/year-end-promo',
  renewal: 'banners/renewal',
}

/** Until a banner is delivered: a dark wash in the event's colour, with the event illustration on the right. */
const WASH: Record<GameEvent['kind'], string> = {
  threat: 'bg-[linear-gradient(110deg,#3b0d1a_0%,#6b1622_45%,#22183f_100%)]',
  opportunity: 'bg-[linear-gradient(110deg,#06372f_0%,#0b5d4b_45%,#10285a_100%)]',
  competitor: 'bg-[linear-gradient(110deg,#3d2205_0%,#7a4a0c_45%,#1c2753_100%)]',
}

/**
 * Header of the event screen: a wide news-style banner with white text, so it never looks like the
 * company's own management screens (light header, building art on the left, department head on the
 * right). No portrait here: the banner art carries the scene. Same height, so the layout below stays put.
 */
export function EventBanner({
  icon,
  kind,
  art,
  kicker,
  title,
  subtitle,
  chips,
}: {
  icon: GameEvent['icon']
  kind: GameEvent['kind']
  art: string | null
  kicker: ReactNode
  title: string
  subtitle: ReactNode
  chips: ReactNode
}) {
  const key = BANNER[icon]
  const banner = hasSprite(key) ? key : null
  return (
    <header
      data-sticky-head
      data-event-banner={banner ? 'art' : 'wash'}
      className="sticky top-0 z-20 relative overflow-hidden h-[178px] flex items-center px-8 gap-6 shrink-0 text-white shadow-[0_8px_14px_-12px_rgba(8,26,66,0.6)]"
    >
      {banner ? (
        <img src={spriteUrl(banner)} alt="" data-banner-art={banner} className="absolute inset-0 w-full h-full object-cover object-[center_35%]" />
      ) : (
        <>
          <div className={`absolute inset-0 ${WASH[kind]}`} />
          <div className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(135deg,#fff_0_2px,transparent_2px_14px)]" />
          {art && (
            <img
              src={spriteUrl(art as never)}
              alt=""
              data-head-art={art}
              className="absolute right-[56px] top-1/2 -translate-y-1/2 h-[150px] w-[200px] object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.45)]"
            />
          )}
        </>
      )}
      {/* keeps the text readable on any banner: dark on the left, clear on the right */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,16,42,0.86)_0%,rgba(6,16,42,0.55)_42%,rgba(6,16,42,0.08)_75%,rgba(6,16,42,0)_100%)]" />
      <div className="relative min-w-0 flex-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.45)]">
        <div className="text-[13px] text-white/85 font-medium">{kicker}</div>
        <h2 className={`font-display font-bold leading-tight truncate mt-0.5 ${title.length > 24 ? 'text-[24px]' : 'text-[30px]'}`}>{title}</h2>
        <p className="text-[16px] text-white/90 mt-0.5 truncate">{subtitle}</p>
        <div className="flex flex-nowrap items-center gap-1.5 mt-2.5 overflow-hidden whitespace-nowrap [text-shadow:none]">{chips}</div>
      </div>
    </header>
  )
}
