import { useEffect, useRef } from 'react'
import { CAR_SPRITES, SPRITES, spriteUrl, type SpriteKey } from '../assets/registry'
import { ISLAND, ROADS } from './layout'
import { project } from './projection'

interface Lane {
  axis: 'u' | 'v'
  at: number // fixed coordinate of the lane centre
  from: number
  to: number
  speed: number // grid units / s
  cars: number
}

/**
 * Car sprites face "toward camera-left", so traffic only flows the two
 * directions the art supports: −U (as drawn) and +V (mirrored).
 */
const LANES: Lane[] = [
  // cars enter and leave at the island edge (they fade in/out there)
  { axis: 'u', at: ROADS.u[1].v + 26, from: ISLAND.u1, to: ISLAND.u0, speed: 110, cars: 4 },
  { axis: 'u', at: ROADS.u[0].v + 26, from: ISLAND.u1, to: ISLAND.u0, speed: 90, cars: 3 },
  { axis: 'v', at: ROADS.v[0].u - 24, from: ISLAND.v0, to: ISLAND.v1, speed: 80, cars: 2 },
  { axis: 'v', at: ROADS.v[1].u - 24, from: ISLAND.v0, to: ISLAND.v1, speed: 70, cars: 2 },
]

/** On-screen car length in world units; each sprite is scaled to it, so mixed art sizes match. */
const CAR_LENGTH = 92
const scaleOf = (k: SpriteKey) => CAR_LENGTH / SPRITES[k].w
/** Cars at the 24° house camera (round-3 WebP art). Until enough exist, older art fills in. */
const HOUSE_CARS = CAR_SPRITES.filter((k) => SPRITES[k].ext === 'webp')
const TRAFFIC = HOUSE_CARS.length ? HOUSE_CARS : CAR_SPRITES
const FADE = 110

interface CarState {
  el: HTMLImageElement
  lane: Lane
  t: number // distance travelled
  sprite: SpriteKey
}

export function Traffic() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = host.current!
    const cars: CarState[] = []
    let k = 0
    for (const lane of LANES) {
      const len = Math.abs(lane.to - lane.from)
      for (let i = 0; i < lane.cars; i++) {
        const sprite = TRAFFIC[k++ % TRAFFIC.length]
        const m = SPRITES[sprite]
        const el = document.createElement('img')
        el.src = spriteUrl(sprite)
        el.draggable = false
        el.className = 'absolute pointer-events-none will-change-transform'
        el.style.width = `${m.w * scaleOf(sprite)}px`
        el.style.height = `${m.h * scaleOf(sprite)}px`
        el.style.left = '0'
        el.style.top = '0'
        root.appendChild(el)
        cars.push({ el, lane, t: (len / lane.cars) * i + ((k * 37) % 60), sprite })
      }
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      for (const c of cars) {
        const { lane } = c
        const len = Math.abs(lane.to - lane.from)
        c.t = (c.t + lane.speed * dt) % len
        const pos = lane.from + Math.sign(lane.to - lane.from) * c.t
        const p = lane.axis === 'u' ? project(pos, lane.at) : project(lane.at, pos)
        const m = SPRITES[c.sprite]
        const w = m.w * scaleOf(c.sprite)
        const h = m.h * scaleOf(c.sprite)
        const flip = lane.axis === 'v'
        const fade = Math.min(1, c.t / FADE, (len - c.t) / FADE)
        c.el.style.transform = `translate(${p.x - w / 2}px, ${p.y - h * 0.78}px)${flip ? ' scaleX(-1)' : ''}`
        c.el.style.opacity = String(fade)
        c.el.style.zIndex = String(Math.round(p.y))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      cars.forEach((c) => c.el.remove())
    }
  }, [])

  return <div ref={host} className="absolute inset-0 pointer-events-none" style={{ zIndex: 'auto' }} />
}
