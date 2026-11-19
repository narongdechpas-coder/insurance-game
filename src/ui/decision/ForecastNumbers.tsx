import type { Delta } from '../../game/choiceForecast'

const sign = (v: number, d = 0) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d })}`
const tone = (v: number, eps: number, good = 1) => (Math.abs(v) < eps ? 'text-navy-700/55' : v * good > 0 ? 'text-emerald-700' : 'text-red-700')
const TEAM: Record<string, string> = { contact: 'Call center', claims: 'ทีมสินไหม', repair: 'อู่' }

/**
 * Engine numbers for one choice (phase 3), against keeping what the company does now:
 * premium next quarter, U/W over three quarters (after the choice's own cost), satisfaction,
 * the busiest team and the net loss if a flood hit.
 */
export function ForecastNumbers({ d, compact = false }: { d?: Delta; compact?: boolean }) {
  if (!d) return null
  const rows: [string, string, string, string][] = [
    ['เบี้ย/ไตรมาส', `${sign(d.dGwp)} ล้าน`, tone(d.dGwp, 1), 'เบี้ยรับไตรมาสหน้า เทียบกับคงค่าเดิม'],
    ['U/W 3 ไตรมาส', `${sign(d.dUw3)} ล้าน`, tone(d.dUw3, 1), 'ผลรับประกันสุทธิรวม 3 ไตรมาส หลังหักงบของตัวเลือกนี้แล้ว'],
    ['ความพอใจ', `${sign(d.dSat3, 2)} ดาว`, tone(d.dSat3, 0.005), 'ความพอใจลูกค้าหลัง 3 ไตรมาส'],
    ['ถ้าน้ำท่วม', `${sign(d.dFloodLoss)} ล้าน`, tone(d.dFloodLoss, 1, -1), 'ความเสียหายสุทธิ (หลังประกันภัยต่อ) ถ้าน้ำท่วมไตรมาสหน้า'],
  ]
  return (
    <span data-forecast className={`grid grid-cols-1 ${compact ? 'text-[10.5px]' : 'text-[11px]'} leading-snug text-navy-800`}>
      {rows.map(([k, v, c, title]) => (
        <span key={k} className="flex justify-between gap-1" title={title}>
          <span className="text-navy-700/70">{k}</span>
          <span className={`tabular-nums font-medium ${c}`}>{v}</span>
        </span>
      ))}
      <span className="flex justify-between gap-1" title="ภาระงานของทีมที่หนักที่สุดไตรมาสหน้า">
        <span className="text-navy-700/70">งานหนักสุด</span>
        <span className={`tabular-nums font-medium ${d.peakLoad > 1.05 ? 'text-red-700' : d.peakLoad > 0.97 ? 'text-amber-700' : 'text-navy-800'}`}>
          {TEAM[d.peakTeam]} {Math.round(d.peakLoad * 100)}%
        </span>
      </span>
    </span>
  )
}
