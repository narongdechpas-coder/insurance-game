import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LOCATIONS } from '../game/data/locations'
import { useGameStore } from '../store/useGameStore'
import { CloudShadows, EventBubbles, People } from './Ambient'
import { Building } from './Building'
import { Ground } from './Ground'
import { SPRITES } from '../assets/registry'
import { preloadMasks } from './hitTest'
import { BUILDINGS, DECOR, GREENERY, LAMPS } from './layout'
import { project, WORLD } from './projection'
import { Sprite } from './Sprite'
import { Traffic } from './Traffic'

interface Cam {
  x: number
  y: number
  s: number
}

/** World area framed by the home view: the bounding box of all seven buildings. */
const HOME = (() => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const b of Object.values(BUILDINGS)) {
    const m = SPRITES[b.sprite]
    const p = project(b.u, b.v)
    const [ax, ay] = b.anchor ?? [0.5, 0.75]
    const w = m.w * b.scale, h = m.h * b.scale
    x0 = Math.min(x0, p.x - w * ax); x1 = Math.max(x1, p.x + w * (1 - ax))
    y0 = Math.min(y0, p.y - h * ay - 40); y1 = Math.max(y1, p.y + h * (1 - ay))
  }
  return { x0: x0 - 20, y0, x1: x1 + 20, y1: y1 + 10 }
})()
/** HUD keeps these bands of the 1600×900 stage covered; the home view avoids them. */
const HUD = { top: 92, bottom: 150, right: 230, left: 0 }
const MIN_S = 0.45
const MAX_S = 1.5

function homeCam(vw: number, vh: number): Cam {
  const k = Math.min(vw / 1600, vh / 900) // stage scale
  const top = HUD.top * k
  const availH = vh - top - HUD.bottom * k
  const availW = vw - (HUD.left + HUD.right) * k
  const s = Math.min(availW / (HOME.x1 - HOME.x0), availH / (HOME.y1 - HOME.y0))
  const cx = (HOME.x0 + HOME.x1) / 2
  const cy = (HOME.y0 + HOME.y1) / 2
  return { s, x: HUD.left * k + availW / 2 - cx * s, y: top + availH / 2 - cy * s }
}

function clamp(c: Cam, vw: number, vh: number): Cam {
  const s = Math.min(MAX_S, Math.max(MIN_S, c.s))
  const minX = vw - WORLD.w * s
  const minY = vh - WORLD.h * s
  return { s, x: Math.min(0, Math.max(minX, c.x)), y: Math.min(0, Math.max(minY, c.y)) }
}

/**
 * The living company: a pannable, zoomable miniature district.
 * Drag to pan, wheel to zoom, click a building to focus it.
 */
export function WorldView() {
  const view = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [cam, setCam] = useState<Cam>(() => {
    const h = homeCam(window.innerWidth, window.innerHeight)
    return { ...h, s: h.s * 0.82, x: h.x + window.innerWidth * 0.09, y: h.y + window.innerHeight * 0.12 } // intro start
  })
  const [animate, setAnimate] = useState(true)
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null)
  const selected = useGameStore((s) => s.ui.selected)
  const select = useGameStore((s) => s.select)
  const finishIntro = useGameStore((s) => s.finishIntro)

  useLayoutEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => preloadMasks(Object.values(BUILDINGS).map((b) => b.sprite)), [])

  // intro fly-in
  useEffect(() => {
    const t = setTimeout(() => {
      setAnimate(true)
      setCam(clamp(homeCam(size.w, size.h), size.w, size.h))
      setTimeout(finishIntro, 1600)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // focus selected building (leave room for the side panel on the right)
  useEffect(() => {
    setAnimate(true)
    if (!selected) {
      setCam((c) => (c.s > 0 ? clamp(homeCam(size.w, size.h), size.w, size.h) : c))
      return
    }
    const b = BUILDINGS[selected]
    const p = project(b.u, b.v)
    const s = Math.max(homeCam(size.w, size.h).s * 1.45, 0.8)
    setCam(clamp({ s, x: size.w * 0.36 - p.x * s, y: size.h * 0.56 - (p.y - 90) * s }, size.w, size.h))
  }, [selected, size.w, size.h])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }
    },
    [cam.x, cam.y],
  )
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) < 5) return
      if (!d.moved) {
        d.moved = true
        setAnimate(false)
        view.current?.setPointerCapture(e.pointerId)
      }
      setCam((c) => clamp({ ...c, x: d.cx + dx, y: d.cy + dy }, size.w, size.h))
    },
    [size.w, size.h],
  )
  const onPointerUp = useCallback(() => {
    // a click on empty ground clears the selection; a drag does not
    setTimeout(() => (drag.current = null), 0)
  }, [])
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (drag.current?.moved) e.stopPropagation()
  }, [])

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      setAnimate(false)
      setCam((c) => {
        const s = Math.min(MAX_S, Math.max(MIN_S, c.s * Math.exp(-e.deltaY * 0.0012)))
        const k = s / c.s
        return clamp({ s, x: e.clientX - (e.clientX - c.x) * k, y: e.clientY - (e.clientY - c.y) * k }, size.w, size.h)
      })
    },
    [size.w, size.h],
  )

  return (
    <div
      ref={view}
      className="absolute inset-0 overflow-hidden touch-none"
      style={{ background: '#a9cf8f', cursor: drag.current?.moved ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClickCapture={onClickCapture}
      onClick={() => selected && select(null)}
      onWheel={onWheel}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: WORLD.w,
          height: WORLD.h,
          transform: `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.s})`,
          transition: animate ? 'transform 1.4s var(--ease-game)' : 'none',
          ['--inv-scale' as string]: String(Math.min(1.6, 1 / cam.s) * 0.92),
        }}
      >
        <Ground />
        {GREENERY.map(([u, v, sprite, scale], i) => (
          <Sprite key={`g${i}`} sprite={sprite} u={u} v={v} scale={scale} anchor={[0.5, 0.9]} />
        ))}
        {LAMPS.map(([u, v], i) => (
          <Sprite key={`l${i}`} sprite="environments/street-lamp" u={u} v={v} scale={0.42} anchor={[0.5, 0.97]} />
        ))}
        {DECOR.map((d, i) => (
          <Sprite key={`d${i}`} sprite={d.sprite} u={d.u} v={d.v} scale={d.scale} anchor={d.anchor ?? [0.5, 0.8]} flip={d.flip} style={{ filter: 'drop-shadow(0 8px 10px rgba(30,50,90,0.15))' }} />
        ))}
        <People />
        <Traffic />
        {LOCATIONS.map((l) => (
          <Building key={l.id} id={l.id} />
        ))}
        <EventBubbles />
        <CloudShadows />
      </div>
      {/* soft vignette to pull focus toward the centre */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(10,30,70,0.28) 100%)' }} />
    </div>
  )
}
