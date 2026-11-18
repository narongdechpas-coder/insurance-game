import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { Stage } from '../Stage'
import { TopBar } from '../TopBar'

/** Shared frame for the information pages (Market, Operation): city blurred behind, top bar on. */
export function PageShell({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  const close = useGameStore((s) => s.closeReport)
  return (
    <>
      <div className="fixed inset-0" style={{ backdropFilter: 'blur(7px) saturate(0.8)', background: 'rgba(7,21,55,0.5)' }} />
      <Stage>
        <TopBar />
        <section data-screen={id} className="absolute left-1/2 -translate-x-1/2 w-[75%] min-w-[1180px] top-[100px] bottom-6 glass rounded-[30px] pointer-events-auto anim-rise flex flex-col overflow-hidden">
          <header className="flex items-end gap-4 px-8 pt-5 pb-3">
            <div>
              <div className="text-[13px] text-brand-600 font-medium">{kicker}</div>
              <h1 className="font-display font-bold text-[26px] leading-tight text-navy-900">{title}</h1>
            </div>
            <button onClick={close} className="ml-auto inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/85 text-navy-800 text-[14px] font-medium hover:bg-white">
              <ArrowLeft size={17} /> กลับ Command Center
            </button>
          </header>
          <div className="flex-1 min-h-0 px-8 pb-6 overflow-auto">{children}</div>
        </section>
      </Stage>
    </>
  )
}
