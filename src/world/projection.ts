/**
 * Axonometric projection — the ground must match the camera the sprite art was rendered with.
 *   U (street axis)  → right & up
 *   V (depth axis)   → right & down
 * Grid units ≈ sprite pixels at scale 1, so sprites and ground share one scale.
 *
 * PRESETS
 *   house   — 24° both sides: the camera all round-2 art is rendered with (checked by tools/angle_check.py)
 *   interim — fitted to round-1 art (left edges ≈25°, right ≈12–18°); kept for reference
 *   iso     — true 2:1 isometric (26.57°)
 */
const PRESETS = {
  house: { u: 24, v: 24 },
  interim: { u: 16, v: 25 },
  iso: { u: 26.57, v: 26.57 },
} as const
export const PROJECTION: keyof typeof PRESETS = 'house'

const rad = (d: number) => (d * Math.PI) / 180
const A = PRESETS[PROJECTION]
export const U = { x: Math.cos(rad(A.u)), y: -Math.sin(rad(A.u)) }
export const V = { x: Math.cos(rad(A.v)), y: Math.sin(rad(A.v)) }

/** z-index of the focus scrim; the selected building and its UI sit above it. */
export const FOCUS_Z = 6000

export const WORLD = { w: 4200, h: 2200 }
export const ORIGIN = { x: 1220, y: 1210 }

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

/**
 * SVG patternTransform that lays a flat (top-down) texture onto the ground plane:
 * pattern x → U axis, pattern y → V axis. Pattern sizes are then in grid units.
 */
export const GROUND_MATRIX = `matrix(${U.x} ${U.y} ${V.x} ${V.y} ${ORIGIN.x} ${ORIGIN.y})`
