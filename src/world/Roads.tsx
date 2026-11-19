import { world as C } from '../design/tokens'
import { quad } from './projection'

/**
 * One road style for the whole city (island and outer streets): kerb, textured asphalt,
 * a soft kerb shadow and a dashed centre line.
 *
 * The network is drawn in layers (every kerb, then every asphalt strip, then the markings)
 * so crossing roads merge into one smooth junction instead of one road's kerb and shadow
 * being painted across the other. Markings stop short of every junction.
 */
export interface RoadSeg {
  along: 'u' | 'v' // direction the road runs
  at: number // its centre line (v for roads along u, u for roads along v)
  w: number // asphalt width
  from: number
  to: number
}

const KERB = 12
const DASH = 38
const GAP = 36
const CLEAR = 46 // markings stay this far from a junction's asphalt (room for crossings)

const strip = (s: RoadSeg, a0: number, b0: number, a1: number, b1: number) => (s.along === 'u' ? quad(a0, b0, a1, b1) : quad(b0, a0, b1, a1))

/**
 * Join pieces that lie on the same line and touch or overlap into one road (the wider
 * width wins), so a street running from the island into the outer city is a single strip:
 * no seam where two pieces meet, and one even rhythm of centre dashes.
 */
export function mergeSegs(segs: RoadSeg[]): RoadSeg[] {
  const out: RoadSeg[] = []
  const sorted = [...segs].sort((a, b) => (a.along === b.along ? a.at - b.at || a.from - b.from : a.along < b.along ? -1 : 1))
  for (const s of sorted) {
    const last = out[out.length - 1]
    if (last && last.along === s.along && Math.abs(last.at - s.at) < 1 && s.from <= last.to + 1) {
      last.to = Math.max(last.to, s.to)
      last.w = Math.max(last.w, s.w)
    } else out.push({ ...s })
  }
  return out
}

/** Where other roads cross this one, as [start, end] along it. */
function junctions(s: RoadSeg, all: RoadSeg[]): [number, number][] {
  return all
    .filter((o) => o.along !== s.along && o.from <= s.at && s.at <= o.to && s.from <= o.at && o.at <= s.to)
    .map((o) => [o.at - o.w / 2, o.at + o.w / 2] as [number, number])
    .sort((a, b) => a[0] - b[0])
}

/** The parts of [from, to] outside every junction (each widened by `pad`). */
function between(s: RoadSeg, js: [number, number][], pad: number): [number, number][] {
  const out: [number, number][] = []
  let t = s.from
  for (const [j0, j1] of js) {
    if (j0 - pad > t) out.push([t, j0 - pad])
    t = Math.max(t, j1 + pad)
  }
  if (t < s.to) out.push([t, s.to])
  return out
}

export function RoadNet({ segs }: { segs: RoadSeg[] }) {
  const js = segs.map((s) => junctions(s, segs))
  return (
    <g>
      {segs.map((s, i) => (
        <polygon key={`k${i}`} points={strip(s, s.from, s.at - s.w / 2 - KERB, s.to, s.at + s.w / 2 + KERB)} fill={C.roadEdge} />
      ))}
      {segs.map((s, i) => (
        <polygon key={`a${i}`} points={strip(s, s.from, s.at - s.w / 2, s.to, s.at + s.w / 2)} fill="url(#asphalt)" />
      ))}
      {/* kerb shadow on the far side only between junctions, so it never crosses a junction */}
      {segs.flatMap((s, i) =>
        between(s, js[i], 0).map(([a, b]) => <polygon key={`s${i}-${a}`} points={strip(s, a, s.at - s.w / 2, b, s.at - s.w / 2 + 5)} fill="#000" opacity={0.18} />),
      )}
      {segs.flatMap((s, i) =>
        between(s, js[i], CLEAR).flatMap(([a, b]) => {
          const dashes = []
          // centre the dash run in each stretch so both ends look the same
          const n = Math.floor((b - a + GAP) / (DASH + GAP))
          const start = a + (b - a - (n * (DASH + GAP) - GAP)) / 2
          for (let k = 0; k < n; k++) {
            const t = start + k * (DASH + GAP)
            dashes.push(<polygon key={`d${i}-${t}`} points={strip(s, t, s.at - 2.5, t + DASH, s.at + 2.5)} fill={C.roadLine} opacity={0.9} />)
          }
          return dashes
        }),
      )}
    </g>
  )
}
