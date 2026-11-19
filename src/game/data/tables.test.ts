import { describe, expect, it } from 'vitest'
import { CHANNEL_TABLE, SEGMENTS } from './tables'

const close = (a: number, b: number, tol = 0.001) => Math.abs(a - b) <= tol
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('assumption tables (segments.json, channels.json)', () => {
  it('segment start shares add up to 100%', () => {
    expect(close(sum(SEGMENTS.map((s) => s.startShare)), 1)).toBe(true)
  })
  it('portfolio loss ratio stays about where the current game is balanced (58% ± 1.5)', () => {
    const lr = sum(SEGMENTS.map((s) => s.startShare * s.adequateLR))
    expect(Math.abs(lr - 0.58)).toBeLessThan(0.015)
  })
  it('channel market shares add up to 100%', () => {
    expect(close(sum(CHANNEL_TABLE.map((c) => c.marketShare)), 1)).toBe(true)
  })
  it('each channel segment mix adds up to 100% and uses known segments', () => {
    const ids = new Set(SEGMENTS.map((s) => s.id))
    for (const c of CHANNEL_TABLE) {
      expect(close(sum(Object.values(c.segmentMix)), 1)).toBe(true)
      for (const k of Object.keys(c.segmentMix)) expect(ids.has(k as never)).toBe(true)
    }
  })
  it('channel mixes roughly reproduce the start portfolio (each segment within 3 points)', () => {
    for (const s of SEGMENTS) {
      const fromChannels = sum(CHANNEL_TABLE.map((c) => c.marketShare * c.segmentMix[s.id]))
      expect(Math.abs(fromChannels - s.startShare)).toBeLessThan(0.03)
    }
  })
  it('every slider has 5 steps with a neutral middle', () => {
    for (const c of CHANNEL_TABLE) {
      expect(c.steps).toHaveLength(5)
      expect(c.steps[2]).toBe(0)
    }
  })
})
