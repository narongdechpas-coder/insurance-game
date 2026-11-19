import { memo, useMemo } from 'react'
import { spriteUrl, SPRITES, type SpriteKey } from '../assets/registry'
import { useGameStore } from '../store/useGameStore'
import { Sprite } from './Sprite'
import { BACK_STRIP, ISLAND, RIVER, ROADS, type Placement } from './layout'
import { project, quad } from './projection'
import type { RoadSeg } from './Roads'

/**
 * The wider city around the island: a street grid that continues the island's roads, with
 * blocks of uneven size. Each block is filled in one of two styles the player can pick:
 * white walk-up buildings (the same art as the offices behind the island), or plain
 * translucent massing (architect's model). Both stay quieter than the business units.
 */

const RING = 150 // distance from the island edge to the centre of the ring road
const ROAD_W = 96
const OUTER = 3 // rows of outer blocks on each side

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const { u0, u1, v1 } = ISLAND
/** Street spacing varies like a real city: some blocks wide, some narrow, some deep. */
const steps = (seed: number, n: number) => {
  const r = rng(seed)
  return Array.from({ length: n }, () => 320 + r() * 500)
}
const cum = (xs: number[]) => xs.map((_, i) => xs.slice(0, i + 1).reduce((a, b) => a + b, 0))
const left = cum(steps(11, OUTER)).map((d) => u0 - RING - d).reverse()
const right = cum(steps(23, OUTER)).map((d) => u1 + RING + d)
const front = cum(steps(37, OUTER + 1)).map((d) => v1 + RING + d)
const uCuts = [...left, u0 - RING, ...ROADS.v.map((r) => r.u), u1 + RING, ...right]
const vCuts = [RIVER.v1, ...ROADS.u.map((r) => r.v), v1 + RING, ...front]
const insideRing = (u: number, v: number) => u > u0 - RING && u < u1 + RING && v < v1 + RING

/**
 * Land area varies too: some pairs of neighbouring blocks merge into one large lot, and the
 * minor street between them is dropped (leaving T-junctions). The ring road and the streets
 * that continue from the island are never dropped. Result: block areas range from small
 * corner plots to superblocks several times larger. Deterministic.
 */
const MAIN_U = new Set([u0 - RING, u1 + RING, ...ROADS.v.map((r) => r.u)])
const MAIN_V = new Set([v1 + RING, ...ROADS.u.map((r) => r.v)])
const mergeRight = new Set<string>() // cell i,j absorbs i+1,j
const mergeDown = new Set<string>() // cell i,j absorbs i,j+1
{
  const r = rng(53)
  const used = new Set<string>()
  const outside = (i: number, j: number) => !insideRing((uCuts[i] + uCuts[i + 1]) / 2, (vCuts[j] + vCuts[j + 1]) / 2)
  for (let i = 0; i < uCuts.length - 1; i++)
    for (let j = 0; j < vCuts.length - 1; j++) {
      if (used.has(`${i},${j}`) || !outside(i, j)) continue
      const roll = r()
      if (roll < 0.16 && i + 1 < uCuts.length - 1 && !MAIN_U.has(uCuts[i + 1]) && outside(i + 1, j) && !used.has(`${i + 1},${j}`)) {
        mergeRight.add(`${i},${j}`)
        used.add(`${i},${j}`).add(`${i + 1},${j}`)
      } else if (roll > 0.84 && j + 1 < vCuts.length - 1 && !MAIN_V.has(vCuts[j + 1]) && outside(i, j + 1) && !used.has(`${i},${j + 1}`)) {
        mergeDown.add(`${i},${j}`)
        used.add(`${i},${j}`).add(`${i},${j + 1}`)
      }
    }
}
const absorbed = (i: number, j: number) => mergeRight.has(`${i - 1},${j}`) || mergeDown.has(`${i},${j - 1}`)

/** Cut [a, b] out of a road line's pieces. */
function cutOut(segs: ['u' | 'v', number, number, number][], along: 'u' | 'v', at: number, a: number, b: number) {
  return segs.flatMap((s) => {
    if (s[0] !== along || s[1] !== at || b <= s[2] || a >= s[3]) return [s]
    const out: typeof segs = []
    if (a > s[2]) out.push([along, at, s[2], a])
    if (b < s[3]) out.push([along, at, b, s[3]])
    return out
  })
}

