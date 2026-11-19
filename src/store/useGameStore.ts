import { create } from 'zustand'
import { DEFAULT_CONFIG } from '../game/config'
import { createInitialState } from '../game/initialState'
import { CARD_BY_ID, CARDS, choiceFor, defaultPlan, isUnlocked } from '../game/decisions/cards'
import { scenariosFor, type Responses } from '../game/decisions/scenarios'
import type { DecisionId, QuarterPlan } from '../game/decisions/types'
import { keepPrices, settingsOf, withChannelSettings, type ChannelSettings, type SegmentSteps } from '../game/forecast'
import type { ChannelId } from '../game/sim/channels'
import { simulateQuarter } from '../game/sim/engine'
import type { SegmentId } from '../game/sim/v2'
import type { Difficulty, GameLength, GameState, LocationId } from '../game/types'
import { clearSave, readSave, readSettings, writeSave, writeSettings, type Settings } from './save'

export type Screen = 'cover' | 'command' | 'decision' | 'running' | 'simulating' | 'review' | 'gameover' | 'market' | 'operation' | 'product'
export type DecisionStep = 'scenario' | 'strategy' | 'confirm'
export type Modal = 'ranking' | 'guide' | 'settings'
/** An open glossary popover: the term and where its "?" sits, in stage coordinates. */
export interface TermPopover {
  id: string
  x: number
  y: number
}

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
  /** Review opened from the Report tab: closing it returns to the current quarter instead of advancing. */
  reviewOnly: boolean
  /** Date.now() when the city-run animation started */
  runStart: number
  modal: Modal | null
  term: TermPopover | null
}

interface Store {
  game: GameState
  ui: UiState
  /** Draft plan for the current quarter (committed to the engine in Phase 4). */
  plan: QuarterPlan
  /** Step 1 answers: eventId → response id. */
  responses: Responses
  /** Channel sliders and segment focus being set this quarter (kept across quarters once confirmed). */
  channels: ChannelSettings
  /** Price move per vehicle segment this quarter (step index, 2 = keep); resets every quarter. */
  segSteps: SegmentSteps
  settings: Settings
  startGame: (opts: { quarters: GameLength; difficulty: Difficulty; companyName: string; playerName: string }) => void
  openDecisionRoom: (target?: DecisionId | DecisionStep) => void
  setStep: (step: DecisionStep) => void
  setActiveEvent: (eventId: string) => void
  respond: (eventId: string, responseId: string) => void
  confirmPlan: () => void
  /** Leave the Quarterly Review: next quarter's briefing, or the final standings. */
  nextQuarter: () => void
  restart: () => void
  openReport: () => void
  /** The city-run animation finished (or was skipped): show the newspaper. */
  finishRun: () => void
  /** Market / Operation information pages (read-only, return to the Command Center). */
  openPage: (page: 'market' | 'operation' | 'product') => void
  /** The analysis animation finished (or was skipped): show the Quarterly Review. */
  finishSimulation: () => void
  closeReport: () => void
  closeDecisionRoom: () => void
  setActiveCard: (id: DecisionId) => void
  choose: (card: DecisionId, option: string) => void
  chooseTactic: (card: DecisionId, tactic: string) => void
  resetPlan: () => void
  setLever: (c: ChannelId, lever: number) => void
  setFocus: (c: ChannelId, focus: SegmentId | null) => void
  setSegStep: (k: SegmentId, step: number) => void
  hover: (id: LocationId | null) => void
  select: (id: LocationId | null) => void
  focusEvent: (eventId: string | null) => void
  finishIntro: () => void
  toast: (text: string) => void
  /** Load the autosave (last finished quarter) and go to the Command Center. */
  continueGame: () => void
  openModal: (m: Modal | null) => void
  showTerm: (t: TermPopover | null) => void
  setRunSpeed: (v: Settings['runSpeed']) => void
  setCityStyle: (v: Settings['cityStyle']) => void
  /** Back to the cover; the game stays saved and can be continued. */
  toCover: () => void
  deleteSave: () => void
}

let toastId = 0

const initialGame = createInitialState(DEFAULT_CONFIG)

