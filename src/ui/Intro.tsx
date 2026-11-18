import { useGameStore } from '../store/useGameStore'

/** Opening wash: the world fades up from light while the camera flies in. */
export function Intro() {
  const done = useGameStore((s) => s.ui.introDone)
  return (
    <div
      className="fixed inset-0 grid place-items-center pointer-events-none transition-opacity duration-[1200ms]"
      style={{ opacity: done ? 0 : 1, background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.75), rgba(214,232,250,0.95))' }}
    >
      <div className="text-center" style={{ opacity: done ? 0 : 1, transition: 'opacity 0.6s' }}>
        <div className="font-display font-bold text-[56px] text-navy-900 tracking-tight">Decision Master</div>
        <div className="text-navy-700/80 text-[18px]">CEO Command Center</div>
      </div>
    </div>
  )
}
