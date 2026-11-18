import { SPRITES, type SpriteKey } from '../assets/registry'
import type { LocationId } from '../game/types'

/**
 * The Command Center world: a finite miniature island (diorama) with a 3×3 block grid.
 * HQ sits on the centre block with its fountain plaza; the six other business units
 * ring it. All numbers are grid units (see projection.ts).
 *
 * Buildings are placed by the FRONT CORNER of their plinth (the lowest point of the
 * sprite, measured into sprites.json). From that corner a plinth runs +U (right-up)
 * and −V (left-up). At scale 0.5 a round-2 building covers about 305 × 297 units.
 */

/** Column (along U) and row (along V) bands of the block grid. */
const COLS: [number, number][] = [
  [0, 380],
  [520, 1040],
  [1180, 1560],
]
const ROWS: [number, number][] = [
  [-120, 280],
  [420, 900],
  [1040, 1400],
]
const SIDEWALK = 70 // paved margin around the grid, inside the island edge

export const ISLAND = { u0: COLS[0][0] - SIDEWALK, v0: ROWS[0][0] - SIDEWALK, u1: COLS[2][1] + SIDEWALK, v1: ROWS[2][1] + SIDEWALK }
export const RIVER = { v0: ISLAND.v0 - 420, v1: ISLAND.v0 - 40 }

/** Roads run in the gaps between the blocks: two along U (rows), two along V (columns). */
export const ROADS = {
  u: [(ROWS[0][1] + ROWS[1][0]) / 2, (ROWS[1][1] + ROWS[2][0]) / 2].map((v) => ({ v, w: 112 })),
  v: [(COLS[0][1] + COLS[1][0]) / 2, (COLS[1][1] + COLS[2][0]) / 2].map((u) => ({ u, w: 112 })),
}

/** Every block as [u0, v0, u1, v1]; index = row * 3 + col. */
export const BLOCKS: [number, number, number, number][] = ROWS.flatMap(([v0, v1]) => COLS.map(([u0, u1]) => [u0, v0, u1, v1] as [number, number, number, number]))

/** The centre block's front strip is HQ's plaza; the fountain sits in its middle. */
export const PLAZA = { u0: COLS[1][0] + 20, v0: 790, u1: COLS[1][1] - 20, v1: ROWS[1][1] - 6 }
export const FOUNTAIN = { u: (PLAZA.u0 + PLAZA.u1) / 2 - 6, v: (PLAZA.v0 + PLAZA.v1) / 2, r: 46 }

export interface Placement {
  sprite: SpriteKey
  u: number
  v: number
  scale: number
  anchor?: [number, number]
  flip?: boolean
}

/** Anchor inside the image: explicit, or the measured plinth front corner. */
export function anchorOf(p: Placement): [number, number] {
  return p.anchor ?? [SPRITES[p.sprite].ax, SPRITES[p.sprite].ay]
}

const S = 0.5 // miniature scale shared by every building, so they read as one city
/** Front corner of a building centred in a block: left edge + inset, front edge − inset. */
const inBlock = (col: number, row: number, inset = 38): [number, number] => [COLS[col][0] + inset, ROWS[row][1] - inset]

export const BUILDINGS: Record<LocationId, Placement> = {
  dealer: { sprite: 'buildings/dealer', u: inBlock(0, 0)[0], v: inBlock(0, 0)[1], scale: S },
  repair: { sprite: 'buildings/repair', u: inBlock(2, 0)[0], v: inBlock(2, 0)[1], scale: S },
  marketing: { sprite: 'buildings/marketing', u: inBlock(0, 1)[0], v: inBlock(0, 1, 60)[1], scale: S },
  hq: { sprite: 'buildings/hq', u: COLS[1][0] + 72, v: PLAZA.v0 - 14, scale: 0.6 }, // the hero: a larger plinth, plaza in front
  claims: { sprite: 'buildings/claims', u: inBlock(2, 1)[0], v: inBlock(2, 1, 60)[1], scale: S },
  customers: { sprite: 'buildings/customers', u: inBlock(0, 2)[0], v: inBlock(0, 2)[1], scale: S },
  risk: { sprite: 'buildings/risk', u: inBlock(2, 2)[0], v: inBlock(2, 2)[1], scale: S },
}

/** Larger showcase art for the location panel, when it differs from the world sprite. */
export const PANEL_ART: Partial<Record<LocationId, SpriteKey>> = {}

const DS = 0.42 // decor buildings are smaller so the seven business units stay the heroes

