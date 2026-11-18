import { memo } from 'react'
import { world as C } from '../design/tokens'
import { DISTRICT, RIVER, ROADS } from './layout'
import { project, quad, WORLD } from './projection'

const FAR = { u0: -2600, u1: 4600 }

function Road({ along, at, w, from, to }: { along: 'u' | 'v'; at: number; w: number; from: number; to: number }) {
  const r = (a0: number, b0: number, a1: number, b1: number) => (along === 'u' ? quad(a0, b0, a1, b1) : quad(b0, a0, b1, a1))
  const dashes = []
  for (let t = from + 20; t < to - 40; t += 74) dashes.push(t)
  return (
    <g>
      <polygon points={r(from, at - w / 2 - 10, to, at + w / 2 + 10)} fill={C.roadEdge} />
      <polygon points={r(from, at - w / 2, to, at + w / 2)} fill="url(#road)" />
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

/** Flat ground: river, far bank, paved district, lawns, roads. Drawn once (memo). */
export const Ground = memo(function Ground() {
  const { u0, v0, u1, v1 } = DISTRICT
  const { back, front, cross } = ROADS
  const edgeDrop = 22
  const lots: [number, number, number, number][] = [
    [u0 + 20, v0 + 30, cross.u - cross.w / 2 - 16, back.v - back.w / 2 - 16],
    [cross.u + cross.w / 2 + 16, v0 + 30, u1 - 20, back.v - back.w / 2 - 16],
    [u0 + 20, back.v + back.w / 2 + 16, cross.u - cross.w / 2 - 16, front.v - front.w / 2 - 16],
    [cross.u + cross.w / 2 + 16, back.v + back.w / 2 + 16, u1 - 20, front.v - front.w / 2 - 16],
    [u0 + 20, front.v + front.w / 2 + 16, u1 - 20, v1 - 24],
  ]
  const bl = project(u0, v1)
  const br = project(u1, v1)
  return (
    <svg className="absolute inset-0" width={WORLD.w} height={WORLD.h} style={{ zIndex: 0 }}>
      <defs>
        <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b7d79c" />
          <stop offset="1" stopColor="#9cc982" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={C.river[0]} />
          <stop offset="1" stopColor={C.river[1]} />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#687183" />
          <stop offset="1" stopColor={C.road} />
        </linearGradient>
        <linearGradient id="paving" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f8fa" />
          <stop offset="1" stopColor="#e6e9ee" />
        </linearGradient>
        <linearGradient id="lawn" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a9d97a" />
          <stop offset="1" stopColor="#8cc463" />
        </linearGradient>
        <pattern id="ripples" width="140" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)">
          <path d="M0 20 Q35 12 70 20 T140 20" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="3" fill="none">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="140 0" dur="9s" repeatCount="indefinite" />
          </path>
        </pattern>
      </defs>
      <rect width={WORLD.w} height={WORLD.h} fill="url(#land)" />
      {/* river + far bank */}
      <polygon points={quad(FAR.u0, RIVER.v0 - 900, FAR.u1, RIVER.v0)} fill="#b3d2a0" />
      <polygon points={quad(FAR.u0, RIVER.v0, FAR.u1, RIVER.v1)} fill="url(#river)" />
      <polygon points={quad(FAR.u0, RIVER.v0, FAR.u1, RIVER.v1)} fill="url(#ripples)" />
      <polygon points={quad(FAR.u0, RIVER.v1, FAR.u1, RIVER.v1 + 26)} fill="#f3f4f6" />
      <polygon points={quad(FAR.u0, RIVER.v1 + 26, FAR.u1, RIVER.v1 + 34)} fill="#cfd5de" />
      {/* district plinth: front edge thickness gives the diorama feel */}
      <polygon
        points={`${bl.x},${bl.y} ${br.x},${br.y} ${br.x},${br.y + edgeDrop} ${bl.x},${bl.y + edgeDrop}`}
        fill={C.boardEdgeDark}
      />
      <polygon points={quad(u0, v0, u1, v1)} fill="url(#paving)" stroke="#ffffff" strokeWidth={6} strokeLinejoin="round" />
      {lots.map((l, i) => (
        <polygon key={i} points={quad(...l)} fill="url(#lawn)" stroke="#f1f3f5" strokeWidth={10} strokeLinejoin="round" />
      ))}
      <Road along="u" at={back.v} w={back.w} from={u0} to={u1} />
      <Road along="u" at={front.v} w={front.w} from={FAR.u0} to={FAR.u1} />
      <Road along="v" at={cross.u} w={cross.w} from={v0} to={v1} />
      {/* intersections: clear the dashes */}
      <polygon points={quad(cross.u - cross.w / 2, back.v - back.w / 2, cross.u + cross.w / 2, back.v + back.w / 2)} fill={C.road} />
      <polygon points={quad(cross.u - cross.w / 2, front.v - front.w / 2, cross.u + cross.w / 2, front.v + front.w / 2)} fill={C.road} />
      <Crosswalk u={cross.u - cross.w / 2 - 24} v={front.v} along="u" />
      <Crosswalk u={cross.u + cross.w / 2 + 24} v={back.v} along="u" />
      <Crosswalk u={cross.u} v={back.v + back.w / 2 + 26} along="v" />
    </svg>
  )
})
