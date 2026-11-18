import { ChevronsRight } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'

/** Primary call to action: from the briefing into the Decision Room. */
export function NextButton() {
  const open = useGameStore((s) => s.openDecisionRoom)
  return (
    <button
      onClick={() => open()}
      className="absolute right-6 bottom-9 h-[76px] w-[322px] rounded-[26px] btn-gold shine flex items-center justify-center gap-4 font-display font-bold text-[24px] pointer-events-auto hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 transition-all anim-rise"
      style={{ animationDelay: '0.4s' }}
    >
      เข้าห้องตัดสินใจ
      <ChevronsRight size={34} strokeWidth={2.8} />
    </button>
  )
}
