import type { ModuleId } from '../types'

/** The 10 business systems. They run behind the scenes — the player meets them through places, not pages. */
export const MODULES: Record<ModuleId, { th: string; en: string }> = {
  market: { th: 'การแข่งขันในตลาด', en: 'Market Competition' },
  vehicleRisk: { th: 'ข้อมูลความเสี่ยงยานยนต์', en: 'Vehicle Risk Intelligence' },
  pricing: { th: 'ผลิตภัณฑ์และราคา', en: 'Product & Pricing' },
  catRisk: { th: 'ความเสี่ยงพื้นที่และภัยพิบัติ', en: 'Geographic & Catastrophe Risk' },
  distribution: { th: 'ช่องทางการขาย', en: 'Distribution Management' },
  brand: { th: 'แบรนด์และการตลาด', en: 'Brand & Marketing' },
  claims: { th: 'การจัดการสินไหม', en: 'Claims Management' },
  cx: { th: 'ประสบการณ์ลูกค้า', en: 'Customer Experience' },
  repair: { th: 'เครือข่ายอู่ซ่อม', en: 'Repair Network Management' },
  finance: { th: 'การเงินและประกันภัยต่อ', en: 'Finance & Reinsurance' },
}
