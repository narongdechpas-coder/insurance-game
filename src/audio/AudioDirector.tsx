import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'
import { play, setSfxVolume, unlockAudio, type SfxId } from './sfx'

/** Which tap sound a button makes, read from what the button is (no per-button wiring needed). */
const TAP_RULES: [string, SfxId | 'none'][] = [
  ['[data-sfx="none"]', 'none'],
  ['[data-option],[data-tactic],[data-response],[data-system-order],[data-focus]', 'select'],
  ['[data-staff-plus],[data-staff-minus],[data-seg-step],[data-lever],input[type="range"]', 'adjust'],
]

const EVENT_SOUND: Record<string, SfxId> = { opportunity: 'eventChance', threat: 'eventThreat', competitor: 'eventRival' }

/**
 * Plays the game's sound effects: taps on buttons, and the big moments read from the store
 * (plan confirmed, quarter starts, newspaper, events, rank, systems, end of game, panels).
 * Renders nothing.
 */
export function AudioDirector() {
  const soundOn = useGameStore((s) => s.settings.soundOn)
  const sfxVolume = useGameStore((s) => s.settings.sfxVolume)

  useEffect(() => setSfxVolume(sfxVolume, soundOn), [soundOn, sfxVolume])

  // taps: the first tap also unlocks audio (browsers block sound until the player touches the page)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      unlockAudio()
      const el = e.target as Element | null
      if (el?.closest?.('button:disabled')) play('denied')
    }
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('button, [role="tab"]')
      if (!el || (el as HTMLButtonElement).disabled) return
      for (const [sel, id] of TAP_RULES) if (el.matches(sel) || el.closest(sel)) return id === 'none' ? undefined : play(id)
      play('tick')
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  // the big moments, read from state changes
  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        const a = s.ui
        const b = prev.ui
        if (a.screen !== b.screen) {
          if ((a.screen === 'running' || a.screen === 'simulating') && b.screen === 'decision') {
            play('confirm')
            if (a.screen === 'running') setTimeout(() => play('start'), 650)
          }
          if (a.screen === 'review' && !a.reviewOnly) {
            play('newspaper')
            const r = s.game.lastReport
            const before = prev.game.sim.log.length >= 2 ? prev.game.lastReport?.rank : undefined
            setTimeout(() => {
              if (r && before !== undefined && r.rank !== before) play(r.rank < before ? 'rankUp' : 'rankDown')
              const news = r?.ops?.systems?.news ?? []
              if (news.some((n) => n.kind === 'live')) play('systemLive')
              else if (news.some((n) => n.kind === 'delayed' || n.kind === 'partial')) play('systemDelayed')
            }, 900)
          }
          if (a.screen === 'gameover') {
            const o = s.game.outcome
            play(o?.reason === 'bankrupt' ? 'bankrupt' : o?.playerRank === 1 ? 'win' : 'finish')
          }
          // a new quarter opens: the season and the first event set the tone
          if (a.screen === 'command' && b.screen === 'review' && !b.reviewOnly) {
            const evs = s.game.events
            if (evs.some((e) => e.id === 'renewal-season')) play('renewal')
            const first = evs.find((e) => e.id !== 'renewal-season')
            if (first) setTimeout(() => play(EVENT_SOUND[first.kind] ?? 'eventChance'), 350)
          }
        }
        if (a.modal !== b.modal) play(a.modal ? 'open' : 'close')
        if (a.selected !== b.selected && a.screen === 'command') play(a.selected ? 'open' : 'close')
      }),
    [],
  )
  return null
}
