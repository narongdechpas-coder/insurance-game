/** Tiny trend line for a KPI across quarters. */
export function Sparkline({ values, color = '#2f7bff', w = 120, h = 34 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return <svg width={w} height={h} />
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - ((v - lo) / span) * (h - 8)])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={w} height={h} aria-hidden>
      <path d={`${d} L${lx} ${h} L3 ${h} Z`} fill={color} opacity={0.1} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={3.2} fill={color} />
    </svg>
  )
}
