import { BookOpen, Building2, CarFront, ClipboardList, Cog, LineChart, Settings, Target, Trophy, Volume2, VolumeX } from 'lucide-react'
import { brandUrl } from '../assets/registry'
import { useGameStore } from '../store/useGameStore'

const NAV = [
  { id: 'hq', label: 'HQ', icon: Building2, phase: null },
  { id: 'market', label: 'Market', icon: LineChart, phase: null },
  { id: 'product', label: 'Product', icon: CarFront, phase: null },
  { id: 'strategy', label: 'Strategy', icon: Target, phase: null },
  { id: 'operation', label: 'Operation', icon: Cog, phase: null },
  { id: 'report', label: 'Report', icon: ClipboardList, phase: null },
]

export function TopBar() {
  const toast = useGameStore((s) => s.toast)
  const screen = useGameStore((s) => s.ui.screen)
  const open = useGameStore((s) => s.openDecisionRoom)
  const close = useGameStore((s) => s.closeDecisionRoom)
  const openReport = useGameStore((s) => s.openReport)
  const openPage = useGameStore((s) => s.openPage)
  const hasReport = useGameStore((s) => !!s.game.lastReport)
  const openModal = useGameStore((s) => s.openModal)
  const soundOn = useGameStore((s) => s.settings.soundOn)
  const setSound = useGameStore((s) => s.setSound)
  return (
    <header className="absolute inset-x-0 top-0 h-[92px] flex items-center px-7 gap-6 pointer-events-auto">
      <div className="flex items-center gap-3 min-w-[330px]">
        <img src={brandUrl('logo.webp')} alt="Insure Universe" draggable={false} className="h-[84px] w-auto mt-3 drop-shadow-[0_6px_10px_rgba(4,16,48,0.45)]" />
      </div>
      <nav className="flex-1 flex justify-center gap-2.5">
        {NAV.map((n) => {
          const active = (n.id === 'hq' && screen === 'command') || (n.id === 'strategy' && screen === 'decision') || n.id === screen
          const Icon = n.icon
          return (
            <button
              key={n.id}
              onClick={() =>
                n.id === 'hq'
                  ? close()
                  : n.id === 'strategy'
                    ? open()
                    : n.id === 'market' || n.id === 'operation' || n.id === 'product'
                      ? openPage(n.id)
                      : n.id === 'report'
                      ? hasReport
                        ? openReport()
                        : toast('ยังไม่มีรายงาน — ยืนยันแผนไตรมาสแรกก่อนนะคะ')
                      : toast(`${n.label} จะเปิดใช้งานในเวอร์ชันถัดไป`)
              }
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
        <button
          title={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
          aria-label={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
          data-sound-button
          onClick={() => setSound({ soundOn: !soundOn })}
          className={`grid place-items-center size-12 rounded-full glass-dark hover:brightness-125 ${soundOn ? 'text-white' : 'text-white/50'}`}
        >
          {soundOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
        {[
          { icon: Trophy, tip: 'อันดับบริษัท', cls: 'text-gold-400', modal: 'ranking' as const },
          { icon: BookOpen, tip: 'คู่มือ CEO', cls: 'text-white', modal: 'guide' as const },
          { icon: Settings, tip: 'ตั้งค่า', cls: 'text-white', modal: 'settings' as const },
        ].map(({ icon: Icon, tip, cls, modal }) => (
          <button key={tip} title={tip} aria-label={tip} data-open-modal={modal} onClick={() => openModal(modal)} className={`grid place-items-center size-12 rounded-full glass-dark hover:brightness-125 ${cls}`}>
            <Icon size={22} />
          </button>
        ))}
      </div>
    </header>
  )
}
