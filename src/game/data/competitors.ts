import type { Competitor } from '../types'

/**
 * Four AI rivals. Names are fictional — any resemblance to real insurers is unintended.
 * Shares are of the in-game market (mock values for the prototype).
 */
export const COMPETITORS: Competitor[] = [
  { id: 'lotus', name: 'Lotus Guard', personality: 'aggressive', color: '#e85d75', marketShare: 0.24 },
  { id: 'naga', name: 'Golden Naga', personality: 'premium', color: '#e9a23b', marketShare: 0.22 },
  { id: 'bluewave', name: 'BlueWave Direct', personality: 'digital', color: '#22a6c8', marketShare: 0.17 },
  { id: 'summit', name: 'Summit General', personality: 'conservative', color: '#7a6ff0', marketShare: 0.17 },
]
