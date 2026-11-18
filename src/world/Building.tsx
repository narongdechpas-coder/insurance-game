import { memo, useCallback, type MouseEvent } from 'react'
import { SPRITES, spriteUrl } from '../assets/registry'
import { LOCATION_BY_ID } from '../game/data/locations'
import { locationStatus } from '../game/selectors'
import type { LocationId } from '../game/types'
import { useGameStore } from '../store/useGameStore'
import { isOpaque } from './hitTest'
import { LOCATION_ICONS } from './icons'
import { BUILDINGS } from './layout'
import { project } from './projection'


const STATUS_DOT = { good: 'bg-good', watch: 'bg-watch', alert: 'bg-alert pulse-alert', chance: 'bg-chance' }

/** A clickable place in the world: sprite + floating name pill. */
export const Building = memo(function Building({ id }: { id: LocationId }) {
  const place = BUILDINGS[id]
  const loc = LOCATION_BY_ID[id]
  const m = SPRITES[place.sprite]
  const [ax, ay] = place.anchor ?? [0.5, 0.75]
  const p = project(place.u, place.v)
  const w = m.w * place.scale
  const h = m.h * place.scale
  const left = p.x - w * ax
  const top = p.y - h * ay

  const hovered = useGameStore((s) => s.ui.hovered === id)
  const selected = useGameStore((s) => s.ui.selected === id)
  const status = useGameStore((s) => locationStatus(s.game, id))
  const hover = useGameStore((s) => s.hover)
  const select = useGameStore((s) => s.select)

  const hit = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      return isOpaque(place.sprite, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    },
    [place.sprite],
  )

  const Icon = LOCATION_ICONS[loc.icon]
  const lit = hovered || selected

  return (
    <>
      <img
        src={spriteUrl(place.sprite)}
        alt={loc.en}
        draggable={false}
        data-location={id}
        className="absolute transition-[filter,translate] duration-300 ease-(--ease-game)"
        style={{
          left,
          top,
          width: w,
          height: h,
          zIndex: Math.round(p.y),
          cursor: hovered ? 'pointer' : 'default',
          translate: lit ? '0 -6px' : '0 0',
          filter: selected
            ? 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px rgba(61,139,255,0.95)) brightness(1.06)'
            : hovered
              ? 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 12px rgba(61,139,255,0.7)) brightness(1.04)'
              : 'drop-shadow(0 10px 14px rgba(30,50,90,0.18))',
        }}
        onPointerMove={(e) => hover(hit(e) ? id : null)}
        onPointerLeave={() => hover(null)}
        onClick={(e) => {
          if (!hit(e)) return
          e.stopPropagation()
          select(selected ? null : id)
        }}
      />
      {/* name pill — counter-scaled so it stays readable at any zoom */}
      <button
        className="absolute flex items-center whitespace-nowrap pr-5 pl-1 py-1 rounded-full pill-navy font-display font-semibold text-[17px] tracking-tight transition-[scale,translate] duration-300"
        style={{
          left: left + w * 0.5,
          top: top + h * 0.08,
          zIndex: 5000,
          transform: 'translate(-50%, -100%) scale(var(--inv-scale, 1))',
          transformOrigin: '50% 100%',
          translate: lit ? '0 -8px' : '0 0',
          scale: lit ? '1.08' : '1',
        }}
        onPointerEnter={() => hover(id)}
        onPointerLeave={() => hover(null)}
        onClick={(e) => {
          e.stopPropagation()
          select(selected ? null : id)
        }}
      >
        <span className="relative grid place-items-center size-9 rounded-full bg-white text-brand-600 mr-2.5 shadow-inner">
          <Icon size={19} strokeWidth={2.4} />
          <span className={`absolute -top-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white ${STATUS_DOT[status]}`} />
        </span>
        {loc.en}
      </button>
    </>
  )
})
