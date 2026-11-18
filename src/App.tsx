import { useGameStore } from './store/useGameStore'
import { CommandCenter } from './ui/CommandCenter'
import { Cover } from './ui/Cover'
import { DecisionRoom } from './ui/decision/DecisionRoom'
import { Intro } from './ui/Intro'
import { GameOver } from './ui/review/GameOver'
import { QuarterlyReview } from './ui/review/QuarterlyReview'
import { WorldView } from './world/WorldView'

/** Screen router. The city is always alive underneath; screens are HUD layers over it. */
export default function App() {
  const screen = useGameStore((s) => s.ui.screen)
  if (screen === 'cover') return <Cover />
  return (
    <>
      <WorldView />
      {/* top shade spans the full window, even outside the 16:9 HUD stage */}
      <div className="fixed inset-x-0 top-0 pointer-events-none" style={{ height: 'calc(min(100vw / 1600, 100vh / 900) * 92px + max(0px, (100vh - 100vw * 9 / 16) / 2))', background: 'linear-gradient(180deg, rgba(8,26,66,0.78) 0%, rgba(8,26,66,0.35) 70%, transparent 100%)' }} />
      {screen === 'command' && <CommandCenter />}
      {screen === 'decision' && <DecisionRoom />}
      {screen === 'review' && <QuarterlyReview />}
      {screen === 'gameover' && <GameOver />}
      <Intro />
    </>
  )
}