export const useGameStore = create<Store>((set, get) => ({
  game: initialGame,
  channels: settingsOf(initialGame),
  segSteps: keepPrices(),
  ui: { hovered: null, selected: null, highlightedEvent: null, introDone: false, toasts: [], screen: 'cover', step: 'scenario', activeCard: 'pricing', activeEvent: null, reviewOnly: false, runStart: 0, modal: null, term: null },
  plan: defaultPlan(),
  responses: {},
  settings: readSettings(),

  startGame: ({ quarters, difficulty, companyName, playerName }) => {
    const game = createInitialState({ ...DEFAULT_CONFIG, quarters, difficulty, companyName, playerName })
    writeSave(game)
    set((s) => ({
      game,
      plan: defaultPlan(),
      responses: {},
      channels: settingsOf(game),
      segSteps: keepPrices(),
      ui: { ...s.ui, screen: 'command', introDone: false, selected: null, hovered: null, highlightedEvent: null, modal: null, term: null },
    }))
  },
  continueGame: () => {
    const save = readSave()
    if (!save) return
    set((s) => ({
      game: save.game,
      plan: defaultPlan(),
      responses: {},
      channels: settingsOf(save.game),
      segSteps: keepPrices(),
      ui: { ...s.ui, screen: 'command', step: 'scenario', activeEvent: null, introDone: false, selected: null, hovered: null, highlightedEvent: null, modal: null, term: null },
    }))
  },
  openModal: (m) => set((s) => ({ ui: { ...s.ui, modal: m, term: null } })),
  showTerm: (t) => set((s) => ({ ui: { ...s.ui, term: t } })),
  setRunSpeed: (runSpeed) => {
    const settings = { ...get().settings, runSpeed }
    writeSettings(settings)
    set({ settings })
  },
  setCityStyle: (cityStyle) => {
    const settings = { ...get().settings, cityStyle }
    writeSettings(settings)
    set({ settings })
  },
  toCover: () => set((s) => ({ plan: defaultPlan(), responses: {}, ui: { ...s.ui, screen: 'cover', modal: null, term: null, activeEvent: null } })),
  deleteSave: () => {
    clearSave()
    set((s) => ({ plan: defaultPlan(), responses: {}, ui: { ...s.ui, screen: 'cover', modal: null, term: null, activeEvent: null } }))
  },

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
  respond: (eventId, responseId) => set((s) => ({ responses: { ...s.responses, [eventId]: responseId } })),
  confirmPlan: () => {
    const s = get()
    const game = simulateQuarter(withChannelSettings(s.game, s.channels, s.segSteps), s.plan, s.responses)
    if (game.outcome) clearSave()
    else writeSave(game)
    set({
      game,
      ui: { ...s.ui, reviewOnly: false, screen: s.settings.runSpeed === 0 ? 'simulating' : 'running', runStart: Date.now(), selected: null, hovered: null, highlightedEvent: null },
    })
  },
  nextQuarter: () =>
    set((s) => ({
      plan: defaultPlan(),
      responses: {},
      channels: settingsOf(s.game),
      segSteps: keepPrices(),
      ui: { ...s.ui, screen: s.game.outcome ? 'gameover' : 'command', step: 'scenario', activeEvent: null },
    })),
  finishSimulation: () => set((s) => (s.ui.screen === 'simulating' ? { ui: { ...s.ui, screen: 'review' } } : s)),
  finishRun: () => set((s) => (s.ui.screen === 'running' ? { ui: { ...s.ui, screen: 'simulating' } } : s)),
  openPage: (page) => set((s) => ({ ui: { ...s.ui, screen: page, selected: null, hovered: null } })),
  openReport: () => set((s) => (s.game.lastReport ? { ui: { ...s.ui, screen: 'review', reviewOnly: true, selected: null } } : s)),
  closeReport: () => set((s) => ({ ui: { ...s.ui, screen: 'command', reviewOnly: false } })),
  restart: () => set((s) => ({ plan: defaultPlan(), responses: {}, ui: { ...s.ui, screen: 'cover', activeEvent: null } })),
  closeDecisionRoom: () => set((s) => ({ ui: { ...s.ui, screen: 'command' } })),
  setActiveCard: (id) => set((s) => ({ ui: { ...s.ui, activeCard: id } })),
  choose: (card, option) =>
    set((s) => {
      if (s.plan[card].option === option) return s // re-clicking keeps the tactic the player picked
      const o = CARD_BY_ID[card].options.find((x) => x.id === option)!
      return { plan: { ...s.plan, [card]: choiceFor(o) } }
    }),
  chooseTactic: (card, tactic) => set((s) => ({ plan: { ...s.plan, [card]: { ...s.plan[card], tactic } } })),
  resetPlan: () => set((s) => ({ plan: defaultPlan(), channels: settingsOf(s.game), segSteps: keepPrices() })),
  setSegStep: (k, step) => set((s) => ({ segSteps: { ...s.segSteps, [k]: step } })),
  setLever: (c, lever) => set((s) => ({ channels: { ...s.channels, [c]: { ...s.channels[c], lever } } })),
  setFocus: (c, focus) => set((s) => ({ channels: { ...s.channels, [c]: { ...s.channels[c], focus } } })),

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
