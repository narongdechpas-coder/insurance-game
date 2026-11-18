import { ArrowLeft, ChevronsRight } from 'lucide-react'
import { budgetLeft } from '../../game/decisions/plan'
import { useGameStore } from '../../store/useGameStore'
import { Stage } from '../Stage'
import { Toasts } from '../Toasts'
import { TopBar } from '../TopBar'
import { CardList } from './CardList'
import { CardStage } from './CardStage'
import { DecisionAdvisor } from './DecisionAdvisor'
import { DecisionHeader } from './DecisionHeader'
import { ImpactPanel } from './ImpactPanel'

/** Screen B — Decision Room (Phase 3, step 2 "Strategy" is live). */
export function DecisionRoom() {
  const close = useGameStore((s) => s.closeDecisionRoom)
  const toast = useGameStore((s) => s.toast)
  const over = useGameStore((s) => budgetLeft(s.plan) < 0)
  return (
    <>
      {/* the city stays alive behind the room, blurred and dimmed */}
      <div className="fixed inset-0" style={{ backdropFilter: 'blur(7px) saturate(0.8)', background: 'rgba(7,21,55,0.5)' }} />
      <Stage>
        <TopBar />
        <DecisionHeader />
        <CardList />
        <CardStage />
        <ImpactPanel />
        <DecisionAdvisor />
        <div className="absolute right-7 bottom-6 flex flex-col items-end gap-2.5 pointer-events-auto">
          <button onClick={close} className="inline-flex items-center gap-2 h-11 px-5 rounded-full glass text-navy-800 font-medium hover:brightness-105">
            <ArrowLeft size={18} /> กลับ Command Center
          </button>
          <button
            disabled={over}
            onClick={() => toast('ขั้น "ยืนยันแผน" กำลังสร้าง — Phase 3 ส่วนถัดไป')}
            className="h-[70px] w-[322px] rounded-[24px] btn-gold shine flex items-center justify-center gap-3 font-display font-bold text-[23px] hover:brightness-105 disabled:grayscale disabled:opacity-60 transition-all"
          >
            ถัดไป: ยืนยันแผน <ChevronsRight size={30} strokeWidth={2.8} />
          </button>
        </div>
        <Toasts />
      </Stage>
    </>
  )
}
