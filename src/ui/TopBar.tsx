import { BookOpen, Building2, ClipboardList, Cog, LineChart, Settings, Target, Trophy } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'

const NAV = [
  { id: 'hq', label: 'HQ', icon: Building2, phase: null },
  { id: 'market', label: 'Market', icon: LineChart, phase: 'Phase 3' },
  { id: 'strategy', label: 'Strategy', icon: Target, phase: 'Phase 3' },
  { id: 'operation', label: 'Operation', icon: Cog, phase: 'Phase 3' },
  { id: 'report', label: 'Report', icon: ClipboardList, phase: 'Phase 4' },
]

export function TopBar() {
  const toast = useGameStore((s) => s.toast)
  return (
    <header className="absolute inset-x-0 top-0 h-[92px] flex items-center px-7 gap-6 pointer-events-auto">
      <div className="flex items-center gap-3 min-w-[330px]">
        <svg width="54" height="40" viewBox="0 0 54 40" fill="none" aria-hidden>
          <path d="M3 28 C14 10, 34 4, 51 8 C36 9, 24 15, 16 26 Z" fill="#fff" opacity="0.95" />
          <path d="M9 33 C20 20, 36 15, 50 16 C38 19, 28 24, 21 32 Z" fill="#8cc2ff" />
        </svg>
        <div className="leading-none">
          <div className="text-white font-display font-bold text-[30px] tracking-tight drop-shadow">Decision Master</div>
          <div className="text-brand-100/90 text-[13px] mt-1 tracking-wide">Insurance Business Simulation</div>
        </div>
      </div>
      <nav className="flex-1 flex justify-center gap-2.5">
        {NAV.map((n) => {
          const active = n.id === 'hq'
          const Icon = n.icon
          return (
            <button
              key={n.id}
              onClick={() => n.phase && toast(`${n.label} จะเปิดใช้งานใน ${n.phase}`)}
              className={`flex items-center gap-2 h-11 px-6 rounded-full font-medium text-[16px] transition-all ${
                active
                  ? 'text-white bg-gradient-to-b from-brand-400 to-brand-600 border-2 border-white/90 shadow-[0_6px_18px_-4px_rgba(47,123,255,0.8)]'
                  : 'text-white/90 glass-dark hover:brightness-125'
              }`}
            >
              <Icon size={19} />
              {n.label}
            </button>
          )
        })}
      </nav>
      <div className="flex gap-3 min-w-[330px] justify-end">
        {[
          { icon: Trophy, tip: 'อันดับบริษัท', cls: 'text-gold-400' },
          { icon: BookOpen, tip: 'คู่มือ CEO', cls: 'text-white' },
          { icon: Settings, tip: 'ตั้งค่า', cls: 'text-white' },
        ].map(({ icon: Icon, tip, cls }) => (
          <button key={tip} title={tip} onClick={() => toast(`${tip} — กำลังพัฒนา`)} className={`grid place-items-center size-12 rounded-full glass-dark hover:brightness-125 ${cls}`}>
            <Icon size={22} />
          </button>
        ))}
      </div>
    </header>
  )
}
