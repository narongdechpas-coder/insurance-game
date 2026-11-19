import { useState } from 'react'
import type { Pnl, PnlColumn } from '../../game/sim/channels'
import { Glossed } from '../glossary/Term'
import { mb, pct } from './format'

/** good = which direction is better (1 = higher is better, -1 = lower is better) */
type Row = { label: string; get: (c: PnlColumn) => number; kind?: 'bold' | 'result' | 'neg'; good: 1 | -1 }

const AMOUNTS: Row[] = [
  { label: 'Written Premium', get: (c) => c.writtenPremium, good: 1 },
  { label: 'Earned Premium', get: (c) => c.earnedPremium, good: 1 },
  { label: 'Paid Loss', get: (c) => c.paidLoss, good: -1 },
  { label: 'Incurred Loss', get: (c) => c.incurredLoss, kind: 'bold', good: -1 },
  { label: 'Commission', get: (c) => c.commission, good: -1 },
  { label: 'Marketing Expense', get: (c) => c.marketing, good: -1 },
  { label: 'Other Underwriting Expenses', get: (c) => c.otherUw, good: -1 },
  { label: 'Admin Expense', get: (c) => c.admin, good: -1 },
  { label: 'Expense Total', get: (c) => c.expenseTotal, kind: 'bold', good: -1 },
  { label: 'U/W Result', get: (c) => c.uwResult, kind: 'result', good: 1 },
]

const RATIOS: Row[] = [
  { label: 'Loss Ratio', get: (c) => c.incurredLoss / c.earnedPremium, good: -1 },
  { label: 'Commission Ratio', get: (c) => c.commission / c.earnedPremium, good: -1 },
  { label: 'Marketing & Other U/W Expense Ratio', get: (c) => (c.marketing + c.otherUw) / c.earnedPremium, good: -1 },
  { label: 'Admin Expense Ratio', get: (c) => c.admin / c.earnedPremium, good: -1 },
  { label: 'Combined Ratio', get: (c) => (c.incurredLoss + c.expenseTotal) / c.earnedPremium, kind: 'bold', good: -1 },
]

/** Change vs the comparison period: % for amounts, percentage points for ratios. */
function Diff({ now, before, good, ratio }: { now: number; before: number | undefined; good: 1 | -1; ratio?: boolean }) {
  if (before === undefined || !isFinite(before)) return null
  const d = ratio ? now - before : before !== 0 ? (now - before) / Math.abs(before) : 0
  if (!isFinite(d)) return null
  const flat = Math.abs(d) < (ratio ? 0.0005 : 0.005)
  const tone = flat ? 'text-navy-700/45' : d * good > 0 ? 'text-emerald-700' : 'text-red-700'
  const txt = flat ? '±0' : `${d > 0 ? '+' : '−'}${Math.abs(d * 100).toFixed(1)}${ratio ? ' จุด' : '%'}`
  return <span className={`block text-[11px] font-medium leading-tight ${tone}`} data-diff>{txt}</span>
}

/**
 * Underwriting P&L by channel, in the layout used for channel performance reviews.
 * Amounts in million THB. All ratios on earned premium, so the total Combined Ratio equals the KPI.
 * With `prev`, a toggle shows each line's change vs that period (green = better, red = worse).
 */
export function PnlTable({ pnl, prev, prevLabel = 'ไตรมาสก่อน', defaultDiff = false }: { pnl: Pnl; prev?: Pnl | null; prevLabel?: string; defaultDiff?: boolean }) {
  const [showDiff, setShowDiff] = useState(defaultDiff)
  const cols = pnl.columns
  const before = (id: string) => prev?.columns.find((c) => c.id === id)
  const diffOn = showDiff && !!prev
  const cell = 'px-3 py-[5px] text-right tabular-nums align-top'
  return (
    <div>
      {prev && (
        <label className="mb-2 inline-flex items-center gap-2 text-[13px] text-navy-800 cursor-pointer select-none" data-print-hide>
          <button
            role="switch"
            aria-checked={showDiff}
            data-toggle="pnl-diff"
            onClick={() => setShowDiff((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${showDiff ? 'bg-brand-500' : 'bg-navy-900/20'}`}
          >
            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${showDiff ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
          แสดง +/- เทียบ{prevLabel}
          <span className="text-[11.5px] text-navy-700/55">(ยอดเงินเป็น % · อัตราส่วนเป็นจุด · เขียว = ดีขึ้น แดง = แย่ลง)</span>
        </label>
      )}
      <div className="rounded-2xl overflow-hidden border border-navy-900/10 bg-white text-[13.5px]">
        <table className="w-full border-collapse" data-table="pnl">
          <thead>
            <tr className="bg-navy-800 text-white">
              <th className="px-3 py-2 text-left font-semibold">ล้านบาท</th>
              {cols.map((c) => (
                <th key={c.id} className={`px-3 py-2 text-right font-semibold ${c.id === 'total' ? 'bg-navy-900' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AMOUNTS.map((r) => (
              <tr key={r.label} className={`${r.kind === 'result' ? 'bg-emerald-50 font-bold' : r.kind === 'bold' ? 'font-semibold' : ''} border-t border-navy-900/5`}>
                <td className="px-3 py-[5px] text-left text-navy-900 align-top">
                  <Glossed text={r.label} />
                </td>
                {cols.map((c) => {
                  const v = r.get(c)
                  const b = before(c.id)
                  return (
                    <td key={c.id} className={`${cell} ${v < 0 ? 'text-alert' : 'text-navy-900'} ${c.id === 'total' ? 'bg-navy-900/[0.03]' : ''}`}>
                      {mb(v)}
                      {diffOn && <Diff now={v} before={b ? r.get(b) : undefined} good={r.good} />}
                    </td>
                  )
                })}
              </tr>
            ))}
            {RATIOS.map((r, i) => (
              <tr key={r.label} className={`bg-navy-900/[0.035] ${r.kind === 'bold' ? 'font-bold' : ''} ${i === 0 ? 'border-t-2 border-navy-900/15' : 'border-t border-navy-900/5'}`}>
                <td className="px-3 py-[5px] text-left text-navy-900 align-top">
                  <Glossed text={r.label} />
                </td>
                {cols.map((c) => {
                  const v = r.get(c)
                  const b = before(c.id)
                  return (
                    <td key={c.id} className={`${cell} ${v < 0 ? 'text-alert' : 'text-navy-900'}`}>
                      {pct(v)}
                      {diffOn && <Diff now={v} before={b ? r.get(b) : undefined} good={r.good} ratio />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-3 gap-px bg-navy-900/10 border-t border-navy-900/10 text-[13px]">
          {[
            { label: 'ประกันภัยต่อ (ต้นทุนสุทธิ)', v: -pnl.reinsurance, b: prev ? -prev.reinsurance : undefined },
            { label: 'ผลรับประกันสุทธิ', v: pnl.netUwResult, b: prev?.netUwResult },
            { label: 'รายได้จากการลงทุน', v: pnl.investmentIncome, b: prev?.investmentIncome },
          ].map((x) => (
            <div key={x.label} className="bg-white px-3 py-2 flex justify-between items-start">
              <span className="text-navy-700/80">
                <Glossed text={x.label} />
              </span>
              <span className="text-right">
                <b className={x.v < 0 ? 'text-alert' : 'text-navy-900'}>{mb(x.v)}</b>
                {diffOn && <Diff now={x.v} before={x.b} good={1} />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
