import { ChevronDown, ChevronUp, Minus } from 'lucide-react'
import { tone } from './visuals'

const TONE = { good: 'text-good', bad: 'text-alert', neutral: 'text-navy-700/35' }

/** Direction shown as stacked chevrons — no numbers. */
export function ImpactArrows({ value, higherIsBetter, size = 16 }: { value: number; higherIsBetter: boolean; size?: number }) {
  const t = tone(value, higherIsBetter)
  if (value === 0) return <Minus size={size} className={TONE.neutral} strokeWidth={3} />
  const Icon = value > 0 ? ChevronUp : ChevronDown
  return (
    <span className={`inline-flex ${value > 0 ? 'flex-col' : 'flex-col-reverse'} -space-y-[0.55em] ${TONE[t]}`}>
      {Array.from({ length: Math.abs(value) }).map((_, i) => (
        <Icon key={i} size={size} strokeWidth={3.2} />
      ))}
    </span>
  )
}