/** Non-interactive set dressing: fills the blocks the business units don't use. */
export const DECOR: Placement[] = [
  // back-centre block, behind HQ
  { sprite: 'buildings/ev-center', u: COLS[1][0] + 4, v: ROWS[0][1] - 30, scale: DS },
  { sprite: 'buildings/market-intel', u: COLS[1][1] - 262, v: ROWS[0][1] - 30, scale: DS },
  // front-centre block: a small park with the capital vault
  { sprite: 'buildings/capital-vault', u: COLS[1][0] + 120, v: ROWS[2][1] - 40, scale: DS },
  { sprite: 'environments/carport', u: COLS[1][1] - 150, v: ROWS[2][0] + 180, scale: 0.24 },
  // street furniture on the outer sidewalk
  { sprite: 'environments/bus-stop', u: COLS[0][1] - 90, v: ISLAND.v1 - 20, scale: 0.5 },
  { sprite: 'environments/carport', u: COLS[2][0] + 60, v: ISLAND.v1 - 10, scale: 0.22 },
  { sprite: 'environments/tyres', u: COLS[2][0] + 18, v: ROWS[0][1] - 4, scale: 0.45 },
  { sprite: 'environments/cone', u: COLS[2][0] + 6, v: ROWS[0][1] + 26, scale: 0.4 },
]

/** Footprints (grid units) of everything big, so trees and props never grow through them. */
const FOOTPRINTS: [number, number, number, number][] = [...Object.values(BUILDINGS), ...DECOR.filter((d) => d.sprite.startsWith('buildings/'))].map((b) => {
  const k = b.scale / 0.5
  return [b.u - 10, b.v - 300 * k - 10, b.u + 310 * k + 10, b.v + 10]
})
const inFootprint = (u: number, v: number) =>
  FOOTPRINTS.some(([u0, v0, u1, v1]) => u > u0 && u < u1 && v > v0 && v < v1) ||
  (u > PLAZA.u0 && u < PLAZA.u1 && v > PLAZA.v0 && v < PLAZA.v1)

/**
 * Trees: an avenue along every block edge that faces a road, plus the island rim.
 * Skips building footprints and the plaza. Deterministic (no randomness).
 */
function avenue(): [number, number, SpriteKey, number][] {
  const out: [number, number, SpriteKey, number][] = []
  const kinds: SpriteKey[] = ['environments/tree', 'environments/tree-round', 'environments/tree', 'environments/tree-blossom']
  let n = 0
  const add = (u: number, v: number, scale = 0.46) => {
    if (inFootprint(u, v)) return
    const k = kinds[n++ % kinds.length]
    out.push([u, v, k, k === 'environments/tree-round' ? scale * 1.5 : scale])
  }
  for (const [u0, v0, u1, v1] of BLOCKS) {
    for (let u = u0 + 24; u <= u1 - 24; u += 88) add(u, v1 - 18) // front edge
    for (let v = v0 + 30; v <= v1 - 30; v += 92) add(u0 + 18, v) // left edge
  }
  return out
}

/** Trees and planters: [u, v, kind, scale] */
export const GREENERY: [number, number, SpriteKey, number][] = [
  ...avenue(),
  // plaza: blossom tree in the round bed, planters on both sides
  [FOUNTAIN.u, FOUNTAIN.v, 'environments/tree-blossom', 0.42],
  [PLAZA.u0 + 30, PLAZA.v1 - 18, 'environments/planter', 0.36],
  [PLAZA.u1 - 60, PLAZA.v1 - 18, 'environments/planter', 0.36],
  // front-centre park
  [COLS[1][0] + 60, ROWS[2][0] + 60, 'environments/tree-blossom', 0.5],
  [COLS[1][0] + 200, ROWS[2][0] + 50, 'environments/tree', 0.5],
  [COLS[1][1] - 60, ROWS[2][1] - 30, 'environments/planter', 0.4],
]

/** Street lamps at every intersection corner and along the island rim. */
export const LAMPS: [number, number][] = [
  ...ROADS.v.flatMap(({ u, w }) => ROADS.u.flatMap(({ v, w: w2 }) => [[u - w / 2 - 14, v + w2 / 2 + 14] as [number, number], [u + w / 2 + 14, v - w2 / 2 - 14] as [number, number]])),
  ...[COLS[0][0] + 160, COLS[1][0] + 260, COLS[2][0] + 200].map((u) => [u, ISLAND.v1 - 26] as [number, number]),
]

/** Standing people (sprite, u, v, scale, flip) */
export const PEOPLE: [SpriteKey, number, number, number, boolean?][] = [
  ['characters/manager', FOUNTAIN.u - 110, FOUNTAIN.v + 20, 0.24],
  ['characters/executive', FOUNTAIN.u - 82, FOUNTAIN.v + 26, 0.24, true],
  ['characters/ceo', FOUNTAIN.u + 90, FOUNTAIN.v + 30, 0.28],
  ['characters/mechanic', COLS[2][0] + 40, ROWS[0][1] + 10, 0.24, true],
  ['characters/surveyor', COLS[2][0] - 40, ROWS[1][1] + 30, 0.28],
  ['characters/call-agent', COLS[0][1] - 30, ROWS[2][1] + 30, 0.3, true],
]