/** Road segments as [along, at, from, to]. */
function roadSegments(): ['u' | 'v', number, number, number][] {
  const segs: ['u' | 'v', number, number, number][] = []
  const uMin = uCuts[0] - 260
  const uMax = uCuts[uCuts.length - 1] + 260
  const vMax = vCuts[vCuts.length - 1] + 260
  // roads along U (constant v): the island's own streets continue outward from its edge,
  // so they join the ring road instead of stopping short of it
  for (const v of vCuts.slice(1)) {
    if (v < v1 + RING) {
      segs.push(['u', v, uMin, u0])
      segs.push(['u', v, u1, uMax])
    } else segs.push(['u', v, uMin, uMax])
  }
  // roads along V (constant u)
  for (const u of uCuts) {
    if (u > u0 - RING && u < u1 + RING) segs.push(['v', u, v1, vMax])
    else segs.push(['v', u, RIVER.v1 + 10, vMax])
  }
  // drop the street between merged blocks (from one crossing street's centre to the next)
  let out = segs
  for (const k of mergeRight) {
    const [i, j] = k.split(',').map(Number)
    out = cutOut(out, 'v', uCuts[i + 1], vCuts[j] + (j === 0 ? 0 : ROAD_W / 2), vCuts[j + 1] - ROAD_W / 2)
  }
  for (const k of mergeDown) {
    const [i, j] = k.split(',').map(Number)
    out = cutOut(out, 'u', vCuts[j + 1], uCuts[i] + ROAD_W / 2, uCuts[i + 1] - ROAD_W / 2)
  }
  return out
}

interface Box {
  u0: number
  v0: number
  u1: number
  v1: number
  h: number
}

/** A walk-up building: sprite placed by its front corner, like the island's buildings. */
interface Walkup {
  sprite: SpriteKey
  u: number
  v: number
  scale: number
}

const COS = Math.cos((24 * Math.PI) / 180)
/** Ground footprint (grid units) of a sprite at scale 1: along +U and along −V from its front corner. */
const footprint = (k: SpriteKey) => {
  const m = SPRITES[k]
  return { du: ((1 - m.ax) * m.w) / COS, dv: (m.ax * m.w) / COS }
}

/** Split [0,1] into n uneven parts with a small gap between them. */
function cuts(r: () => number, n: number, gap: number): [number, number][] {
  const w = Array.from({ length: n }, () => 0.6 + r() * 0.8)
  const total = w.reduce((a, b) => a + b, 0)
  let t = 0
  return w.map((x) => {
    const a = t
    t += x / total
    return [a + (a > 0 ? gap / 2 : 0), t - (t < 0.999 ? gap / 2 : 0)] as [number, number]
  })
}

