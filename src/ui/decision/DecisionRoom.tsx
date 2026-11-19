import { ArrowLeft, ChevronsLeft, ChevronsRight, ShieldCheck } from 'lucide-react'
import { budgetLeft, budgetOf, unansweredEvents } from '../../game/decisions/plan'
import { useGameStore } from '../../store/useGameStore'
import { Stage } from '../Stage'
import { Toasts } from '../Toasts'
import { TopBar } from '../TopBar'
import { CardList } from './CardList'
import { CardStage } from './CardStage'
import { ChannelStage } from './ChannelStage'
import { PricingStage } from './PricingStage'
import { StaffStage } from './StaffStage'
import { ConfirmView } from './ConfirmView'
import { DecisionAdvisor } from './DecisionAdvisor'
import { DecisionHeader } from './DecisionHeader'
import { ImpactPanel } from './ImpactPanel'
import { ScenarioList } from './ScenarioList'
import { ScenarioStage } from './ScenarioStage'

const GOLD =
  'h-[70px] w-[322px] rounded-[24px] btn-gold shine flex items-center justify-center gap-3 font-display font-bold text-[22px] hover:brightness-105 disabled:grayscale disabled:opacity-60 transition-all'
const GHOST = 'inline-flex items-center gap-2 h-11 px-5 rounded-full glass text-navy-800 font-medium hover:brightness-105'

/** Screen B — Decision Room: ① respond to events → ② strategy → ③ confirm. */
export function DecisionRoom() {
  const step = useGameStore((s) => s.ui.step)
  const close = useGameStore((s) => s.closeDecisionRoom)
  const setStep = useGameStore((s) => s.setStep)
  const toast = useGameStore((s) => s.toast)
  const confirm = useGameStore((s) => s.confirmPlan)
  const over = useGameStore((s) => budgetLeft(s.plan, s.responses, s.game.sim.ops.owned, budgetOf(s.game)) < 0)
  const pending = useGameStore((s) => unansweredEvents(s.game, s.responses).length)
  const activeCard = useGameStore((s) => s.ui.activeCard)

  const toConfirm = () => {
    if (pending) {
      setStep('scenario')
      toast(`ตอบเหตุการณ์ให้ครบก่อน (เหลืออีก ${pending} เรื่อง)`)
    } else setStep('confirm')
  }

  return (
    <>
      {/* the city stays alive behind the room, blurred and dimmed */}
      <div className="fixed inset-0" style={{ backdropFilter: 'blur(7px) saturate(0.8)', background: 'rgba(7,21,55,0.5)' }} />
      <Stage>
        <TopBar />
        <DecisionHeader />
        {step === 'scenario' && (
          <>
            <ScenarioList />
            <ScenarioStage />
          </>
        )}
        {step === 'strategy' && (
          <>
            <CardList />
            {activeCard === 'staff' ? <StaffStage /> : activeCard === 'distribution' ? <ChannelStage /> : activeCard === 'pricing' ? <PricingStage /> : <CardStage />}
          </>
        )}
        {step === 'confirm' && <ConfirmView />}
        <ImpactPanel />
        <DecisionAdvisor />
        <div className="absolute right-7 bottom-6 flex flex-col items-end gap-2.5 pointer-events-auto">
          {step === 'scenario' && (
            <>
              <button onClick={close} className={GHOST}>
                <ArrowLeft size={18} /> กลับ Command Center
              </button>
              <button onClick={() => setStep('strategy')} className={GOLD}>
                ถัดไป: วางกลยุทธ์ <ChevronsRight size={30} strokeWidth={2.8} />
              </button>
            </>
          )}
          {step === 'strategy' && (
            <>
              <button onClick={() => setStep('scenario')} className={GHOST}>
                <ChevronsLeft size={18} /> กลับไปรับมือเหตุการณ์
              </button>
              <button disabled={over} onClick={toConfirm} className={GOLD}>
                ถัดไป: ยืนยันแผน <ChevronsRight size={30} strokeWidth={2.8} />
              </button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <button onClick={() => setStep('strategy')} className={GHOST}>
                <ChevronsLeft size={18} /> กลับไปแก้กลยุทธ์
              </button>
              <button
                disabled={over || pending > 0}
                onClick={() => {
                  confirm()
                }}
                className={GOLD}
              >
                <ShieldCheck size={28} strokeWidth={2.6} /> ยืนยันแผนไตรมาส
              </button>
            </>
          )}
        </div>
        <Toasts />
      </Stage>
    </>
  )
}
