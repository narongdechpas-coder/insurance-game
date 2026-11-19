import { Check, Lock, Wallet } from 'lucide-react'
import { budgetOf, budgetUsed, unansweredEvents } from '../../game/decisions/plan'
import { useGameStore, type DecisionStep } from '../../store/useGameStore'

const STEPS: { id: DecisionStep; label: string }[] = [
  { id: 'scenario', label: 'รับมือเหตุการณ์' },
  { id: 'strategy', label: 'วางกลยุทธ์' },
  { id: 'confirm', label: 'ยืนยันแผน' },
]

/** Step tracker + the one number the player watches: budget. */
export function DecisionHeader() {
  const step = useGameStore((s) => s.ui.step)
  const plan = useGameStore((s) => s.plan)
  const responses = useGameStore((s) => s.responses)
  const game = useGameStore((s) => s.game)
  const toast = useGameStore((s) => s.toast)
  const setStep = useGameStore((s) => s.setStep)
  const sysOrders = useGameStore((s) => s.sysOrders)
  const used = budgetUsed(game, plan, responses, sysOrders)
  const pending = unansweredEvents(game, responses).length
  const budget = budgetOf(game)
  const pct = Math.min(1, used / budget)
  const over = used > budget
  return (
    <div className="absolute left-7 right-7 top-[100px] h-[56px] flex items-center gap-4 pointer-events-auto anim-rise">
      <div className="glass rounded-full p-1.5 flex items-center gap-1">
        {STEPS.map((s, i) => {
          const active = s.id === step
          const locked = s.id === 'confirm' && pending > 0
          const done = s.id === 'scenario' && pending === 0
          return (
            <button
              key={s.id}
              data-step={s.id}
              onClick={() => (locked ? toast(`ตอบเหตุการณ์ให้ครบก่อน (เหลืออีก ${pending} เรื่อง)`) : setStep(s.id))}
              className={`flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full text-[15px] font-medium transition-colors ${
                active ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow' : 'text-navy-800/70 hover:bg-brand-50'
              }`}
            >
              <span className={`grid place-items-center size-7 rounded-full text-[13px] font-bold ${active ? 'bg-white text-brand-600' : 'bg-navy-900/8 text-navy-700/70'}`}>
                {locked ? <Lock size={13} /> : done && !active ? <Check size={14} strokeWidth={3} className="text-good" /> : i + 1}
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
              {used} / {budget} ล้านบาท
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
