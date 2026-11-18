import { Users } from 'lucide-react'
import { spriteUrl } from '../assets/registry'
import { useGameStore } from '../store/useGameStore'
import { EVENT_ART } from './eventArt'
import { BUILDINGS, PEOPLE } from './layout'
import { FOCUS_Z, project, WORLD } from './projection'
import { SPRITES } from '../assets/registry'
import { Sprite } from './Sprite'

/** Drifting cloud shadows — cheap, adds life and depth to the flat ground. */
export function CloudShadows() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 4000 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 900,
            height: 380,
            top: 500 + i * 420,
            left: -900,
            background: 'radial-gradient(closest-side, rgba(20,40,80,0.13), rgba(20,40,80,0))',
            filter: 'blur(10px)',
            animation: `cloud-drift ${70 + i * 18}s linear ${-i * 25}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes cloud-drift { from { transform: translateX(0) } to { transform: translateX(${WORLD.w + 1800}px) } }`}</style>
    </div>
  )
}

export function People() {
  return (
    <>
      {PEOPLE.map(([sprite, u, v, scale, flip], i) => (
        <Sprite key={i} sprite={sprite} u={u} v={v} scale={scale} anchor={[0.5, 0.97]} flip={flip} />
      ))}
    </>
  )
}

/** Floating event bubbles over the places each event touches. */
export function EventBubbles() {
  const events = useGameStore((s) => s.game.events)
  const highlighted = useGameStore((s) => s.ui.highlightedEvent)
  const focusEvent = useGameStore((s) => s.focusEvent)
  const selected = useGameStore((s) => s.ui.selected)
  return (
    <>
      {events.map((ev, i) => {
        const place = BUILDINGS[ev.locations[0]]
        const m = SPRITES[place.sprite]
        const p = project(place.u, place.v)
        const top = p.y - m.h * place.scale * (place.anchor?.[1] ?? 0.75)
        const art = EVENT_ART[ev.icon]
        const ring = ev.kind === 'threat' ? 'ring-alert' : ev.kind === 'competitor' ? 'ring-watch' : 'ring-chance'
        const on = highlighted === ev.id
        const here = selected !== null && ev.locations[0] === selected
        const dim = selected !== null && !here
        return (
          <button
            key={ev.id}
            onClick={(e) => {
              e.stopPropagation()
              focusEvent(ev.id)
            }}
            className="absolute"
            style={{
              left: p.x - m.w * place.scale * (place.anchor?.[0] ?? 0.5) + m.w * place.scale * 0.5,
              top: top + m.h * place.scale * 0.08,
              zIndex: here ? FOCUS_Z + 4 : 5001,
              opacity: dim ? 0.3 : 1,
              transition: 'opacity 0.3s',
              transform: 'translate(-50%, -100%) scale(var(--inv-scale, 1)) translateY(-62px)',
              transformOrigin: '50% 100%',
            }}
          >
            <span
              className={`anim-bob grid place-items-center size-[60px] rounded-full bg-white ring-4 ${ring} shadow-[var(--shadow-float)] transition-transform ${on ? 'scale-125' : ''}`}
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              {art ? <img src={spriteUrl(art)} alt="" className="max-w-[46px] max-h-[46px] object-contain" /> : <Users className="text-watch" size={28} strokeWidth={2.4} />}
            </span>
            <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 size-4 rotate-45 bg-white -z-10" />
          </button>
        )
      })}
    </>
  )
}
