import { Lock } from 'lucide-react'
import { spriteUrl } from '../../assets/registry'
import { CARDS, isUnlocked } from '../../game/decisions/cards'
import { optionOf, tacticOf } from '../../game/decisions/plan'
import { useGameStore } from '../../store/useGameStore'
import { BUILDINGS } from '../../world/layout'

/** The 8 strategy cards; each one lives in a building of the city. */
export function CardList() {
  const q = useGameStore((s) => s.game.quarter.index)
  const plan = useGameStore((s) => s.plan)
  const active = useGameStore((s) => s.ui.activeCard)
  const setActive = useGameStore((s) => s.setActiveCard)
  const toast = useGameStore((s) => s.toast)
  return (
    <nav className="absolute left-7 top-[172px] w-[calc(300px+max(0px,100%-1600px)*0.15)] glass rounded-[24px] p-2.5 flex flex-col gap-1 pointer-events-auto anim-rise" style={{ animationDelay: '0.05s' }}>
      {CARDS.map((c) => {
        const open = isUnlocked(c, q)
        const on = c.id === active
        const changed = plan[c.id].option !== c.defaultOption
        const t = tacticOf(plan, c.id)
        return (
          <button
            key={c.id}
            onClick={() => (open ? setActive(c.id) : toast(`"${c.title}" จะปลดล็อกในไตรมาสที่ ${c.unlockQuarter + 1}`))}
            className={`relative flex items-center gap-3 h-[60px] rounded-2xl pl-1.5 pr-3 text-left transition-all ${
              on ? 'bg-white shadow-[0_6px_16px_-6px_rgba(20,50,110,0.35)] ring-2 ring-brand-500' : open ? 'hover:bg-white/70' : 'opacity-55'
            }`}
          >
            <span className="relative shrink-0 grid place-items-center w-[58px] h-[48px] rounded-xl bg-gradient-to-b from-brand-50 to-brand-100 overflow-hidden">
              <img src={spriteUrl(BUILDINGS[c.location].sprite)} alt="" className={`max-w-[54px] max-h-[44px] object-contain ${open ? '' : 'grayscale'}`} />
              {!open && (
                <span className="absolute inset-0 grid place-items-center bg-navy-900/35 text-white">
                  <Lock size={16} />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-[14.5px] text-navy-900 leading-tight truncate">{c.title}</span>
              <span className={`block text-[12px] leading-tight truncate ${changed ? 'text-brand-600 font-medium' : 'text-navy-700/60'}`}>
                {open ? (t ? `${optionOf(plan, c.id).label} · ${t.label}` : optionOf(plan, c.id).label) : `ปลดล็อกไตรมาส ${c.unlockQuarter + 1}`}
              </span>
            </span>
            {changed && <span className="size-2.5 rounded-full bg-gold-500 ring-2 ring-white" title="ปรับจากเดิมแล้ว" />}
          </button>
        )
      })}
    </nav>
  )
}
