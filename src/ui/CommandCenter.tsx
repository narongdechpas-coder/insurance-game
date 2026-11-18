import { useGameStore } from '../store/useGameStore'
import { AdvisorPanel } from './AdvisorPanel'
import { EventStrip } from './EventStrip'
import { KpiPanel } from './KpiPanel'
import { LocationPanel } from './LocationPanel'
import { NextButton } from './NextButton'
import { QuarterBadge } from './QuarterBadge'
import { Stage } from './Stage'
import { Toasts } from './Toasts'
import { TopBar } from './TopBar'

/** Screen A — HUD over the CEO's living company (the world itself is rendered by App). */
export function CommandCenter() {
  const selected = useGameStore((s) => s.ui.selected)
  return (
    <>
      <Stage>
        <TopBar />
        <QuarterBadge />
        {selected ? <LocationPanel /> : <KpiPanel />}
        <AdvisorPanel />
        <EventStrip />
        <NextButton />
        <Toasts />
      </Stage>
    </>
  )
}
