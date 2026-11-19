import channelsJson from './channels.json'
import segmentsJson from './segments.json'

/**
 * Engine v2 assumption tables. The numbers live in segments.json and channels.json so they can be
 * tuned without touching code. All values are game-design assumptions, not market statistics.
 */
export type SegmentId = 'newCar' | 'oldCar' | 'budget' | 'ev' | 'nonMotor'
export type Level = 'low' | 'mid' | 'high'

export interface Segment {
  id: SegmentId
  label: string
  startShare: number
  premiumIndex: number
  adequateLR: number
  priceSensitivity: Level
  volatility: Level
  floodExposure: number
}

export interface Channel {
  id: 'dealer' | 'agent' | 'direct'
  label: string
  marketShare: number
  segmentMix: Record<SegmentId, number>
  baseRenewal: number
  lever: 'commission' | 'adSpend'
  marketRate: number
  steps: number[]
  brandSensitivity: number
}

export const SEGMENTS = segmentsJson.segments as Segment[]
export const CHANNEL_TABLE = channelsJson.channels as Channel[]
