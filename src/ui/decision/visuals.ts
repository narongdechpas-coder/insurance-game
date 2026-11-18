import {
  ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Car, DoorOpen, Globe, Landmark, MapPinned, Megaphone,
  Minus, PiggyBank, Scale, Shapes, ShieldCheck, Star, Store, Umbrella, Users, Wrench, Zap,
} from 'lucide-react'
import type { DecisionOption, ImpactAxis } from '../../game/decisions/types'

export const OPTION_ICONS: Record<DecisionOption['icon'], typeof Car> = {
  down2: ChevronsDown, down: ChevronDown, hold: Minus, up: ChevronUp, up2: ChevronsUp,
  car: Car, scale: Scale, spread: Shapes, shield: ShieldCheck, open: DoorOpen, store: Store,
  users: Users, globe: Globe, piggy: PiggyBank, megaphone: Megaphone, wrench: Wrench, star: Star,
  bolt: Zap, map: MapPinned, umbrella: Umbrella, safe: Landmark,
}

/** For 'risk' a rise is bad; for every other axis a rise is good. */
export const AXES: { id: ImpactAxis; label: string; short: string; higherIsBetter: boolean }[] = [
  { id: 'growth', label: 'การเติบโต', short: 'โต', higherIsBetter: true },
  { id: 'profit', label: 'กำไรจากรับประกัน', short: 'กำไร', higherIsBetter: true },
  { id: 'risk', label: 'ความเสี่ยง', short: 'เสี่ยง', higherIsBetter: false },
  { id: 'cx', label: 'ความพอใจลูกค้า', short: 'ลูกค้า', higherIsBetter: true },
]

export function tone(value: number, higherIsBetter: boolean) {
  if (value === 0) return 'neutral'
  return value > 0 === higherIsBetter ? 'good' : 'bad'
}
