import { create } from 'zustand'
import { DEFAULT_CONFIG } from '../game/config'
import { createInitialState } from '../game/initialState'
import type { GameState, LocationId } from '../game/types'

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
}

interface Store {
  game: GameState
  ui: UiState
  hover: (id: LocationId | null) => void
  select: (id: LocationId | null) => void
  focusEvent: (eventId: string | null) => void
  finishIntro: () => void
  toast: (text: string) => void
}

let toastId = 0

export const useGameStore = create<Store>((set, get) => ({
  game: createInitialState(DEFAULT_CONFIG),
  ui: { hovered: null, selected: null, highlightedEvent: null, introDone: false, toasts: [] },

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
