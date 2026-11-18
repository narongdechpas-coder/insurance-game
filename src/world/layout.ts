import { SPRITES, type SpriteKey } from '../assets/registry'
import type { LocationId } from '../game/types'

/**
 * Where everything sits in the Command Center world (grid units, see projection.ts).
 * Pure data — move a building by editing numbers here.
 *
 * Buildings are placed by the FRONT CORNER of their plinth (the lowest point of the
 * sprite, measured into sprites.json). From that corner a plinth runs +U (right-up)
 * and −V (left-up). At scale 0.5 a round-2 building covers about 305 × 297 units.
 */

export const DISTRICT = { u0: -620, v0: -110, u1: 2120, v1: 1070 }
export const RIVER = { v0: -470, v1: -190 }

export const ROADS = {
  back: { v: 400, w: 100 }, // between back and front rows
  front: { v: 862, w: 112 }, // boulevard
  cross: { u: 1132, w: 100 }, // street through the middle-right
}

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

const BACK = 335 // front-corner v of the back row
const FRONT = 795 // front-corner v of the front row
const S = 0.5 // miniature scale shared by every building, so they read as one city

export const BUILDINGS: Record<LocationId, Placement> = {
  dealer: { sprite: 'buildings/dealer', u: -60, v: BACK, scale: S },
  hq: { sprite: 'buildings/hq', u: 310, v: BACK, scale: 0.6 }, // the hero: a larger plinth
  repair: { sprite: 'buildings/repair', u: 752, v: BACK, scale: S },
  marketing: { sprite: 'buildings/marketing', u: -60, v: FRONT, scale: S },
  customers: { sprite: 'buildings/customers', u: 316, v: FRONT, scale: S },
  claims: { sprite: 'buildings/claims', u: 692, v: FRONT, scale: S },
  risk: { sprite: 'buildings/risk', u: 1212, v: FRONT, scale: S },
}

/** Larger showcase art for the location panel, when it differs from the world sprite. */
export const PANEL_ART: Partial<Record<LocationId, SpriteKey>> = {}

/** Non-interactive set dressing that makes the district feel lived-in. */
export const DECOR: Placement[] = [
  // outer buildings — revealed when the player pans
  { sprite: 'buildings/ev-center', u: -440, v: BACK, scale: S },
  { sprite: 'buildings/market-intel', u: 1212, v: BACK, scale: S },
  { sprite: 'buildings/capital-vault', u: 1590, v: FRONT, scale: S },
  { sprite: 'environments/garden-island', u: -330, v: FRONT - 150, scale: 0.9, anchor: [0.5, 0.72] },
  // street furniture
  { sprite: 'environments/bus-stop', u: 560, v: 975, scale: 0.55 },
  { sprite: 'environments/bench', u: 700, v: 985, scale: 0.42 },
  { sprite: 'environments/bench', u: 1450, v: 985, scale: 0.42 },
  { sprite: 'environments/tyres', u: 1080, v: 300, scale: 0.5 },
  { sprite: 'environments/cone', u: 1085, v: 335, scale: 0.45 },
]

/** Trees and planters: [u, v, kind, scale] */
export const GREENERY: [number, number, SpriteKey, number][] = [
  // boulevard avenue
  ...[-540, -360, -180, 0, 180, 380, 860, 1040, 1280, 1640, 1820, 2000].map(
    (u, i) => [u, 990, i % 4 === 1 ? 'environments/tree-blossom' : 'environments/tree', 0.5] as [number, number, SpriteKey, number],
  ),
  // gaps between buildings
  [-98, 190, 'environments/tree-round', 0.75],
  [278, 180, 'environments/tree', 0.5],
  [716, 170, 'environments/tree-blossom', 0.5],
  [1550, 190, 'environments/tree-round', 0.75],
  [280, 650, 'environments/tree-blossom', 0.5],
  [656, 640, 'environments/tree-round', 0.75],
  [1036, 650, 'environments/tree', 0.5],
  [1552, 650, 'environments/tree', 0.5],
  // river bank
  ...[-560, -240, 90, 1000, 1380, 1760, 2060].map(
    (u, i) => [u, -70, i % 3 === 0 ? 'environments/tree-blossom' : 'environments/tree', 0.46] as [number, number, SpriteKey, number],
  ),
  [470, 1045, 'environments/planter', 0.42],
  [960, 1045, 'environments/planter', 0.42],
  [1560, 1045, 'environments/planter', 0.42],
]

export const LAMPS: [number, number][] = [
  [-450, 930], [-90, 930], [270, 930], [640, 930], [1010, 930], [1380, 930], [1760, 930],
  [-250, 462], [130, 462], [520, 462], [900, 462], [1400, 462], [1780, 462],
]

/** Standing people (sprite, u, v, scale, flip) */
export const PEOPLE: [SpriteKey, number, number, number, boolean?][] = [
  ['characters/manager', 470, 470, 0.24],
  ['characters/executive', 500, 476, 0.24, true],
  ['characters/mechanic', 1100, 360, 0.24, true],
  ['characters/surveyor', 1060, 700, 0.3],
  ['characters/call-agent', 640, 960, 0.32, true],
  ['characters/ceo', 200, 960, 0.3],
]
