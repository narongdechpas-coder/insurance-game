import { P } from './sim/params'
import type { GameState } from './types'

/**
 * How close the company is to the game's stop line (capital below a fraction of the starting
 * capital ends the game: P.bankruptcyFraction). This is a game rule, not a solvency regulation.
 *
 * Levels (game design):
 * - watch:  capital under 75% of start, or at the recent loss pace the line is ≤ 4 quarters away
 * - danger: capital under 62.5% of start, or the line is ≤ 2 quarters away
 */
export type CapitalLevel = 'safe' | 'watch' | 'danger'

export interface CapitalHealth {
  level: CapitalLevel
  start: number
  line: number // capital at which the game ends
  capital: number
  buffer: number // capital − line
  /** Average capital lost per quarter over the last 2 quarters (0 when not losing). */
  lossPace: number
  /** Quarters until the line at that pace (Infinity when not losing). */
  quartersLeft: number
  /** Share of the original room still left: 1 at the start, 0 at the line. */
  room: number
}

export function capitalHealth(s: GameState): CapitalHealth {
  const start = s.config.startingCapitalMB
  const line = start * P.bankruptcyFraction
  const capital = s.kpis.capitalMB
  const buffer = capital - line
  const hist = s.kpiHistory.map((k) => k.capitalMB)
  const recent = hist.slice(-3)
  const deltas = recent.slice(1).map((v, i) => v - recent[i])
  const avg = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0
  const lossPace = Math.max(0, -avg)
  const quartersLeft = lossPace > 0 ? buffer / lossPace : Infinity
  const level: CapitalLevel =
    capital < start * 0.625 || quartersLeft <= 2 ? 'danger' : capital < start * 0.75 || quartersLeft <= 4 ? 'watch' : 'safe'
  return { level, start, line, capital, buffer, lossPace, quartersLeft, room: Math.max(0, Math.min(1, buffer / (start - line))) }
}

const n = (v: number) => Math.round(v).toLocaleString('th-TH')

/** One plain sentence for the advisor, review banner and plan check. Empty when safe. */
export function capitalWarning(h: CapitalHealth): string {
  if (h.level === 'safe') return ''
  const pace =
    h.quartersLeft < Infinity
      ? ` ถ้ายังขาดทุนเท่าเฉลี่ย 2 ไตรมาสล่าสุด (${n(h.lossPace)} ล้านบาทต่อไตรมาส) จะถึงเส้นในราว ${Math.max(1, Math.round(h.quartersLeft))} ไตรมาส`
      : ''
  return h.level === 'danger'
    ? `เงินทุนเหลือห่างเส้นหยุดรับประกันแค่ ${n(h.buffer)} ล้านบาท${pace} ต้องหยุดเลือดก่อนโตค่ะ`
    : `เงินทุนลดลงมาเหลือ ${n(h.capital)} ล้านบาท ห่างเส้นหยุดรับประกัน ${n(h.buffer)} ล้านบาท${pace}`
}
