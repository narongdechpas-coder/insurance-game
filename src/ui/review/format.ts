/** Number formats for the review. Money is million THB. */
export const mb = (x: number) => Math.round(x).toLocaleString('th-TH')
export const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`
export const signed = (x: number, f: (v: number) => string) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${f(Math.abs(x))}`
