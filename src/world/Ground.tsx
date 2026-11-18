import { memo } from 'react'
import { world as C } from '../design/tokens'
import { BLOCKS, FOUNTAIN, ISLAND, PLAZA, RIVER, ROADS } from './layout'
import { SurroundingsGround } from './Surroundings'
import { GROUND_MATRIX, project, quad, U, WORLD } from './projection'

const tex = (name: string) => `${import.meta.env.BASE_URL}assets/textures/${name}.jpg`

/** A seamless texture laid flat on the ground. `size` = one tile in grid units. */
function GroundTexture({ id, name, size, drift }: { id: string; name: string; size: number; drift?: number }) {
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform={GROUND_MATRIX}>
      <image href={tex(name)} width={size} height={size} preserveAspectRatio="none">
        {drift ? <animateTransform attributeName="transform" type="translate" from="0 0" to={`${size} 0`} dur={`${drift}s`} repeatCount="indefinite" /> : null}
      </image>
      {/* second copy keeps the tile filled while the first one drifts */}
      {drift ? (
        <image href={tex(name)} width={size} height={size} x={-size} preserveAspectRatio="none">
          <animateTransform attributeName="transform" type="translate" from="0 0" to={`${size} 0`} dur={`${drift}s`} repeatCount="indefinite" />
        </image>
      ) : null}
    </pattern>
  )
}

/** Raised slab: a darker copy nudged down reads as the slab's front edge. */
function Slab({ q, fill, edge, lift = 5, stroke, strokeWidth, tint }: { q: string; fill: string; edge: string; lift?: number; stroke?: string; strokeWidth?: number; tint?: string }) {
  return (
    <g>
      <polygon points={q} fill={edge} transform={`translate(0 ${lift})`} />
      <polygon points={q} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {tint && <polygon points={q} fill={tint} opacity={0.22} />}
    </g>
  )
}

function Road({ along, at, w, from, to }: { along: 'u' | 'v'; at: number; w: number; from: number; to: number }) {
  const r = (a0: number, b0: number, a1: number, b1: number) => (along === 'u' ? quad(a0, b0, a1, b1) : quad(b0, a0, b1, a1))
  const dashes = []
  for (let t = from + 20; t < to - 40; t += 74) dashes.push(t)
  return (
    <g>
      {/* curb: light kerb stone with a shadow line where it meets the asphalt */}
      <polygon points={r(from, at - w / 2 - 12, to, at + w / 2 + 12)} fill={C.roadEdge} />
      <polygon points={r(from, at - w / 2, to, at + w / 2)} fill="url(#asphalt)" />
      <polygon points={r(from, at - w / 2, to, at - w / 2 + 5)} fill="#000" opacity={0.18} />
      {dashes.map((t) => (
        <polygon key={t} points={r(t, at - 2.5, t + 38, at + 2.5)} fill={C.roadLine} opacity={0.9} />
      ))}
    </g>
  )
}

function Crosswalk({ u, v, along }: { u: number; v: number; along: 'u' | 'v' }) {
  const stripes = []
  for (let i = -4; i <= 4; i++) {
    stripes.push(
      along === 'u' ? (
        <polygon key={i} points={quad(u - 14, v + i * 12 - 4, u + 14, v + i * 12 + 4)} fill="#fff" opacity={0.85} />
      ) : (
        <polygon key={i} points={quad(u + i * 12 - 4, v - 14, u + i * 12 + 4, v + 14)} fill="#fff" opacity={0.85} />
      ),
    )
  }
  return <g>{stripes}</g>
}

/**
 * Ground of the island diorama: river + far bank behind, a floating paved island with a
 * thick plinth edge, raised paved blocks with hedge verges, roads with kerbs and crossings,
 * HQ's plaza and fountain. Drawn once (memo).
 */
