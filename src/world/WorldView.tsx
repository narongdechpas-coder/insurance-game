import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LOCATIONS } from '../game/data/locations'
import { useGameStore } from '../store/useGameStore'
import { Clouds, CloudShadows, EventBubbles, People } from './Ambient'
import { Building } from './Building'
import { Ground } from './Ground'
import { isPlainOffice, Surroundings } from './Surroundings'
import { SPRITES } from '../assets/registry'
import { preloadMasks } from './hitTest'
import { anchorOf, BUILDINGS, DECOR, GREENERY, ISLAND, LAMPS } from './layout'
import { FOCUS_Z, project, WORLD } from './projection'
import { Sprite } from './Sprite'
import { Traffic } from './Traffic'
import { WorldFx } from '../ui/run/WorldFx'

interface Cam {
  x: number
  y: number
  s: number
}

/** World area framed by the home view: the whole island (left/right/front corners) and the tops of every building on it. */
const HOME = (() => {
  const corners = [project(ISLAND.u0, ISLAND.v0), project(ISLAND.u0, ISLAND.v1), project(ISLAND.u1, ISLAND.v1), project(ISLAND.u1, ISLAND.v0)]
  let x0 = Math.min(...corners.map((c) => c.x)), x1 = Math.max(...corners.map((c) => c.x))
  let y0 = Infinity
  const y1 = Math.max(...corners.map((c) => c.y)) + 50 // front corner + plinth
  for (const b of [...Object.values(BUILDINGS), ...DECOR.filter((d) => d.sprite.startsWith('buildings/'))]) {
    const m = SPRITES[b.sprite]
    const p = project(b.u, b.v)
    const [ax, ay] = anchorOf(b)
    const w = m.w * b.scale, h = m.h * b.scale
    x0 = Math.min(x0, p.x - w * ax); x1 = Math.max(x1, p.x + w * (1 - ax))
    y0 = Math.min(y0, p.y - h * ay - (b.sprite.startsWith('buildings/office') ? 10 : 70))
  }
  return { x0: x0 - 10, y0, x1: x1 + 10, y1 }
})()
/** HUD keeps these bands of the 1600×900 stage covered; the home view avoids them. */
const HUD = { top: 176, bottom: 168, right: 250, left: 24 }
const MIN_S = 0.3
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

/** Pannable area: the island plus a margin (more above it, for the river and far bank). */
const BOUNDS = (() => {
  const pts = [project(ISLAND.u0, ISLAND.v0), project(ISLAND.u0, ISLAND.v1), project(ISLAND.u1, ISLAND.v1), project(ISLAND.u1, ISLAND.v0)]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { x0: Math.min(...xs) - 260, x1: Math.max(...xs) + 260, y0: Math.min(...ys) - 520, y1: Math.max(...ys) + 220 }
})()

function clamp(c: Cam, vw: number, vh: number): Cam {
  const s = Math.min(MAX_S, Math.max(MIN_S, c.s))
  const fit = (pos: number, lo: number, hi: number, view: number) => {
    const span = (hi - lo) * s
    // smaller than the window: it can still be nudged, but never more than a fifth of the window off-centre
    if (span <= view) {
      const centre = view / 2 - ((lo + hi) / 2) * s
      return Math.min(centre + view * 0.2, Math.max(centre - view * 0.2, pos))
    }
    return Math.min(-lo * s, Math.max(view - hi * s, pos))
  }
  return { s, x: fit(c.x, BOUNDS.x0, BOUNDS.x1, vw), y: fit(c.y, BOUNDS.y0, BOUNDS.y1, vh) }
}

/**
 * The living company: a pannable, zoomable miniature district.
 * Drag to pan, wheel or two-finger pinch to zoom, click (tap) a building to focus it.
 */
export function WorldView() {
  // in the architect's-model style the plain offices behind the island become massing too
  const massing = useGameStore((s) => s.settings.cityStyle === 'massing')
  const view = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [cam, setCam] = useState<Cam>(() => {
    const h = homeCam(window.innerWidth, window.innerHeight)
    return { ...h, s: h.s * 0.82, x: h.x + window.innerWidth * 0.09, y: h.y + window.innerHeight * 0.12 } // intro start
  })
  const [animate, setAnimate] = useState(true)
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null)
  // touch: every finger on the city, and the pinch that two of them make
  const fingers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d: number; mx: number; my: number; cam: Cam } | null>(null)
  const selected = useGameStore((s) => s.ui.selected)
  const screen = useGameStore((s) => s.ui.screen)
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
      fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (fingers.current.size === 2) {
        const [a, b] = [...fingers.current.values()]
        pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cam }
        if (drag.current) drag.current.moved = true // a pinch is never a tap
        setAnimate(false)
        return
      }
      drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }
    },
    [cam],
  )
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (fingers.current.has(e.pointerId)) fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const pz = pinch.current
      if (pz && fingers.current.size >= 2) {
        const [a, b] = [...fingers.current.values()]
        const s = Math.min(MAX_S, Math.max(MIN_S, pz.cam.s * (Math.hypot(a.x - b.x, a.y - b.y) / pz.d)))
        const k = s / pz.cam.s
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        // the point under the fingers' midpoint stays under it, and follows it when both fingers move
        setCam(clamp({ s, x: mx - (pz.mx - pz.cam.x) * k, y: my - (pz.my - pz.cam.y) * k }, size.w, size.h))
        return
      }
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
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    fingers.current.delete(e.pointerId)
    if (fingers.current.size < 2) pinch.current = null
    if (fingers.current.size > 0) {
      // one finger left after a pinch: carry on panning from where it is now, without a jump
      const [f] = [...fingers.current.values()]
      setCam((c) => {
        drag.current = { x: f.x, y: f.y, cx: c.x, cy: c.y, moved: true }
        return c
      })
      return
    }
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
      style={{ background: '#8cc463', cursor: drag.current?.moved ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
        <Surroundings />
        {GREENERY.map(([u, v, sprite, scale], i) => (
          <Sprite key={`g${i}`} sprite={sprite} u={u} v={v} scale={scale} anchor={SPRITES[sprite].ext === 'webp' ? [SPRITES[sprite].ax, SPRITES[sprite].ay] : [0.5, 0.9]} />
        ))}
        {LAMPS.map(([u, v], i) => (
          <Sprite key={`l${i}`} sprite="environments/street-lamp" u={u} v={v} scale={0.42} anchor={[0.5, 0.97]} />
        ))}
        {DECOR.map((d, i) =>
          massing && isPlainOffice(d) ? null : (
          <Sprite key={`d${i}`} sprite={d.sprite} u={d.u} v={d.v} scale={d.scale} anchor={d.anchor ?? (d.sprite.startsWith('buildings/') || SPRITES[d.sprite].ext === 'webp' ? anchorOf(d) : [0.5, 0.8])} flip={d.flip} style={{ filter: 'drop-shadow(0 8px 10px rgba(30,50,90,0.15))' }} />
          ),
        )}
        <People />
        <Traffic />
        {LOCATIONS.map((l) => (
          <Building key={l.id} id={l.id} />
        ))}
        {screen === 'running' ? <WorldFx /> : <EventBubbles />}
        <CloudShadows />
        <Clouds />
        {/* focus scrim: dims the city so the selected place, its panel and the advisor carry the eye */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ zIndex: FOCUS_Z, background: 'rgba(6,18,46,0.55)', opacity: selected ? 1 : 0, pointerEvents: selected ? 'auto' : 'none' }}
        />
      </div>
      {/* soft vignette to pull focus toward the centre */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(10,30,70,0.28) 100%)' }} />
    </div>
  )
}
