import { ChevronsRight } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'

/** Primary call to action: move from briefing into decisions. */
export function NextButton() {
  const toast = useGameStore((s) => s.toast)
  return (
    <button
      onClick={() => toast('Decision Room จะเปิดใช้งานใน Phase 3')}
      className="absolute right-6 bottom-9 h-[76px] w-[322px] rounded-[26px] btn-gold shine flex items-center justify-center gap-4 font-display font-bold text-[24px] pointer-events-auto hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 transition-all anim-rise"
      style={{ animationDelay: '0.4s' }}
    >
      เข้าห้องตัดสินใจ
      <ChevronsRight size={34} strokeWidth={2.8} />
    </button>
  )
}
