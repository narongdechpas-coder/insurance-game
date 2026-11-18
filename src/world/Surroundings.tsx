import { memo, useMemo } from 'react'
import { spriteUrl } from '../assets/registry'
import { ISLAND, RIVER, ROADS } from './layout'
import { project, quad } from './projection'
import { RoadNet } from './Roads'

/**
 * The wider city around the island: a street grid that continues the island's roads, and
 * plain white massing blocks (architect's-model style) on every block. They give the scene
 * structure without competing with the coloured, detailed business units.
 */

const RING = 150 // distance from the island edge to the centre of the ring road
const STEP = 520 // outer block pitch
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
const uCuts = [
  ...Array.from({ length: OUTER }, (_, i) => u0 - RING - (OUTER - i) * STEP),
  u0 - RING,
  ...ROADS.v.map((r) => r.u),
  u1 + RING,
  ...Array.from({ length: OUTER }, (_, i) => u1 + RING + (i + 1) * STEP),
]
const vCuts = [RIVER.v1, ...ROADS.u.map((r) => r.v), v1 + RING, ...Array.from({ length: OUTER + 1 }, (_, i) => v1 + RING + (i + 1) * STEP)]
const insideRing = (u: number, v: number) => u > u0 - RING && u < u1 + RING && v < v1 + RING

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
  return segs
}

interface Box {
  u0: number
  v0: number
  u1: number
  v1: number
  h: number
}

/** White massing blocks + street trees for every outer block. Deterministic. */
function cityBlocks() {
  const r = rng(91)
  const boxes: Box[] = []
  const trees: [number, number][] = []
  const pads: [number, number, number, number][] = []
  for (let i = 0; i < uCuts.length - 1; i++)
    for (let j = 0; j < vCuts.length - 1; j++) {
      const bu0 = uCuts[i] + ROAD_W / 2 + 14
      const bu1 = uCuts[i + 1] - ROAD_W / 2 - 14
      const bv0 = vCuts[j] + (j === 0 ? 40 : ROAD_W / 2 + 14)
      const bv1 = vCuts[j + 1] - ROAD_W / 2 - 14
      if (bu1 - bu0 < 120 || bv1 - bv0 < 120) continue
      if (insideRing((bu0 + bu1) / 2, (bv0 + bv1) / 2)) continue
      pads.push([bu0, bv0, bu1, bv1])
      // about one block in four stays a small park: lawn and trees only
      if (r() < 0.25) {
        for (let k = 0; k < 5; k++) trees.push([bu0 + 40 + r() * (bu1 - bu0 - 80), bv0 + 40 + r() * (bv1 - bv0 - 80)])
        continue
      }
      // rows right in front of the island stay low so they never cover it
      const front = bv0 > v1 && bv0 < v1 + RING + STEP
      const near = Math.abs((bu0 + bu1) / 2 - (u0 + u1) / 2) < (u1 - u0) / 2 + STEP
      const hMax = front && near ? 60 : front ? 120 : 210
      const hMin = front && near ? 30 : 60
      const inset = 58
      const W = bu1 - bu0 - 2 * inset
      const D = bv1 - bv0 - 2 * inset
      const kind = r()
      const parts: [number, number, number, number][] =
        kind < 0.2
          ? [[0, 0, 1, 1]]
          : kind < 0.7
            ? [
                [0, 0, 0.48, 1],
                [0.56, 0, 1, 1],
              ]
            : [
                [0, 0, 0.47, 0.47],
                [0.53, 0, 1, 0.47],
                [0, 0.53, 0.47, 1],
                [0.53, 0.53, 1, 1],
              ]
      for (const [a0, b0, a1, b1] of parts)
        boxes.push({
          u0: bu0 + inset + W * a0,
          v0: bv0 + inset + D * b0,
          u1: bu0 + inset + W * a1,
          v1: bv0 + inset + D * b1,
          h: hMin + r() * (hMax - hMin),
        })
      // street trees along the two road-facing edges you see (front and left)
      for (let u = bu0 + 30; u < bu1 - 20; u += 95) trees.push([u, bv1 - 14])
      for (let v = bv0 + 40; v < bv1 - 20; v += 105) trees.push([bu0 + 14, v])
    }
  return { boxes, trees, pads }
}

/** Ground layer: outer roads and block pads (sits in the Ground SVG, under everything). */
export const SurroundingsGround = memo(function SurroundingsGround() {
  const segs = useMemo(() => roadSegments(), [])
  const { pads } = useMemo(() => cityBlocks(), [])
  return (
    <g>
      {pads.map((p, i) => (
        <g key={i}>
          <polygon points={quad(...p)} fill="url(#grass)" stroke="#eef1f4" strokeWidth={9} strokeLinejoin="round" />
          <polygon points={quad(...p)} fill="#eef5e4" opacity={0.35} />
        </g>
      ))}
      <RoadNet segs={segs.map(([along, at, from, to]) => ({ along, at, w: ROAD_W, from, to }))} />
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
  const { boxes, trees } = useMemo(() => cityBlocks(), [])
  return (
    <>
      {boxes.map((b, i) => (
        <MassBox key={i} b={b} />
      ))}
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
