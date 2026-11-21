import type { ReactNode } from 'react'
import { brandUrl, spriteUrl } from '../../assets/registry'

/** Shared building blocks for the intro slides: same colours and type as the game. */

export const img = (key: string) => spriteUrl(key as never)
export const cover = () => brandUrl('cover.jpg')
export const logo = () => brandUrl('logo.webp')

/** Light slide with a conclusion headline (one idea per slide). */
export function Slide({ kicker, title, children, art }: { kicker: string; title: ReactNode; children: ReactNode; art?: ReactNode }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#eef5ff] via-white to-[#e3eeff]">
      <div className="absolute -right-40 -top-40 size-[520px] rounded-full bg-brand-100/50 blur-2xl" />
      {art}
      <div className="relative px-[88px] pt-[72px]">
        <div className="text-[20px] font-semibold text-brand-600 tracking-wide">{kicker}</div>
        <h1 className={`font-display font-bold leading-[1.15] text-navy-900 mt-2 max-w-[1420px] ${typeof title === 'string' && title.length > 44 ? 'text-[44px]' : 'text-[50px]'}`}>{title}</h1>
      </div>
      {/* the body fills the space under the headline, centred, so short slides don't leave a blank bottom */}
      <div className="absolute left-[88px] right-[88px] top-[230px] bottom-[84px] flex flex-col justify-center">{children}</div>
    </div>
  )
}

/** "Mock numbers" stamp, required wherever game numbers appear. */
export function MockTag({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 text-[15px] font-medium ${className}`}>
      ตัวเลขสมมติในเกม
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] bg-white/90 border border-brand-100 shadow-[0_18px_40px_-24px_rgba(20,50,110,0.45)] ${className}`}>{children}</div>
}
