import type { LocationId, ModuleId } from '../types'

export interface LocationDef {
  id: LocationId
  en: string
  th: string
  role: string // one-line description of what the CEO controls here
  modules: ModuleId[]
  icon: 'shield' | 'car' | 'megaphone' | 'phone' | 'globe' | 'wrench' | 'satellite'
}

export const LOCATIONS: LocationDef[] = [
  {
    id: 'hq',
    en: 'Insurance HQ',
    th: 'สำนักงานใหญ่',
    role: 'กำหนดทิศทางบริษัท ราคา ผลิตภัณฑ์ และอ่านเกมคู่แข่ง',
    modules: ['market', 'pricing', 'vehicleRisk'],
    icon: 'shield',
  },
  {
    id: 'dealer',
    en: 'Dealer Network',
    th: 'เครือข่ายดีลเลอร์',
    role: 'ช่องทางขายผ่านโชว์รูม ตัวแทน และพันธมิตรค่ายรถ',
    modules: ['distribution'],
    icon: 'car',
  },
  {
    id: 'marketing',
    en: 'Marketing & Brand',
    th: 'การตลาดและแบรนด์',
    role: 'สร้างการรับรู้ แคมเปญ และภาพลักษณ์ที่ลูกค้าเชื่อใจ',
    modules: ['brand'],
    icon: 'megaphone',
  },
  {
    id: 'customers',
    en: 'Customers',
    th: 'ศูนย์ลูกค้า',
    role: 'ทุกจุดที่ลูกค้าสัมผัสบริษัท ตั้งแต่ซื้อจนต่ออายุ',
    modules: ['cx'],
    icon: 'phone',
  },
  {
    id: 'claims',
    en: 'Claims Service',
    th: 'ศูนย์สินไหม',
    role: 'ความเร็วและความแม่นยำในการจ่ายสินไหม',
    modules: ['claims'],
    icon: 'globe',
  },
  {
    id: 'repair',
    en: 'Repair Network',
    th: 'เครือข่ายอู่ซ่อม',
    role: 'คุณภาพงานซ่อม ต้นทุนอะไหล่ และอู่ในเครือ',
    modules: ['repair'],
    icon: 'wrench',
  },
  {
    id: 'risk',
    en: 'Risk & Reinsurance',
    th: 'ความเสี่ยงและประกันภัยต่อ',
    role: 'คุมความเสี่ยงภัยพิบัติ เงินทุน และการโอนความเสี่ยง',
    modules: ['catRisk', 'finance'],
    icon: 'satellite',
  },
]

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l])) as Record<LocationId, LocationDef>
