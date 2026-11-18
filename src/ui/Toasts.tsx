import { Info } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'

export function Toasts() {
  const toasts = useGameStore((s) => s.ui.toasts)
  return (
    <div className="absolute top-[108px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="glass-dark text-white rounded-full pl-3 pr-5 py-2 flex items-center gap-2 text-[15px] anim-rise">
          <Info size={17} className="text-brand-200" />
          {t.text}
        </div>
      ))}
    </div>
  )
}
