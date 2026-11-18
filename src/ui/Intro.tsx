import { useGameStore } from '../store/useGameStore'

/** Opening wash: the world fades up from light while the camera flies in. */
export function Intro() {
  const done = useGameStore((s) => s.ui.introDone)
  return (
    <div
      className="fixed inset-0 pointer-events-none transition-opacity duration-[1200ms]"
      style={{ opacity: done ? 0 : 1, background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.7), rgba(214,232,250,0.95))' }}
    />
  )
}
