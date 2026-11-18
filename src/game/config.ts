import type { Difficulty, GameConfig, GameLength } from './types'

/** Game-design constants. All monetary values in million THB. */
export const STARTING_CAPITAL_MB = 2000
export const GAME_LENGTHS: { quarters: GameLength; label: string }[] = [
  { quarters: 12, label: '3 ปี (12 ไตรมาส)' },
  { quarters: 20, label: '5 ปี (20 ไตรมาส)' },
]
export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Hard' },
]

export const DEFAULT_CONFIG: GameConfig = {
  companyName: 'Decision Master Insurance',
  quarters: 12,
  difficulty: 'normal',
  startingCapitalMB: STARTING_CAPITAL_MB,
  seed: 20270101,
}
