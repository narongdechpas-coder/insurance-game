import { describe, expect, it } from 'vitest'
import { capitalHealth, capitalWarning } from './capital'
import { DEFAULT_CONFIG } from './config'
import { createInitialState } from './initialState'

const withCapital = (series: number[]) => {
  const s = createInitialState(DEFAULT_CONFIG)
  const base = s.kpis
  return { ...s, kpiHistory: series.map((c) => ({ ...base, capitalMB: c })), kpis: { ...base, capitalMB: series[series.length - 1] } }
}

describe('capital health', () => {
  it('is safe at the start', () => {
    const h = capitalHealth(withCapital([2000]))
    expect(h.level).toBe('safe')
    expect(capitalWarning(h)).toBe('')
  })
  it('warns early when losses are fast, even above 75%', () => {
    // 2,000 → 1,520 in one quarter: still above 75%, but at that pace the line (1,000) is ~1 quarter away
    const h = capitalHealth(withCapital([2000, 1520]))
    expect(h.level).toBe('danger')
    expect(Math.round(h.quartersLeft)).toBe(1)
    // a slower slide above 75% is a watch, not a danger
    expect(capitalHealth(withCapital([2000, 1700, 1520])).level).toBe('watch')
  })
  it('watches below 75% of start when stable', () => {
    expect(capitalHealth(withCapital([1450, 1450])).level).toBe('watch')
  })
  it('is danger below 62.5% of start', () => {
    const h = capitalHealth(withCapital([1200, 1210]))
    expect(h.level).toBe('danger')
    expect(capitalWarning(h)).toContain('210')
  })
})
