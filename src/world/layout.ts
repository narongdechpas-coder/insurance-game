import type { SpriteKey } from '../assets/registry'
import type { LocationId } from '../game/types'

/**
 * Where everything sits in the Command Center world (grid units, see projection.ts).
 * Pure data — move a building by editing numbers here.
 */

export const DISTRICT = { u0: -620, v0: -60, u1: 2240, v1: 1060 }
export const RIVER = { v0: -430, v1: -150 }

export const ROADS = {
  back: { v: 330, w: 112 }, // between back and front rows
  front: { v: 800, w: 118 }, // boulevard
  cross: { u: 1110, w: 104 }, // street through the middle-right
}

export interface Placement {
  sprite: SpriteKey
  u: number
  v: number
  scale: number
  anchor?: [number, number]
  flip?: boolean
}

export const BUILDINGS: Record<LocationId, Placement> = {
  dealer: { sprite: 'buildings/dealer', u: 300, v: 150, scale: 0.92, anchor: [0.5, 0.7] },
  hq: { sprite: 'buildings/hq', u: 780, v: 120, scale: 1.08, anchor: [0.5, 0.74] },
  repair: { sprite: 'buildings/repair', u: 1420, v: 150, scale: 0.92, anchor: [0.5, 0.7] },
  marketing: { sprite: 'buildings/marketing', u: 110, v: 600, scale: 0.42, anchor: [0.5, 0.8] },
  customers: { sprite: 'buildings/customers', u: 510, v: 610, scale: 1.0, anchor: [0.5, 0.72] },
  claims: { sprite: 'buildings/claims', u: 870, v: 590, scale: 0.86, anchor: [0.5, 0.7] },
  risk: { sprite: 'buildings/risk', u: 1370, v: 600, scale: 0.9, anchor: [0.5, 0.72] },
}

/** Non-interactive set dressing that makes the district feel lived-in. */
export const DECOR: Placement[] = [
  // outer buildings — revealed when the player pans
  { sprite: 'buildings/ev-center', u: -260, v: 160, scale: 0.85, anchor: [0.5, 0.7] },
  { sprite: 'buildings/market-intel', u: 1950, v: 160, scale: 0.95, anchor: [0.5, 0.72] },
  { sprite: 'buildings/capital-vault', u: 1890, v: 600, scale: 1.0, anchor: [0.5, 0.72] },
  { sprite: 'environments/garden-island', u: -300, v: 610, scale: 1.0, anchor: [0.5, 0.72] },
  // street furniture
  { sprite: 'environments/bus-stop', u: 640, v: 905, scale: 0.55 },
  { sprite: 'environments/carport', u: 1290, v: 905, scale: 0.85 },
  { sprite: 'environments/guard-gate', u: 1060, v: 225, scale: 0.65 },
  { sprite: 'environments/cafe-terrace', u: 300, v: 905, scale: 0.85 },
  { sprite: 'environments/ev-chargers', u: -40, v: 250, scale: 0.42 },
  { sprite: 'environments/flag-pair', u: 600, v: 240, scale: 0.45 },
  { sprite: 'environments/flag-planter', u: 980, v: 245, scale: 0.42 },
  { sprite: 'environments/bench', u: 760, v: 915, scale: 0.42 },
  { sprite: 'environments/tyres', u: 1680, v: 250, scale: 0.55 },
  { sprite: 'environments/cone', u: 1700, v: 280, scale: 0.5 },
  { sprite: 'environments/cone', u: 1235, v: 290, scale: 0.5 },
]

/** Trees and planters: [u, v, kind, scale] */
export const GREENERY: [number, number, SpriteKey, number][] = [
  // boulevard avenue (front of front road)
  ...[-520, -330, -140, 50, 470, 900, 1460, 1650, 1840, 2030].map(
    (u, i) => [u, 905, i % 4 === 1 ? 'environments/tree-blossom' : 'environments/tree', 0.5] as [number, number, SpriteKey, number],
  ),
  // back road verge
  ...[-520, -60, 560, 1000, 1290, 1720, 2120].map(
    (u, i) => [u, 255, i % 3 === 2 ? 'environments/tree-round' : 'environments/tree-small', 0.75] as [number, number, SpriteKey, number],
  ),
  // between front-row buildings
  [320, 430, 'environments/tree', 0.5],
  [700, 420, 'environments/tree-blossom', 0.5],
  [1290, 440, 'environments/tree-round', 0.75],
  [1700, 420, 'environments/tree', 0.5],
  [-80, 430, 'environments/tree-round', 0.75],
  // river bank
  ...[-560, -200, 140, 480, 1180, 1560, 1900, 2200].map(
    (u, i) => [u, -40, i % 3 === 0 ? 'environments/tree-blossom' : 'environments/tree', 0.48] as [number, number, SpriteKey, number],
  ),
  [380, 980, 'environments/planter', 0.45],
  [880, 985, 'environments/planter', 0.45],
  [1480, 985, 'environments/planter', 0.45],
  [-300, 990, 'environments/planter', 0.45],
]

export const LAMPS: [number, number][] = [
  [-420, 895], [-20, 895], [400, 890], [820, 890], [1460, 892], [1880, 892],
  [-300, 410], [200, 405], [600, 400], [1000, 405], [1400, 405], [1820, 405],
]

/** Standing people (sprite, u, v, scale, flip) */
export const PEOPLE: [SpriteKey, number, number, number, boolean?][] = [
  ['characters/manager', 640, 380, 0.24],
  ['characters/executive', 676, 384, 0.24, true],
  ['characters/mechanic', 1620, 290, 0.24, true],
  ['characters/surveyor', 1050, 690, 0.32],
  ['characters/call-agent', 640, 700, 0.34, true],
  ['characters/ceo', 205, 700, 0.32],
]
