import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useGameStore } from '../../store/useGameStore'

/** Centred dialog over a dimmed backdrop; Escape or a click outside closes it. */
export function ModalShell({ id, title, kicker, width = 900, children }: { id: string; title: string; kicker?: string; width?: number; children: ReactNode }) {
  const close = useGameStore((s) => s.openModal)
  const termOpen = useGameStore((s) => !!s.ui.term)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !termOpen && close(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, termOpen])
  return (
    <div className="absolute inset-0 grid place-items-center pointer-events-auto" style={{ background: 'rgba(6,18,46,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => close(null)}>
      <section
        role="dialog"
        aria-label={title}
        data-modal={id}
        className="relative glass rounded-[30px] px-8 pt-6 pb-7 max-h-[780px] flex flex-col anim-rise"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => close(null)} aria-label="ปิด" className="absolute top-5 right-5 grid place-items-center size-9 rounded-full bg-white/90 text-navy-800 hover:bg-white shadow">
          <X size={18} />
        </button>
        {kicker && <div className="text-[13px] text-brand-600 font-medium">{kicker}</div>}
        <h2 className="font-display font-bold text-[26px] text-navy-900 leading-tight pr-12">{title}</h2>
        <div className="mt-4 min-h-0 overflow-y-auto pr-1">{children}</div>
      </section>
    </div>
  )
}
