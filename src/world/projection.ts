/**
 * Axonometric projection matched to the sprite art.
 * Ground axes measured from the building plinths:
 *   U (street axis)  → right & up   ~16°
 *   V (depth axis)   → right & down ~20°
 * Grid units ≈ sprite pixels at scale 1, so sprites and ground share one scale.
 */
export const U = { x: 0.961, y: -0.276 }
export const V = { x: 0.94, y: 0.342 }

/** World canvas (px). The camera frames a part of it. */
export const WORLD = { w: 4200, h: 2200 }
const ORIGIN = { x: 1220, y: 1210 }

export function project(u: number, v: number) {
  return { x: ORIGIN.x + u * U.x + v * V.x, y: ORIGIN.y + u * U.y + v * V.y }
}

/** SVG points string for a ground rectangle u0..u1 × v0..v1. */
export function quad(u0: number, v0: number, u1: number, v1: number) {
  return [project(u0, v0), project(u1, v0), project(u1, v1), project(u0, v1)].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

/** Angle (deg) of an axis on screen — used to rotate road markings and car paths. */
export const ANGLE_U = (Math.atan2(U.y, U.x) * 180) / Math.PI
export const ANGLE_V = (Math.atan2(V.y, V.x) * 180) / Math.PI
