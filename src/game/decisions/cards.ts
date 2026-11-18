import type { DecisionCard, DecisionId, QuarterPlan } from './types'

/**
 * Strategy cards — game-design values (mock).
 * Impact directions are a first draft for insurance-expert review (see docs/DECISION_ROOM.md).
 * cost = discretionary spend this quarter in million THB.
 */
export const CARDS: DecisionCard[] = [
  {
    id: 'pricing',
    title: 'ราคาเบี้ย',
    question: 'ไตรมาสนี้จะตั้งราคาเบี้ยรถยนต์อย่างไร',
    location: 'hq',
    modules: ['pricing', 'market'],
    unlockQuarter: 0,
    defaultOption: 'hold',
    options: [
      { id: 'cut2', label: 'ลดเชิงรุก', blurb: 'ยอดขายพุ่งเร็ว แต่ Loss Ratio จะตามมาเสียในไตรมาสหลัง', cost: 0, icon: 'down2', impact: { growth: 2, profit: -2, risk: 1, cx: 1 } },
      { id: 'cut1', label: 'ลดเล็กน้อย', blurb: 'สู้ราคาคู่แข่งได้ กำไรบางลงพอรับได้', cost: 0, icon: 'down', impact: { growth: 1, profit: -1, risk: 0, cx: 0 } },
      { id: 'hold', label: 'คงราคา', blurb: 'รักษาความสม่ำเสมอ ไม่เสี่ยงเพิ่ม', cost: 0, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'raise1', label: 'ขึ้นเล็กน้อย', blurb: 'กำไรต่อกรมธรรม์ดีขึ้น ลูกค้าบางส่วนอาจย้ายค่าย', cost: 0, icon: 'up', impact: { growth: -1, profit: 1, risk: 0, cx: 0 } },
      { id: 'raise2', label: 'ขึ้นเชิงรุก', blurb: 'เน้นกำไร ยอมเสียส่วนแบ่งและความพอใจลูกค้า', cost: 0, icon: 'up2', impact: { growth: -2, profit: 2, risk: -1, cx: -1 } },
    ],
  },
  {
    id: 'distribution',
    title: 'ช่องทางขาย',
    question: 'จะเทน้ำหนักการขายไปที่ช่องทางไหน',
    location: 'dealer',
    modules: ['distribution'],
    unlockQuarter: 0,
    defaultOption: 'balanced',
    options: [
      { id: 'dealer', label: 'ทุ่มดีลเลอร์', blurb: 'ได้ยอดรถใหม่จำนวนมาก แต่ค่าคอมมิชชันสูง', cost: 30, icon: 'store', impact: { growth: 2, profit: -1, risk: 0, cx: 0 } },
      { id: 'balanced', label: 'สมดุล', blurb: 'กระจายทุกช่องทางเท่าเดิม', cost: 0, icon: 'scale', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'agent', label: 'ทุ่มตัวแทน', blurb: 'ลูกค้าภักดีกว่า ต่ออายุสูง แต่โตช้า', cost: 20, icon: 'users', impact: { growth: 1, profit: 0, risk: 0, cx: 1 } },
      { id: 'digital', label: 'ทุ่มดิจิทัล', blurb: 'ต้นทุนต่อกรมธรรม์ต่ำ ต้องลงทุนระบบก่อน', cost: 40, icon: 'globe', impact: { growth: 1, profit: 1, risk: 0, cx: 1 } },
    ],
  },
  {
    id: 'marketing',
    title: 'การตลาดและแบรนด์',
    question: 'งบการตลาดไตรมาสนี้จะใช้ระดับไหน',
    location: 'marketing',
    modules: ['brand'],
    unlockQuarter: 0,
    defaultOption: 'maintain',
    options: [
      { id: 'save', label: 'ประหยัด', blurb: 'เก็บเงินไว้ใช้ที่อื่น แบรนด์ค่อยๆ จางลง', cost: 0, icon: 'piggy', impact: { growth: -1, profit: 0, risk: 0, cx: -1 } },
      { id: 'maintain', label: 'รักษาระดับ', blurb: 'คนยังจำแบรนด์ได้ ไม่เพิ่มไม่ลด', cost: 25, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'campaign', label: 'แคมเปญใหญ่', blurb: 'ดึงลูกค้าใหม่และตอบโต้คู่แข่งได้ แต่ใช้งบหนัก', cost: 70, icon: 'megaphone', impact: { growth: 2, profit: 0, risk: 0, cx: 1 } },
    ],
  },
  {
    id: 'reinsurance',
    title: 'การเงินและประกันภัยต่อ',
    question: 'จะโอนความเสี่ยงให้ reinsurer มากน้อยแค่ไหน',
    location: 'risk',
    modules: ['finance'],
    unlockQuarter: 0,
    defaultOption: 'keep',
    options: [
      { id: 'keep', label: 'คงสัดส่วนเดิม', blurb: 'ความคุ้มครองเท่าเดิม ต้นทุนเท่าเดิม', cost: 0, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'buyMore', label: 'ซื้อ reinsurance เพิ่ม', blurb: 'ปลอดภัยขึ้นมากถ้าเกิดภัยใหญ่ แต่เสียเบี้ยประกันภัยต่อ', cost: 30, icon: 'umbrella', impact: { growth: 0, profit: -1, risk: -2, cx: 0 } },
      { id: 'retain', label: 'รับความเสี่ยงเอง', blurb: 'ประหยัดเบี้ยประกันภัยต่อ ถ้าเกิดภัยใหญ่จะเจ็บหนัก', cost: 0, icon: 'safe', impact: { growth: 0, profit: 1, risk: 2, cx: 0 } },
    ],
  },
  {
    id: 'productMix',
    title: 'Product mix',
    question: 'จะให้น้ำหนักกลุ่มผลิตภัณฑ์ไหน',
    location: 'hq',
    modules: ['pricing', 'market'],
    unlockQuarter: 1,
    defaultOption: 'balanced',
    options: [
      { id: 'motor', label: 'เน้นรถยนต์', blurb: 'ตลาดใหญ่ที่เราถนัด แต่กระจุกความเสี่ยง', cost: 0, icon: 'car', impact: { growth: 1, profit: 0, risk: 1, cx: 0 } },
      { id: 'balanced', label: 'สมดุล', blurb: 'สัดส่วนเดิม', cost: 0, icon: 'scale', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'diversify', label: 'กระจายไปทรัพย์สินและ PA', blurb: 'ลดการพึ่งพารถยนต์ ต้องลงทุนทีมและผลิตภัณฑ์', cost: 20, icon: 'spread', impact: { growth: 0, profit: 1, risk: -1, cx: 0 } },
    ],
  },
  {
    id: 'underwriting',
    title: 'Underwriting appetite',
    question: 'จะรับประกันเข้มงวดแค่ไหน',
    location: 'hq',
    modules: ['vehicleRisk'],
    unlockQuarter: 1,
    defaultOption: 'normal',
    options: [
      { id: 'strict', label: 'เข้มงวด', blurb: 'คัดลูกค้าเสี่ยงต่ำ พอร์ตสวยแต่โตยาก', cost: 0, icon: 'shield', impact: { growth: -1, profit: 1, risk: -1, cx: 0 } },
      { id: 'normal', label: 'ปกติ', blurb: 'เกณฑ์เดิม', cost: 0, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'broad', label: 'เปิดรับกว้าง', blurb: 'รับทุกกลุ่มเพื่อเร่งยอด เสี่ยงได้ลูกค้าเคลมบ่อย', cost: 0, icon: 'open', impact: { growth: 2, profit: -1, risk: 2, cx: 0 } },
    ],
  },
  {
    id: 'repair',
    title: 'เครือข่ายอู่',
    question: 'จะบริหารอู่ในเครืออย่างไร',
    location: 'repair',
    modules: ['repair', 'claims', 'cx'],
    unlockQuarter: 2,
    defaultOption: 'balanced',
    options: [
      { id: 'costCut', label: 'คุมต้นทุน', blurb: 'ต่อรองค่าซ่อมลง ลูกค้าบ่นเรื่องคุณภาพ', cost: 0, icon: 'down', impact: { growth: 0, profit: 1, risk: 0, cx: -2 } },
      { id: 'balanced', label: 'สมดุล', blurb: 'อู่เดิม เงื่อนไขเดิม', cost: 0, icon: 'scale', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'premium', label: 'อู่คุณภาพสูง', blurb: 'ลูกค้าประทับใจ ต่ออายุดีขึ้น ค่าซ่อมแพงขึ้น', cost: 20, icon: 'star', impact: { growth: 0, profit: -1, risk: 0, cx: 2 } },
      { id: 'ev', label: 'ลงทุนอู่ EV', blurb: 'พร้อมรับลูกค้า EV ก่อนคู่แข่ง ใช้เงินลงทุนสูง', cost: 50, icon: 'bolt', impact: { growth: 1, profit: 0, risk: 0, cx: 1 } },
    ],
  },
  {
    id: 'catExposure',
    title: 'Cat exposure',
    question: 'จะรับงานในพื้นที่เสี่ยงภัยธรรมชาติแค่ไหน',
    location: 'risk',
    modules: ['catRisk'],
    unlockQuarter: 2,
    defaultOption: 'hold',
    options: [
      { id: 'reduce', label: 'ลดพื้นที่เสี่ยง', blurb: 'ถอยจากพื้นที่ลุ่มน้ำท่วม เสียยอดบางส่วน', cost: 0, icon: 'map', impact: { growth: -1, profit: 0, risk: -2, cx: 0 } },
      { id: 'hold', label: 'คงเดิม', blurb: 'พอร์ตพื้นที่เดิม', cost: 0, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'grow', label: 'รับเพิ่มเพื่อโต', blurb: 'เบี้ยเพิ่มเร็ว ถ้าน้ำท่วมจะโดนหนัก', cost: 0, icon: 'up', impact: { growth: 1, profit: 1, risk: 2, cx: 0 } },
    ],
  },
]

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<DecisionId, DecisionCard>

/** Discretionary budget per quarter (million THB). Mock game-design value. */
export const QUARTER_BUDGET_MB = 150

export function defaultPlan(): QuarterPlan {
  return Object.fromEntries(CARDS.map((c) => [c.id, c.defaultOption])) as QuarterPlan
}

export function isUnlocked(card: DecisionCard, quarterIndex: number, unlockAll = false) {
  return unlockAll || quarterIndex >= card.unlockQuarter
}