/** Lots, massing boxes, walk-ups and street trees for every outer block. Deterministic. */
export function cityBlocks() {
  const r = rng(91)
  const boxes: Box[] = []
  const walkups: Walkup[] = []
  const trees: [number, number][] = []
  const pads: [number, number, number, number][] = []
  const parks = new Set<string>()
  for (let i = 0; i < uCuts.length - 1; i++)
    for (let j = 0; j < vCuts.length - 1; j++) {
      if (absorbed(i, j)) continue
      const bu0 = uCuts[i] + ROAD_W / 2 + 14
      const bu1 = uCuts[i + (mergeRight.has(`${i},${j}`) ? 2 : 1)] - ROAD_W / 2 - 14
      const bv0 = vCuts[j] + (j === 0 ? 40 : ROAD_W / 2 + 14)
      const bv1 = vCuts[j + (mergeDown.has(`${i},${j}`) ? 2 : 1)] - ROAD_W / 2 - 14
      if (bu1 - bu0 < 120 || bv1 - bv0 < 120) continue
      if (insideRing((bu0 + bu1) / 2, (bv0 + bv1) / 2)) continue
      pads.push([bu0, bv0, bu1, bv1])
      // street trees along the two road-facing edges you see (front and left)
      const streetTrees = () => {
        for (let u = bu0 + 30; u < bu1 - 20; u += 95) trees.push([u, bv1 - 14])
        for (let v = bv0 + 40; v < bv1 - 20; v += 105) trees.push([bu0 + 14, v])
      }
      // rows right in front of the island stay low so they never cover it
      const frontRow = bv0 > v1 && bv0 < v1 + RING + 760 // the two rows in front of the island stay lower
      const firstRow = bv0 > v1 && bv0 < v1 + RING + 120 // the row right in front of it
      const near = Math.abs((bu0 + bu1) / 2 - (u0 + u1) / 2) < (u1 - u0) / 2 + 600
      // about one block in six stays a small park: lawn and trees only, never next to another park
      const besidePark = parks.has(`${i - 1},${j}`) || parks.has(`${i},${j - 1}`) || parks.has(`${i - 1},${j - 1}`) || parks.has(`${i + 1},${j - 1}`)
      if (r() < 0.17 && !besidePark) {
        parks.add(`${i},${j}`)
        for (let k = 0; k < 5; k++) trees.push([bu0 + 40 + r() * (bu1 - bu0 - 80), bv0 + 40 + r() * (bv1 - bv0 - 80)])
        continue
      }
      const inset = 34 + r() * 40
      const W = bu1 - bu0 - 2 * inset
      const D = bv1 - bv0 - 2 * inset
      // uneven lots: 1–3 across, 1–2 deep, each its own size
      const across = cuts(r, W > 420 ? 2 + (r() < 0.4 ? 1 : 0) : W > 240 ? 1 + (r() < 0.6 ? 1 : 0) : 1, 26 / W)
      const deep = cuts(r, D > 300 && r() < 0.6 ? 2 : 1, 26 / D)
      for (const [a0, a1] of across)
        for (const [b0, b1] of deep) {
          // some lots are left as forecourt or parking, so blocks do not read as solid walls
          if (across.length * deep.length > 2 && r() < 0.18) continue
          const lot = { u0: bu0 + inset + W * a0, u1: bu0 + inset + W * a1, v0: bv0 + inset + D * b0, v1: bv0 + inset + D * b1 }
          // massing style: a box that does not quite fill its lot, at a random height
          const shrinkU = (lot.u1 - lot.u0) * r() * 0.18
          const shrinkV = (lot.v1 - lot.v0) * r() * 0.18
          const hMax = frontRow && near ? 60 : frontRow ? 120 : 220
          const hMin = frontRow && near ? 30 : 60
          boxes.push({ u0: lot.u0, v0: lot.v0 + shrinkV, u1: lot.u1 - shrinkU, v1: lot.v1, h: hMin + r() * (hMax - hMin) })
        }
      // walk-up style: rows of buildings shoulder to shoulder along the street, front row and back rows,
      // each building its own type and size, so the block reads as a real built-up street
      if (!(firstRow && near)) {
        const maxS = firstRow ? 0.26 : frontRow ? 0.32 : 0.44
        let vFront = bv1 - 18
        while (vFront - bv0 > 90) {
          const rowS = Math.min(maxS, 0.26 + r() * 0.16)
          const rowDepth = Math.min(vFront - bv0 - 12, footprint('buildings/office-low').dv * rowS)
          let u = bu0 + 14 + r() * 16
          let placed = false
          while (true) {
            const roll = r()
            const pick: SpriteKey = roll < 0.45 ? 'buildings/office-low' : roll < 0.8 ? 'buildings/office-row' : 'buildings/office-tower'
            const f = footprint(pick)
            const sc = Math.min(rowS * (0.85 + r() * 0.25), rowDepth / f.dv, maxS)
            if (sc < 0.12 || u + f.du * sc > bu1 - 10) break
            walkups.push({ sprite: pick, u, v: vFront - (rowDepth - f.dv * sc) * r(), scale: sc })
            placed = true
            u += f.du * sc + 6 + r() * 26
          }
          if (!placed) break
          vFront -= rowDepth + 24 + r() * 30
        }
      }
      streetTrees()
    }
  return { boxes, walkups, trees, pads }
}

/** Outer streets, drawn by Ground in one network with the island's own streets. */
/** The plain offices in the row behind the island (not rival HQ art, which stays art in both styles). */
export const isPlainOffice = (p: Placement) => BACK_STRIP.includes(p) && p.sprite.startsWith('buildings/office-')

