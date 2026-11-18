import { Check, Lock, Wallet } from 'lucide-react'
import { QUARTER_BUDGET_MB } from '../../game/decisions/cards'
import { planCost } from '../../game/decisions/plan'
import { useGameStore, type DecisionStep } from '../../store/useGameStore'

const STEPS: { id: DecisionStep; label: string; ready: boolean }[] = [
  { id: 'scenario', label: 'รับมือเหตุการณ์', ready: false },
  { id: 'strategy', label: 'วางกลยุทธ์', ready: true },
  { id: 'confirm', label: 'ยืนยันแผน', ready: false },
]

/** Step tracker + the one number the player watches: budget. */
export function DecisionHeader() {
  const step = useGameStore((s) => s.ui.step)
  const plan = useGameStore((s) => s.plan)
  const toast = useGameStore((s) => s.toast)
  const used = planCost(plan)
  const pct = Math.min(1, used / QUARTER_BUDGET_MB)
  const over = used > QUARTER_BUDGET_MB
  return (
    <div className="absolute left-7 right-7 top-[100px] h-[56px] flex items-center gap-4 pointer-events-auto anim-rise">
      <div className="glass rounded-full p-1.5 flex items-center gap-1">
        {STEPS.map((s, i) => {
          const active = s.id === step
          return (
            <button
              key={s.id}
              onClick={() => !s.ready && toast(`ขั้น "${s.label}" กำลังสร้าง — Phase 3 ส่วนถัดไป`)}
              className={`flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full text-[15px] font-medium transition-colors ${
                active ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow' : 'text-navy-800/70 hover:bg-brand-50'
              }`}
            >
              <span className={`grid place-items-center size-7 rounded-full text-[13px] font-bold ${active ? 'bg-white text-brand-600' : 'bg-navy-900/8 text-navy-700/70'}`}>
                {s.ready ? i + 1 : <Lock size={13} />}
              </span>
              {s.label}
            </button>
          )
        })}
      </div>
      <div className="ml-auto glass rounded-full h-[52px] pl-2 pr-5 flex items-center gap-3 w-[430px]">
        <span className={`grid place-items-center size-9 rounded-full text-white ${over ? 'bg-alert' : 'bg-gradient-to-b from-gold-300 to-gold-500'}`}>
          {over ? '!' : <Wallet size={18} className="text-navy-900" />}
        </span>
        <div className="flex-1">
          <div className="flex justify-between text-[12.5px] leading-none mb-1.5">
            <span className="text-navy-700/70">งบกลยุทธ์ไตรมาสนี้</span>
            <span className={`font-semibold ${over ? 'text-alert' : 'text-navy-900'}`}>
              {used} / {QUARTER_BUDGET_MB} ล้านบาท
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-navy-900/10 overflow-hidden">
            <div className={`h-full rounded-full transition-[width] duration-500 ease-(--ease-game) ${over ? 'bg-alert' : 'bg-gradient-to-r from-gold-400 to-gold-500'}`} style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
        {!over && used > 0 && <Check size={18} className="text-good" />}
      </div>
    </div>
  )
}
