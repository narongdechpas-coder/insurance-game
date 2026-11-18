import { create } from 'zustand'
import { DEFAULT_CONFIG } from '../game/config'
import { createInitialState } from '../game/initialState'
import { CARD_BY_ID, CARDS, choiceFor, defaultPlan, isUnlocked } from '../game/decisions/cards'
import type { DecisionId, QuarterPlan } from '../game/decisions/types'
import type { Difficulty, GameLength, GameState, LocationId } from '../game/types'

export type Screen = 'cover' | 'command' | 'decision'
export type DecisionStep = 'scenario' | 'strategy' | 'confirm'

interface Toast {
  id: number
  text: string
}

interface UiState {
  hovered: LocationId | null
  selected: LocationId | null
  highlightedEvent: string | null
  introDone: boolean
  toasts: Toast[]
  screen: Screen
  step: DecisionStep
  activeCard: DecisionId
}

interface Store {
  game: GameState
  ui: UiState
  /** Draft plan for the current quarter (committed to the engine in Phase 4). */
  plan: QuarterPlan
  startGame: (opts: { quarters: GameLength; difficulty: Difficulty }) => void
  openDecisionRoom: (card?: DecisionId) => void
  closeDecisionRoom: () => void
  setActiveCard: (id: DecisionId) => void
  choose: (card: DecisionId, option: string) => void
  chooseTactic: (card: DecisionId, tactic: string) => void
  resetPlan: () => void
  hover: (id: LocationId | null) => void
  select: (id: LocationId | null) => void
  focusEvent: (eventId: string | null) => void
  finishIntro: () => void
  toast: (text: string) => void
}

let toastId = 0

export const useGameStore = create<Store>((set, get) => ({
  game: createInitialState(DEFAULT_CONFIG),
  ui: { hovered: null, selected: null, highlightedEvent: null, introDone: false, toasts: [], screen: 'cover', step: 'strategy', activeCard: 'pricing' },
  plan: defaultPlan(),

  startGame: ({ quarters, difficulty }) =>
    set((s) => ({
      game: createInitialState({ ...DEFAULT_CONFIG, quarters, difficulty }),
      plan: defaultPlan(),
      ui: { ...s.ui, screen: 'command', introDone: false, selected: null, hovered: null, highlightedEvent: null },
    })),

  openDecisionRoom: (card) =>
    set((s) => {
      const q = s.game.quarter.index
      const first = CARDS.find((c) => isUnlocked(c, q))!.id
      const target = card && isUnlocked(CARDS.find((c) => c.id === card)!, q) ? card : first
      return { ui: { ...s.ui, screen: 'decision', step: 'strategy', activeCard: target, selected: null, hovered: null } }
    }),
  closeDecisionRoom: () => set((s) => ({ ui: { ...s.ui, screen: 'command' } })),
  setActiveCard: (id) => set((s) => ({ ui: { ...s.ui, activeCard: id } })),
  choose: (card, option) =>
    set((s) => {
      if (s.plan[card].option === option) return s // re-clicking keeps the tactic the player picked
      const o = CARD_BY_ID[card].options.find((x) => x.id === option)!
      return { plan: { ...s.plan, [card]: choiceFor(o) } }
    }),
  chooseTactic: (card, tactic) => set((s) => ({ plan: { ...s.plan, [card]: { ...s.plan[card], tactic } } })),
  resetPlan: () => set({ plan: defaultPlan() }),

  hover: (id) => set((s) => (s.ui.hovered === id ? s : { ui: { ...s.ui, hovered: id } })),
  select: (id) => set((s) => ({ ui: { ...s.ui, selected: id, highlightedEvent: id ? s.ui.highlightedEvent : null } })),
  focusEvent: (eventId) => {
    const ev = get().game.events.find((e) => e.id === eventId)
    set((s) => ({ ui: { ...s.ui, highlightedEvent: eventId, selected: ev ? ev.locations[0] : s.ui.selected } }))
  },
  finishIntro: () => set((s) => ({ ui: { ...s.ui, introDone: true } })),
  toast: (text) => {
    const id = ++toastId
    set((s) => ({ ui: { ...s.ui, toasts: [...s.ui.toasts, { id, text }] } }))
    setTimeout(() => set((s) => ({ ui: { ...s.ui, toasts: s.ui.toasts.filter((t) => t.id !== id) } })), 2600)
  },
}))