/** Massing boxes standing on the same footprints as those offices, about as tall as the art. */
function backStripBoxes(): Box[] {
  return BACK_STRIP.filter(isPlainOffice).map((p) => {
    const m = SPRITES[p.sprite]
    const du = ((1 - m.ax) * m.w * p.scale) / COS
    const dv = (m.ax * m.w * p.scale) / COS
    // the art's height minus its footprint's on-screen depth ≈ the building's wall height
    const groundH = (m.w * p.scale) * Math.tan((24 * Math.PI) / 180)
    return { u0: p.u, v0: p.v - dv, u1: p.u + du, v1: p.v, h: Math.max(60, m.h * p.scale - groundH) }
  })
}

export function outerRoads(): RoadSeg[] {
  return roadSegments().map(([along, at, from, to]) => ({ along, at, w: ROAD_W, from, to }))
}

/** Ground layer: outer block pads (sits in the Ground SVG, under everything). */
export const SurroundingsGround = memo(function SurroundingsGround() {
  const { pads } = useMemo(() => cityBlocks(), [])
  return (
    <g>
      {pads.map((p, i) => (
        <g key={i}>
          <polygon points={quad(...p)} fill="url(#grass)" stroke="#eef1f4" strokeWidth={9} strokeLinejoin="round" />
          <polygon points={quad(...p)} fill="#eef5e4" opacity={0.35} />
        </g>
      ))}
    </g>
  )
})

/** One white block, depth-sorted with the sprites by its front corner. */
function MassBox({ b }: { b: Box }) {
  const P = (u: number, v: number, z = 0) => {
    const p = project(u, v)
    return { x: p.x, y: p.y - z }
  }
  const pts = [P(b.u0, b.v0), P(b.u1, b.v0), P(b.u1, b.v1), P(b.u0, b.v1)]
  const top = pts.map((p) => ({ x: p.x, y: p.y - b.h }))
  const xs = [...pts, ...top].map((p) => p.x)
  const ys = [...pts, ...top].map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const s = (p: { x: number; y: number }) => `${(p.x - minX).toFixed(1)},${(p.y - minY).toFixed(1)}`
  const front = pts[3] // (u0, v1): lowest point on screen
  // visible side faces: along v = v1 (to the right of the front corner) and along u = u0 (to the left)
  const right = [pts[3], pts[2], top[2], top[3]]
  const left = [pts[0], pts[3], top[3], top[0]]
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ left: minX, top: minY, zIndex: Math.round(front.y), overflow: 'visible', opacity: 0.8 }}
      width={Math.max(...xs) - minX}
      height={Math.max(...ys) - minY}
    >
      <polygon points={left.map(s).join(' ')} fill="#d3d9e2" />
      <polygon points={right.map(s).join(' ')} fill="#e5e9ef" />
      <polygon points={top.map(s).join(' ')} fill="#f3f5f8" stroke="#dfe4eb" strokeWidth={1.5} />
      {/* crisp edges read as a glass/acrylic model at 80% opacity */}
      <polyline points={[top[0], top[3], top[2]].map(s).join(' ')} fill="none" stroke="#ffffff" strokeWidth={2} />
      <line x1={s(top[3]).split(',')[0]} y1={s(top[3]).split(',')[1]} x2={s(pts[3]).split(',')[0]} y2={s(pts[3]).split(',')[1]} stroke="#ffffff" strokeWidth={1.5} opacity={0.9} />
    </svg>
  )
}

/** Massing blocks and street trees (live in the depth-sorted sprite layer). */
export const Surroundings = memo(function Surroundings() {
  const { boxes, walkups, trees } = useMemo(() => cityBlocks(), [])
  const style = useGameStore((s) => s.settings.cityStyle)
  return (
    <>
      {style === 'massing'
        ? [...boxes, ...backStripBoxes()].map((b, i) => <MassBox key={i} b={b} />)
        : // no per-building drop-shadow: hundreds of CSS filters make panning stutter on tablets
          walkups.map((w, i) => {
            const m = SPRITES[w.sprite]
            return <Sprite key={`w${i}`} sprite={w.sprite} u={w.u} v={w.v} scale={w.scale} anchor={[m.ax, m.ay]} />
          })}
      {trees.map(([u, v], i) => {
        const p = project(u, v)
        return (
          <img
            key={`t${i}`}
            src={spriteUrl('environments/tree-round')}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{ left: p.x - 32, top: p.y - 62, width: 64, height: 66, zIndex: Math.round(p.y) }}
          />
        )
      })}
    </>
  )
})
