import { Lock } from 'lucide-react'
import { spriteUrl } from '../../assets/registry'
import { CARDS, isUnlocked } from '../../game/decisions/cards'
import { useMemo } from 'react'
import { changedCards, keptPlan, optionOf, tacticOf } from '../../game/decisions/plan'
import { staffOf } from '../../game/forecast'
import { TEAMS } from '../../game/sim/ops'
import { settingsOf } from '../../game/forecast'
import { useGameStore } from '../../store/useGameStore'
import { channelsChanged, channelSummary } from './ChannelStage'
import { priceSummary } from './PricingStage'
import { stepsChanged } from '../../game/forecast'
import { BUILDINGS } from '../../world/layout'

const STAFF_ROW = { id: 'staff' } as unknown as (typeof CARDS)[number]

/** The 8 strategy cards (each lives in a building of the city) plus the team screen. */
export function CardList() {
  const q = useGameStore((s) => s.game.quarter.index)
  const plan = useGameStore((s) => s.plan)
  const active = useGameStore((s) => s.ui.activeCard)
  const setActive = useGameStore((s) => s.setActiveCard)
  const toast = useGameStore((s) => s.toast)
  const channels = useGameStore((s) => s.channels)
  const segSteps = useGameStore((s) => s.segSteps)
  const game = useGameStore((s) => s.game)
  const staff = useGameStore((s) => s.staff)
  const sysOrders = useGameStore((s) => s.sysOrders)
  const kept = useMemo(() => keptPlan(game), [game])
  return (
    <nav className="absolute left-7 top-[172px] w-[calc(300px+max(0px,100%-1600px)*0.15)] glass rounded-[24px] p-2.5 flex flex-col gap-1 pointer-events-auto anim-rise" style={{ animationDelay: '0.05s' }}>
      {CARDS.flatMap((c) => (c.id === 'distribution' ? [c, STAFF_ROW] : [c])).map((c) => {
        if (c === STAFF_ROW) {
          const on = active === 'staff'
          const now = staffOf(game)
          const changed = TEAMS.some((t) => (staff[t] ?? now[t]) !== now[t]) || sysOrders.length > 0
          return (
            <button key="staff" data-card="staff" onClick={() => setActive('staff')} className={`relative flex items-center gap-3 h-[56px] rounded-2xl pl-1.5 pr-3 text-left transition-all ${on ? 'bg-white shadow-[0_6px_16px_-6px_rgba(20,50,110,0.35)] ring-2 ring-brand-500' : 'hover:bg-white/70'}`}>
              <span className="relative shrink-0 grid place-items-center w-[58px] h-[46px] rounded-xl bg-gradient-to-b from-brand-50 to-brand-100 overflow-hidden">
                <img src={spriteUrl(BUILDINGS.claims.sprite)} alt="" className="max-w-[54px] max-h-[42px] object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[14.5px] text-navy-900 leading-tight truncate">ทีมงานและระบบ</span>
                <span className={`block text-[12px] leading-tight truncate ${changed ? 'text-brand-600 font-medium' : 'text-navy-700/60'}`}>
                  สินไหม {staff.claims ?? now.claims} คน · Call center {staff.contact ?? now.contact} คน
                </span>
              </span>
              {changed && <span className="size-2.5 rounded-full bg-gold-500 ring-2 ring-white" title="ปรับจากเดิมแล้ว" />}
            </button>
          )
        }
        const open = isUnlocked(c, q)
        const on = c.id === active
        const isCh = c.id === 'distribution'
        const isPr = c.id === 'pricing'
        const changed = isCh ? channelsChanged(channels, settingsOf(game)) : isPr ? stepsChanged(segSteps) : changedCards(plan, kept).includes(c.id)
        const t = tacticOf(plan, c.id)
        return (
          <button
            key={c.id}
            onClick={() => (open ? setActive(c.id) : toast(`"${c.title}" จะปลดล็อกในไตรมาสที่ ${c.unlockQuarter + 1}`))}
            className={`relative flex items-center gap-3 h-[56px] rounded-2xl pl-1.5 pr-3 text-left transition-all ${
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
                {open ? (isCh ? channelSummary(channels) : isPr ? priceSummary(segSteps) : t ? `${optionOf(plan, c.id).label} · ${t.label}` : optionOf(plan, c.id).label) : `ปลดล็อกไตรมาส ${c.unlockQuarter + 1}`}
              </span>
            </span>
            {changed && <span className="size-2.5 rounded-full bg-gold-500 ring-2 ring-white" title="ปรับจากเดิมแล้ว" />}
          </button>
        )
      })}
    </nav>
  )
}
