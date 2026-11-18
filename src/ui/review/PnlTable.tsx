import type { Pnl, PnlColumn } from '../../game/sim/channels'
import { mb, pct } from './format'
import { Glossed } from '../glossary/Term'

type Row = { label: string; get: (c: PnlColumn) => number; kind?: 'bold' | 'result' | 'neg' }

const AMOUNTS: Row[] = [
  { label: 'Written Premium', get: (c) => c.writtenPremium },
  { label: 'Earned Premium', get: (c) => c.earnedPremium },
  { label: 'Paid Loss', get: (c) => c.paidLoss },
  { label: 'Incurred Loss', get: (c) => c.incurredLoss, kind: 'bold' },
  { label: 'Commission', get: (c) => c.commission },
  { label: 'Marketing Expense', get: (c) => c.marketing },
  { label: 'Other Underwriting Expenses', get: (c) => c.otherUw },
  { label: 'Admin Expense', get: (c) => c.admin },
  { label: 'Expense Total', get: (c) => c.expenseTotal, kind: 'bold' },
  { label: 'U/W Result', get: (c) => c.uwResult, kind: 'result' },
]

const RATIOS: Row[] = [
  { label: 'Loss Ratio', get: (c) => c.incurredLoss / c.earnedPremium },
  { label: 'Commission Ratio', get: (c) => c.commission / c.earnedPremium },
  { label: 'Marketing & Other U/W Expense Ratio', get: (c) => (c.marketing + c.otherUw) / c.earnedPremium },
  { label: 'Admin Expense Ratio', get: (c) => c.admin / c.earnedPremium },
  { label: 'Combined Ratio', get: (c) => (c.incurredLoss + c.expenseTotal) / c.earnedPremium, kind: 'bold' },
]

/**
 * Underwriting P&L by channel, in the layout used for channel performance reviews.
 * Amounts in million THB. All ratios on earned premium, so the total Combined Ratio equals the KPI.
 */
export function PnlTable({ pnl }: { pnl: Pnl }) {
  const cols = pnl.columns
  const cell = 'px-3 py-[5px] text-right tabular-nums'
  return (
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
              <td className="px-3 py-[5px] text-left text-navy-900"><Glossed text={r.label} /></td>
              {cols.map((c) => {
                const v = r.get(c)
                return (
                  <td key={c.id} className={`${cell} ${v < 0 ? 'text-alert' : 'text-navy-900'} ${c.id === 'total' ? 'bg-navy-900/[0.03]' : ''}`}>
                    {mb(v)}
                  </td>
                )
              })}
            </tr>
          ))}
          {RATIOS.map((r, i) => (
            <tr key={r.label} className={`bg-navy-900/[0.035] ${r.kind === 'bold' ? 'font-bold' : ''} ${i === 0 ? 'border-t-2 border-navy-900/15' : 'border-t border-navy-900/5'}`}>
              <td className="px-3 py-[5px] text-left text-navy-900"><Glossed text={r.label} /></td>
              {cols.map((c) => {
                const v = r.get(c)
                return (
                  <td key={c.id} className={`${cell} ${v < 0 ? 'text-alert' : 'text-navy-900'}`}>
                    {pct(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-3 gap-px bg-navy-900/10 border-t border-navy-900/10 text-[13px]">
        {[
          { label: 'ประกันภัยต่อ (ต้นทุนสุทธิ)', v: -pnl.reinsurance },
          { label: 'ผลรับประกันสุทธิ', v: pnl.netUwResult },
          { label: 'รายได้จากการลงทุน', v: pnl.investmentIncome },
        ].map((x) => (
          <div key={x.label} className="bg-white px-3 py-2 flex justify-between">
            <span className="text-navy-700/80"><Glossed text={x.label} /></span>
            <b className={x.v < 0 ? 'text-alert' : 'text-navy-900'}>{mb(x.v)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
