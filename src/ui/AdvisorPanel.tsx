import { ChevronRight, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { moodOfStatus, portraitKey } from '../assets/portraits'
import { spriteUrl } from '../assets/registry'
import { ADVISOR_NAME, locationComment, quarterBriefing } from '../game/narrative/advisor'
import { locationStatus } from '../game/selectors'
import { useGameStore } from '../store/useGameStore'

function useTypewriter(text: string, speed = 22) {
  // progress is stored per text, so a new message restarts without a reset effect
  const [state, setState] = useState({ text, n: 0 })
  const n = state.text === text ? state.n : 0
  useEffect(() => {
    const id = setInterval(
      () => setState((s) => (s.text !== text ? { text, n: 1 } : s.n >= text.length ? (clearInterval(id), s) : { text, n: s.n + 1 })),
      speed,
    )
    return () => clearInterval(id)
  }, [text, speed])
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setState({ text, n: text.length }) }
}

/** AI Business Advisor — briefs the CEO and reacts to what they look at. */
export function AdvisorPanel() {
  const game = useGameStore((s) => s.game)
  const selected = useGameStore((s) => s.ui.selected)
  const introDone = useGameStore((s) => s.ui.introDone)
  const briefing = useMemo(() => quarterBriefing(game), [game])
  const [i, setI] = useState(0)
  const text = selected ? locationComment(game, selected) : briefing[i % briefing.length]
  const { shown, done, skip } = useTypewriter(introDone ? text : '')
  // pose follows the mood of what she is talking about
  const mood = selected ? locationStatus(game, selected) : 'good'
  const pose = mood === 'alert' || mood === 'watch' ? 'characters/advisor-warning' : mood === 'chance' ? 'characters/advisor-happy' : 'characters/advisor'
  // a half portrait replaces the full body once that art exists
  const bust = portraitKey('advisor', mood === 'watch' ? 'shocked' : moodOfStatus(mood))

  return (
    <div className="absolute left-4 bottom-3 flex items-end pointer-events-auto">
      {bust ? (
        <img
          key={bust}
          src={spriteUrl(bust)}
          alt={ADVISOR_NAME}
          draggable={false}
          data-portrait={bust}
          className="relative z-10 -mb-3 h-[230px] w-[200px] object-contain object-bottom drop-shadow-[0_14px_20px_rgba(8,26,66,0.45)] anim-rise"
        />
      ) : (
        <img
          key={pose}
          src={spriteUrl(pose)}
          alt={ADVISOR_NAME}
          draggable={false}
          className="relative z-10 h-[300px] w-[150px] object-contain object-bottom drop-shadow-[0_14px_20px_rgba(8,26,66,0.45)] anim-rise"
        />
      )}
      <button
        onClick={() => (done ? !selected && setI((v) => v + 1) : skip())}
        className="relative -ml-6 mb-6 w-[372px] min-h-[132px] text-left glass rounded-[26px] pl-8 pr-5 pt-3 pb-4 anim-rise"
        style={{ animationDelay: '0.2s' }}
      >
        <span className="absolute -left-2 bottom-10 size-5 rotate-45 bg-white" />
        <div className="flex items-center gap-2 font-display font-semibold text-brand-600 text-[17px]">
          <span className="grid place-items-center size-7 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-white">
            <Sparkles size={15} />
          </span>
          AI Business Advisor
          <span className="text-[12px] font-normal text-navy-700/60">· {ADVISOR_NAME}</span>
        </div>
        <p className="mt-1.5 text-[16.5px] leading-[1.55] text-navy-900 min-h-[52px]">
          {shown}
          {!done && <span className="inline-block w-[2px] h-[18px] bg-brand-500 align-middle ml-0.5 animate-pulse" />}
        </p>
        {done && !selected && (
          <span className="absolute right-4 bottom-2 flex items-center text-[12px] text-brand-600/80">
            ถัดไป <ChevronRight size={14} />
          </span>
        )}
      </button>
    </div>
  )
}
