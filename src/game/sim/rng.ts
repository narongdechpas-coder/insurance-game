/** Seeded PRNG (mulberry32): the same seed always gives the same quarter. */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (lo: number, hi: number) => lo + (hi - lo) * next(),
    /** Roughly normal (sum of uniforms), mean 0, sd ≈ 1. */
    normal: () => (next() + next() + next() + next() - 2) * 1.732,
    pick: <T,>(xs: T[]) => xs[Math.floor(next() * xs.length)],
  }
}
