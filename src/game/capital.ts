import { P } from './sim/params'
import type { GameState } from './types'

/** Minimum capital for a company writing `quarterGwp` a quarter (game rule, not the regulator's CAR). */
export const capitalLine = (quarterGwp: number) => P.minCapitalOfAnnualGwp * 4 * quarterGwp

/** Premium the company writes now (last quarter, or the starting book before the first quarter). */
export const gwpNow = (s: GameState) => s.lastReport?.gwp ?? s.kpis.marketShare * s.sim.marketGwp

/**
 * How close the company is to the game's stop line. Engine v3: the line is a minimum capital that
 * grows with the premium written (12.5% of a year's premium), so growth uses up capital room.
 * This is a game rule, not a solvency regulation.
 *
 * Levels (game design), against the room the company had at the start:
 * - watch:  less than half of the starting room left, or at the recent loss pace the line is ≤ 4 quarters away
 * - danger: less than a quarter of the starting room left, or the line is ≤ 2 quarters away
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
  const line = capitalLine(gwpNow(s))
  const startRoom = start - capitalLine(s.sim.baseDemand.policies * P.marketGwp0)
  const capital = s.kpis.capitalMB
  const buffer = capital - line
  const hist = s.kpiHistory.map((k) => k.capitalMB)
  const recent = hist.slice(-3)
  const deltas = recent.slice(1).map((v, i) => v - recent[i])
  const avg = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0
  const lossPace = Math.max(0, -avg)
  const quartersLeft = lossPace > 0 ? buffer / lossPace : Infinity
  const room = buffer / startRoom
  const level: CapitalLevel = room < 0.25 || quartersLeft <= 2 ? 'danger' : room < 0.5 || quartersLeft <= 4 ? 'watch' : 'safe'
  return { level, start, line, capital, buffer, lossPace, quartersLeft, room: Math.max(0, Math.min(1, room)) }
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
    ? `เงินทุนเหลือห่างทุนขั้นต่ำ (${n(h.line)} ล้านบาท) แค่ ${n(h.buffer)} ล้านบาท${pace} ต้องหยุดเลือดก่อนโต เพราะยิ่งโตเส้นยิ่งสูงค่ะ`
    : `เงินทุนเหลือ ${n(h.capital)} ล้านบาท ห่างเส้นทุนขั้นต่ำ ${n(h.line)} ล้านบาท (12.5% ของเบี้ยทั้งปี) อยู่ ${n(h.buffer)} ล้านบาท${pace}`
}
