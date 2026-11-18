import { useGameStore } from '../store/useGameStore'
import { WorldView } from '../world/WorldView'
import { AdvisorPanel } from './AdvisorPanel'
import { EventStrip } from './EventStrip'
import { Intro } from './Intro'
import { KpiPanel } from './KpiPanel'
import { LocationPanel } from './LocationPanel'
import { NextButton } from './NextButton'
import { QuarterBadge } from './QuarterBadge'
import { Stage } from './Stage'
import { Toasts } from './Toasts'
import { TopBar } from './TopBar'

/** Screen A — the CEO's living company. */
export function CommandCenter() {
  const selected = useGameStore((s) => s.ui.selected)
  return (
    <>
      <WorldView />
      {/* top shade spans the full window, even outside the 16:9 HUD stage */}
      <div className="fixed inset-x-0 top-0 pointer-events-none" style={{ height: 'calc(min(100vw / 1600, 100vh / 900) * 92px + max(0px, (100vh - 100vw * 9 / 16) / 2))', background: 'linear-gradient(180deg, rgba(8,26,66,0.78) 0%, rgba(8,26,66,0.35) 70%, transparent 100%)' }} />
      <Stage>
        <TopBar />
        <QuarterBadge />
        {selected ? <LocationPanel /> : <KpiPanel />}
        <AdvisorPanel />
        <EventStrip />
        <NextButton />
        <Toasts />
      </Stage>
      <Intro />
    </>
  )
}
