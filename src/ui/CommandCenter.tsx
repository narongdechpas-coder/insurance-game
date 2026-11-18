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
