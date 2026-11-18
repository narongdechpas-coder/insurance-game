import {
  ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Car, DoorOpen, Globe, Landmark, MapPinned, Megaphone,
  Mic, Minus, PiggyBank, Scale, Shapes, ShieldCheck, Smartphone, Star, Store, Ticket, Trophy, Tv, Umbrella, UserMinus, Users, Wrench, Zap,
} from 'lucide-react'
import type { Duration, ImpactAxis, OptionIcon, Speed } from '../../game/decisions/types'

export const OPTION_ICONS: Record<OptionIcon, typeof Car> = {
  down2: ChevronsDown, down: ChevronDown, hold: Minus, up: ChevronUp, up2: ChevronsUp,
  car: Car, scale: Scale, spread: Shapes, shield: ShieldCheck, open: DoorOpen, store: Store,
  users: Users, globe: Globe, piggy: PiggyBank, megaphone: Megaphone, wrench: Wrench, star: Star,
  bolt: Zap, map: MapPinned, umbrella: Umbrella, safe: Landmark,
  smartphone: Smartphone, mic: Mic, trophy: Trophy, tv: Tv, ticket: Ticket, userMinus: UserMinus,
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

export const SPEED_LABEL: Record<Speed, string> = { fast: 'เห็นผลเร็ว', normal: 'เห็นผลปานกลาง', slow: 'เห็นผลช้า' }
export const DURATION_LABEL: Record<Duration, string> = { short: 'ผลอยู่สั้น', normal: 'ผลอยู่ปานกลาง', long: 'ผลอยู่นาน' }

export const KIND = {
  opportunity: { label: 'โอกาส', cls: 'bg-chance' },
  threat: { label: 'ภัยคุกคาม', cls: 'bg-alert' },
  competitor: { label: 'คู่แข่ง', cls: 'bg-watch' },
}
