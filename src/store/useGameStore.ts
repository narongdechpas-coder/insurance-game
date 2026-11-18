import { create } from 'zustand'
import { DEFAULT_CONFIG } from '../game/config'
import { createInitialState } from '../game/initialState'
import { CARD_BY_ID, CARDS, choiceFor, defaultPlan, isUnlocked } from '../game/decisions/cards'
import { scenariosFor, type Responses } from '../game/decisions/scenarios'
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
  activeEvent: string | null
  /** The plan was confirmed in step 3 and is waiting for the Phase 4 simulation. */
  planConfirmed: boolean
}

interface Store {
  game: GameState
  ui: UiState
  /** Draft plan for the current quarter (committed to the engine in Phase 4). */
  plan: QuarterPlan
  /** Step 1 answers: eventId → response id. */
  responses: Responses
  startGame: (opts: { quarters: GameLength; difficulty: Difficulty; companyName: string; playerName: string }) => void
  openDecisionRoom: (target?: DecisionId | DecisionStep) => void
  setStep: (step: DecisionStep) => void
  setActiveEvent: (eventId: string) => void
  respond: (eventId: string, responseId: string) => void
  confirmPlan: () => void
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
  ui: { hovered: null, selected: null, highlightedEvent: null, introDone: false, toasts: [], screen: 'cover', step: 'scenario', activeCard: 'pricing', activeEvent: null, planConfirmed: false },
  plan: defaultPlan(),
  responses: {},

  startGame: ({ quarters, difficulty, companyName, playerName }) =>
    set((s) => ({
      game: createInitialState({ ...DEFAULT_CONFIG, quarters, difficulty, companyName, playerName }),
      plan: defaultPlan(),
      responses: {},
      ui: { ...s.ui, planConfirmed: false, screen: 'command', introDone: false, selected: null, hovered: null, highlightedEvent: null },
    })),

  openDecisionRoom: (target) =>
    set((s) => {
      const q = s.game.quarter.index
      const first = CARDS.find((c) => isUnlocked(c, q))!.id
      const card = CARDS.find((c) => c.id === target)
      const isStep = target === 'scenario' || target === 'strategy' || target === 'confirm'
      // a building's card → strategy; otherwise start at step 1 (events come first)
      const step: DecisionStep = card ? 'strategy' : isStep ? (target as DecisionStep) : 'scenario'
      const activeCard = card && isUnlocked(card, q) ? card.id : s.ui.activeCard && isUnlocked(CARDS.find((c) => c.id === s.ui.activeCard)!, q) ? s.ui.activeCard : first
      const activeEvent = s.ui.activeEvent ?? scenariosFor(s.game.events.map((e) => e.id))[0]?.eventId ?? null
      return { ui: { ...s.ui, screen: 'decision', step, activeCard, activeEvent, selected: null, hovered: null } }
    }),
  setStep: (step) => set((s) => ({ ui: { ...s.ui, step } })),
  setActiveEvent: (eventId) => set((s) => ({ ui: { ...s.ui, activeEvent: eventId } })),
  respond: (eventId, responseId) => set((s) => ({ responses: { ...s.responses, [eventId]: responseId }, ui: { ...s.ui, planConfirmed: false } })),
  confirmPlan: () => set((s) => ({ ui: { ...s.ui, planConfirmed: true, screen: 'command' } })),
  closeDecisionRoom: () => set((s) => ({ ui: { ...s.ui, screen: 'command' } })),
  setActiveCard: (id) => set((s) => ({ ui: { ...s.ui, activeCard: id } })),
  choose: (card, option) =>
    set((s) => {
      if (s.plan[card].option === option) return s // re-clicking keeps the tactic the player picked
      const o = CARD_BY_ID[card].options.find((x) => x.id === option)!
      return { plan: { ...s.plan, [card]: choiceFor(o) }, ui: { ...s.ui, planConfirmed: false } }
    }),
  chooseTactic: (card, tactic) => set((s) => ({ plan: { ...s.plan, [card]: { ...s.plan[card], tactic } }, ui: { ...s.ui, planConfirmed: false } })),
  resetPlan: () => set((s) => ({ plan: defaultPlan(), ui: { ...s.ui, planConfirmed: false } })),

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
