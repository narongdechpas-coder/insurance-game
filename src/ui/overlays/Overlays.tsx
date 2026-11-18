import { useGameStore } from '../../store/useGameStore'
import { TermPopover } from '../glossary/Term'
import { Stage } from '../Stage'
import { GuideModal } from './GuideModal'
import { RankingModal } from './RankingModal'
import { SettingsModal } from './SettingsModal'

/** Top layer over every in-game screen: the three toolbar dialogs and the glossary popover. */
export function Overlays() {
  const modal = useGameStore((s) => s.ui.modal)
  const term = useGameStore((s) => s.ui.term)
  if (!modal && !term) return null
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <Stage>
        {modal === 'ranking' && <RankingModal />}
        {modal === 'guide' && <GuideModal />}
        {modal === 'settings' && <SettingsModal />}
        <TermPopover />
      </Stage>
    </div>
  )
}
