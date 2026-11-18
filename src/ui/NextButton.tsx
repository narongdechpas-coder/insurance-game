import { CheckCircle2, ChevronsRight } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'

/** Primary call to action: into the Decision Room, or back to review a confirmed plan. */
export function NextButton() {
  const open = useGameStore((s) => s.openDecisionRoom)
  const confirmed = useGameStore((s) => s.ui.planConfirmed)
  return (
    <div className="absolute right-6 bottom-9 flex flex-col items-end gap-2 pointer-events-auto anim-rise" style={{ animationDelay: '0.4s' }}>
      {confirmed && (
        <span className="inline-flex items-center gap-1.5 rounded-full glass-dark text-white px-3.5 py-1.5 text-[13.5px]">
          <CheckCircle2 size={15} className="text-good" /> แผนไตรมาสนี้ยืนยันแล้ว รอจำลองผล (Phase 4)
        </span>
      )}
      <button
        onClick={() => open(confirmed ? 'confirm' : undefined)}
        className="h-[76px] w-[322px] rounded-[26px] btn-gold shine flex items-center justify-center gap-4 font-display font-bold text-[24px] hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0 transition-all"
      >
        {confirmed ? 'ดูแผนที่ยืนยันแล้ว' : 'เข้าห้องตัดสินใจ'}
        <ChevronsRight size={34} strokeWidth={2.8} />
      </button>
    </div>
  )
}
