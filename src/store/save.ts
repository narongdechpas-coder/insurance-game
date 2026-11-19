import type { GameState } from '../game/types'

/**
 * Autosave: the game state is written to this browser's localStorage at the start of a
 * game and after every quarter, so a refresh or a closed tab can continue from the last
 * finished quarter. Storage can be missing or blocked (private mode), so every access is guarded.
 */
const KEY = 'insure-universe:save'
const SETTINGS_KEY = 'insure-universe:settings'
const VERSION = 2 // 2: engine v2 (company stocks, channels, segments): older saves cannot be continued

export interface SaveInfo {
  game: GameState
  savedAt: number
}

export function writeSave(game: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, savedAt: Date.now(), game }))
  } catch {
    /* storage unavailable: play on without saving */
  }
}

/** The saved game, if there is one that can still be continued. */
export function readSave(): SaveInfo | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s?.v !== VERSION || !s.game?.sim || s.game.outcome) return null
    return { game: s.game, savedAt: s.savedAt }
  } catch {
    return null
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export interface Settings {
  /** City-run animation: 1 = normal, 2 = fast, 0 = skip straight to the newspaper. */
  runSpeed: 0 | 1 | 2
  /** How the outer city is drawn: white walk-up buildings, or translucent massing (architect's model). */
  cityStyle: 'walkup' | 'massing'
}

export const DEFAULT_SETTINGS: Settings = { runSpeed: 1, cityStyle: 'walkup' }

export function readSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function writeSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
