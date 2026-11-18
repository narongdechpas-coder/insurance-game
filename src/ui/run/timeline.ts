import type { QuarterReport } from '../../game/sim/types'
import type { GameState, LocationId } from '../../game/types'

/**
 * The quarter "playing out" in the city: a short scripted timeline built from the engine's
 * report. Presentation only; the numbers were already decided by simulateQuarter.
 */
export const RUN_SECONDS = 7.2
export const MONTHS = 3
export const MONTH_SECONDS = 2.1 // months 1..3, then a short close
export const monthAt = (t: number) => Math.min(MONTHS, Math.floor(t / MONTH_SECONDS) + 1)

export interface Chip {
  at: number
  location: LocationId
  text: string
  tone: 'money' | 'claim' | 'alert' | 'good'
}

export interface Toast {
  at: number
  text: string
  color: string
}

const fmt = (x: number) => Math.round(x).toLocaleString('th-TH')

export function buildTimeline(game: GameState): { chips: Chip[]; toasts: Toast[]; floodFrom: number | null } {
  const r = game.lastReport as QuarterReport
  const chips: Chip[] = []
  const toasts: Toast[] = []
  const cols = r.pnl.columns
  const dealer = cols.find((c) => c.id === 'dealer')!
  const direct = cols.find((c) => c.id === 'direct')!
  const agent = cols.find((c) => c.id === 'agent')!
  const total = cols.find((c) => c.id === 'total')!
  const attritional = total.incurredLoss - r.catLossGross
  for (let m = 0; m < MONTHS; m++) {
    const t0 = m * MONTH_SECONDS
    chips.push({ at: t0 + 0.15, location: 'dealer', text: `+${fmt(dealer.writtenPremium / 3)} เบี้ย`, tone: 'money' })
    chips.push({ at: t0 + 0.45, location: 'customers', text: `+${fmt((direct.writtenPremium + agent.writtenPremium) / 3)} เบี้ย`, tone: 'money' })
    chips.push({ at: t0 + 0.8, location: 'claims', text: `${fmt(attritional / 3)} เคลม`, tone: 'claim' })
    chips.push({ at: t0 + 1.15, location: 'repair', text: `ซ่อม ${fmt((attritional / 3) * 0.6)}`, tone: 'claim' })
  }
  // overloads show up from month 2 as the queue builds
  const over: [LocationId, number, string][] = [
    ['customers', r.loads.contact, 'สายแน่น!'],
    ['claims', r.loads.claims, 'เคลมค้าง!'],
    ['repair', r.loads.repair, 'อู่ล้น!'],
  ]
  for (const [loc, load, label] of over)
    if (load > 1.05) for (const at of [MONTH_SECONDS + 1.5, 2 * MONTH_SECONDS + 1.3]) chips.push({ at, location: loc, text: label, tone: 'alert' })
  let floodFrom: number | null = null
  if (r.flood === 'hit') {
    floodFrom = 2 * MONTH_SECONDS + 0.2
    chips.push({ at: floodFrom + 0.4, location: 'risk', text: `น้ำท่วม −${fmt(r.catLossNet)}`, tone: 'alert' })
    chips.push({ at: floodFrom + 0.9, location: 'claims', text: `เคลมน้ำท่วม ${fmt(r.catLossGross)}`, tone: 'alert' })
  }
  for (const m of r.eventImpacts) if (m.label.startsWith('ค่าปรับ')) chips.push({ at: 2 * MONTH_SECONDS + 1.6, location: 'hq', text: `ค่าปรับ −${fmt(-m.amount)}`, tone: 'alert' })
  chips.push({ at: RUN_SECONDS - 1.0, location: 'hq', text: r.uwResult >= 0 ? `กำไร U/W +${fmt(r.uwResult)}` : `ขาดทุน U/W ${fmt(r.uwResult)}`, tone: r.uwResult >= 0 ? 'good' : 'alert' })
  // rivals act through month 1–2
  r.rivals.forEach((x, i) => {
    const c = game.competitors.find((k) => k.id === x.id)!
    toasts.push({ at: 0.6 + i * 0.9, text: x.move, color: c.color })
  })
  return { chips: chips.sort((a, b) => a.at - b.at), toasts, floodFrom }
}
