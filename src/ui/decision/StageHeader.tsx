import type { ReactNode } from 'react'
import { spriteUrl } from '../../assets/registry'

/**
 * The one header every Decision Room stage uses (same layout as the strategy cards):
 * building art on the left, kicker · title · one-line question, small chips, the department
 * head on the right. Long explanations go in the chips or the stage body, never in the header.
 */
export function StageHeader({
  art,
  kicker,
  title,
  subtitle,
  chips,
  head,
  right,
  compact = false,
  narrowArt = false,
}: {
  art: string | null
  kicker: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  chips?: ReactNode
  head?: string | null
  /** controls next to the portrait (e.g. tabs) */
  right?: ReactNode
  compact?: boolean
  /** narrower art (leaves room for long titles such as event names) */
  narrowArt?: boolean
}) {
  return (
    <header
      data-sticky-head
      className={`sticky top-0 z-20 overflow-hidden shadow-[0_8px_14px_-12px_rgba(20,50,110,0.45)] bg-gradient-to-br from-brand-100 via-white to-brand-50 flex items-center px-8 gap-6 shrink-0 transition-[height] duration-300 ${compact ? 'h-[128px]' : 'h-[178px]'}`}
    >
      {art && (
        <img
          src={spriteUrl(art as never)}
          alt=""
          data-head-art={art}
          className={`shrink-0 object-contain drop-shadow-[0_12px_16px_rgba(20,50,110,0.25)] transition-all duration-300 ${compact ? 'h-[108px] w-[160px]' : narrowArt ? 'h-[140px] w-[170px]' : 'h-[150px] w-[230px]'}`}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-brand-600 font-medium">{kicker}</div>
        <h2 className={`font-display font-bold leading-tight text-navy-900 truncate ${compact ? 'text-[25px]' : typeof title === 'string' && title.length > 24 ? 'text-[24px]' : 'text-[30px]'}`}>{title}</h2>
        {subtitle && <p className="text-[16px] text-navy-800 mt-0.5 truncate">{subtitle}</p>}
        {chips && !compact && <div className="flex flex-nowrap items-center gap-1.5 mt-2.5 overflow-hidden whitespace-nowrap">{chips}</div>}
      </div>
      {right && <div className="shrink-0 self-center">{right}</div>}
      {head && (
        <img
          key={head}
          src={spriteUrl(head as never)}
          alt=""
          data-portrait={head}
          className={`self-end shrink-0 object-contain object-bottom drop-shadow-[0_10px_14px_rgba(20,50,110,0.3)] transition-all duration-300 ${compact ? 'h-[116px] w-[110px]' : 'h-[164px] w-[150px]'}`}
        />
      )}
    </header>
  )
}

/** A small chip under the header title (same look as the strategy cards' module chips). */
export function HeaderChip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'good' | 'warn' }) {
  const cls = tone === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : tone === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-brand-100 text-brand-600'
  return <span className={`text-[11.5px] rounded-full border px-2.5 py-0.5 ${cls}`}>{children}</span>
}

/**
 * The department head speaks: a dark speech bubble in the free strip above the stage panel,
 * its tail pointing down at the portrait on the right of the header. Anchored at the bottom, so
 * short and long bubbles keep the same gap to the panel on every stage.
 */
export function ManagerBubble({ id, lines, strong, tone = 'dark' }: { id?: string; lines?: ReactNode; strong?: ReactNode; tone?: 'dark' | 'warn' }) {
  if (!lines && !strong) return null
  const bg = tone === 'warn' ? 'bg-amber-800/95' : 'bg-navy-900/95'
  return (
    <div
      data-manager-bubble
      data-event-detail={id}
      className="absolute top-[84px] h-[74px] flex flex-col justify-end left-[calc(560px+max(0px,100%-1600px)*0.15)] right-[calc(476px+max(0px,100%-1600px)*0.15)] pointer-events-none anim-rise z-30"
    >
      <div className={`relative pointer-events-auto rounded-2xl ${bg} text-white px-4 py-2 shadow-[0_10px_24px_-10px_rgba(8,26,66,0.7)]`}>
        {lines && <p className="text-[12.5px] leading-snug text-white/85 line-clamp-3">{lines}</p>}
        {strong && <p className="text-[14px] font-semibold leading-snug mt-0.5 line-clamp-2">{strong}</p>}
        <span className={`absolute -bottom-2 right-12 size-4 rotate-45 ${bg}`} />
      </div>
    </div>
  )
}
