import { useEffect, useRef } from 'react'
import { CAR_SPRITES, SPRITES, spriteUrl, type SpriteKey } from '../assets/registry'
import { DISTRICT, ROADS } from './layout'
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
  { axis: 'u', at: ROADS.front.v + 26, from: 2500, to: -900, speed: 120, cars: 6 },
  { axis: 'u', at: ROADS.back.v + 22, from: 2300, to: -700, speed: 95, cars: 4 },
  { axis: 'v', at: ROADS.cross.u - 20, from: DISTRICT.v0 - 40, to: DISTRICT.v1 + 200, speed: 80, cars: 2 },
]

const SCALE = 0.3
const FADE = 160

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
        const sprite = CAR_SPRITES[k++ % CAR_SPRITES.length]
        const m = SPRITES[sprite]
        const el = document.createElement('img')
        el.src = spriteUrl(sprite)
        el.draggable = false
        el.className = 'absolute pointer-events-none will-change-transform'
        el.style.width = `${m.w * SCALE}px`
        el.style.height = `${m.h * SCALE}px`
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
        const w = m.w * SCALE
        const h = m.h * SCALE
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