export const Ground = memo(function Ground() {
  const { u0, v0, u1, v1 } = ISLAND
  const FAR = { u0: u0 - 3600, u1: u1 + 3600 }
  const drop = 46 // island plinth thickness (px)
  const a = project(u0, v0)
  const b = project(u0, v1) // front corner
  const c = project(u1, v1)
  const face = (p: { x: number; y: number }, q: { x: number; y: number }) => `${p.x},${p.y} ${q.x},${q.y} ${q.x},${q.y + drop} ${p.x},${p.y + drop}`
  return (
    <svg className="absolute inset-0" width={WORLD.w} height={WORLD.h} style={{ zIndex: 0 }}>
      <defs>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9cdee" />
          <stop offset="0.35" stopColor="#d6e7f6" />
          <stop offset="1" stopColor="#eef4fa" />
        </linearGradient>
        <linearGradient id="riverShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#0b3d6e" stopOpacity="0" />
          <stop offset="1" stopColor="#0b3d6e" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="plinthL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6dbe4" />
          <stop offset="1" stopColor="#a9b2c2" />
        </linearGradient>
        <linearGradient id="plinthR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcc4d1" />
          <stop offset="1" stopColor="#8e98aa" />
        </linearGradient>
        <radialGradient id="islandShadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.6" stopColor="#2a3d5c" stopOpacity="0.28" />
          <stop offset="1" stopColor="#2a3d5c" stopOpacity="0" />
        </radialGradient>
        <GroundTexture id="asphalt" name="asphalt" size={240} />
        <GroundTexture id="grass" name="grass" size={300} />
        <GroundTexture id="paving" name="paving" size={150} />
        <GroundTexture id="water" name="water" size={460} drift={40} />
        <pattern id="ripples" width="140" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)">
          <path d="M0 20 Q35 12 70 20 T140 20" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="3" fill="none">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="140 0" dur="9s" repeatCount="indefinite" />
          </path>
        </pattern>
      </defs>
      {/* backdrop: soft haze, far bank and river behind the island */}
      <rect width={WORLD.w} height={WORLD.h} fill="url(#haze)" />
      {/* river behind the island; lawn everywhere in front of it */}
      <polygon points={quad(FAR.u0, RIVER.v0, FAR.u1, RIVER.v1)} fill="url(#water)" />
      <polygon points={quad(FAR.u0, RIVER.v0, FAR.u1, RIVER.v1)} fill="url(#riverShade)" />
      <polygon points={quad(FAR.u0, RIVER.v0, FAR.u1, RIVER.v1)} fill="url(#ripples)" />
      <polygon points={quad(FAR.u0, RIVER.v1, FAR.u1, v1 + 2400)} fill="url(#grass)" />
      <polygon points={quad(FAR.u0, RIVER.v1, FAR.u1, v1 + 2400)} fill="#eef6d8" opacity={0.32} />
      {/* riverbank: paved edge between water and lawn */}
      <polygon points={quad(FAR.u0, RIVER.v1 - 6, FAR.u1, RIVER.v1)} fill="#8a93a3" />
      <polygon points={quad(FAR.u0, RIVER.v1, FAR.u1, RIVER.v1 + 24)} fill="url(#paving)" />
      {/* far bank skyline: a flat panorama sheared onto the river's far edge (bottom follows the U axis, buildings stay upright) */}
      {[0, 1, 2].map((i) => {
        const W = 3600
        const H = W * (312 / 2000)
        const p = project(FAR.u0 + 600 + i * W, RIVER.v0 + 70)
        return (
          <image
            key={i}
            href={`${import.meta.env.BASE_URL}assets/brand/far-bank.webp`}
            x={0}
            y={-H}
            width={W}
            height={H}
            preserveAspectRatio="none"
            transform={`matrix(${U.x} ${U.y} 0 1 ${p.x} ${p.y})`}
            opacity={0.95}
          />
        )
      })}
      {/* water fades into the haze in front of the island so it reads as floating */}

      <SurroundingsGround />

      {/* island: soft shadow, plinth faces, top */}
      <ellipse cx={(a.x + c.x) / 2} cy={b.y + drop + 10} rx={(c.x - a.x) / 2} ry={70} fill="url(#islandShadow)" />
      <polygon points={face(a, b)} fill="url(#plinthL)" />
      <polygon points={face(b, c)} fill="url(#plinthR)" />
      <polyline points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`} fill="none" stroke="#ffffff" strokeWidth={4} />
      <polygon points={quad(u0, v0, u1, v1)} fill="url(#paving)" />
      <polygon points={quad(u0, v0, u1, v1)} fill="#ffffff" opacity={0.12} />

      {/* blocks: raised paved slabs with a hedge verge on the road-facing edges */}
      {BLOCKS.map(([bu0, bv0, bu1, bv1], i) => (
        <g key={i}>
          <Slab q={quad(bu0, bv0, bu1, bv1)} fill="url(#paving)" edge="#b8c0cc" lift={6} stroke="#f3f5f8" strokeWidth={6} />
          <polygon points={quad(bu0 + 6, bv1 - 22, bu1 - 6, bv1 - 6)} fill="url(#grass)" />
          <polygon points={quad(bu0 + 6, bv0 + 6, bu0 + 22, bv1 - 22)} fill="url(#grass)" />
          <polygon points={quad(bu0 + 6, bv1 - 22, bu1 - 6, bv1 - 6)} fill="#e8f5c8" opacity={0.2} />
        </g>
      ))}

      {/* roads */}
      {ROADS.u.map(({ v, w }) => (
        <Road key={`ru${v}`} along="u" at={v} w={w} from={u0} to={u1} />
      ))}
      {ROADS.v.map(({ u, w }) => (
        <Road key={`rv${u}`} along="v" at={u} w={w} from={v0} to={v1} />
      ))}
      {ROADS.v.map(({ u, w }) =>
        ROADS.u.map(({ v, w: w2 }) => (
          <g key={`x${u}-${v}`}>
            <polygon points={quad(u - w / 2, v - w2 / 2, u + w / 2, v + w2 / 2)} fill="url(#asphalt)" />
            <Crosswalk u={u - w / 2 - 22} v={v} along="u" />
            <Crosswalk u={u} v={v + w2 / 2 + 22} along="v" />
          </g>
        )),
      )}

      {/* HQ plaza + fountain */}
      <Slab q={quad(PLAZA.u0, PLAZA.v0, PLAZA.u1, PLAZA.v1)} fill="url(#paving)" edge="#c4ccd7" lift={4} stroke="#ffffff" strokeWidth={5} />
      <polygon points={quad(PLAZA.u0, PLAZA.v0, PLAZA.u1, PLAZA.v1)} fill="#fff6e0" opacity={0.18} />
      {/* round planter bed in the middle of the plaza (HQ's own art already has the fountain) */}
      <g transform={GROUND_MATRIX}>
        <circle cx={FOUNTAIN.u} cy={FOUNTAIN.v} r={FOUNTAIN.r + 8} fill="#f6f7f9" stroke="#c9d1dc" strokeWidth={3} />
        <circle cx={FOUNTAIN.u} cy={FOUNTAIN.v} r={FOUNTAIN.r} fill="url(#grass)" />
      </g>
    </svg>
  )
})
