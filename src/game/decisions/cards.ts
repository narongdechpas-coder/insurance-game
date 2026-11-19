import type { Choice, DecisionCard, DecisionId, DecisionOption, QuarterPlan } from './types'

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
      { id: 'cut2', label: 'ลดเชิงรุก', blurb: 'ยอดขายพุ่งเร็ว แต่ Loss Ratio จะตามมาเสียในไตรมาสหลัง', cost: 0, icon: 'down2', impact: { growth: 2, profit: -2, risk: 1, cx: 1 },
        tactics: [
          { id: 'flat', label: 'ลดทุกกลุ่มเท่ากัน', blurb: 'ทุกคนได้ราคาเดียวกัน ยอดโตเร็วสุด แต่ลูกค้าเสี่ยงสูงก็ได้ส่วนลดไปด้วย', cost: 0, icon: 'down2', impact: {  }, speed: 'fast', duration: 'short' },
          { id: 'lowRisk', label: 'ลดเฉพาะลูกค้าความเสี่ยงต่ำ', blurb: 'ใช้ประวัติเคลมคัดลูกค้าดีมารับส่วนลด โตน้อยกว่า แต่ Loss Ratio เสียน้อย', cost: 15, icon: 'shield', impact: { growth: -1, profit: 1, risk: -1 }, speed: 'normal', duration: 'normal', recommended: true },
          { id: 'dealerPromo', label: 'ลดผ่านโปรโมชันดีลเลอร์', blurb: 'ตอบโต้คู่แข่งตรงช่องทางที่ถูกบุก แต่ลูกค้าช่องทางอื่นไม่ได้ประโยชน์', cost: 10, icon: 'store', impact: { cx: -1 }, speed: 'fast', duration: 'short' },
        ],
      },
      { id: 'cut1', label: 'ลดเล็กน้อย', blurb: 'สู้ราคาคู่แข่งได้ กำไรบางลงพอรับได้', cost: 0, icon: 'down', impact: { growth: 1, profit: -1, risk: 0, cx: 0 },
        tactics: [
          { id: 'renewal', label: 'ส่วนลดต่ออายุ', blurb: 'รักษาลูกค้าเก่าให้อยู่ต่อ ฐานลูกค้ามั่นคงขึ้น แต่ลูกค้าใหม่ไม่เพิ่ม', cost: 0, icon: 'users', impact: { growth: -1, cx: 1 }, speed: 'normal', duration: 'long', recommended: true },
          { id: 'newCustomer', label: 'ส่วนลดลูกค้าใหม่', blurb: 'ดึงลูกค้าใหม่ได้เร็ว ลูกค้าเก่ารู้สึกว่าไม่ยุติธรรม', cost: 0, icon: 'up', impact: { growth: 1, cx: -1 }, speed: 'fast', duration: 'short' },
        ],
      },
      { id: 'hold', label: 'คงราคา', blurb: 'รักษาความสม่ำเสมอ ไม่เสี่ยงเพิ่ม', cost: 0, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'raise1', label: 'ขึ้นเล็กน้อย', blurb: 'กำไรต่อกรมธรรม์ดีขึ้น ลูกค้าบางส่วนอาจย้ายค่าย', cost: 0, icon: 'up', impact: { growth: -1, profit: 1, risk: 0, cx: 0 },
        tactics: [
          { id: 'riskyOnly', label: 'ขึ้นเฉพาะกลุ่มเคลมบ่อย', blurb: 'ใช้ข้อมูลเคลมเลือกขึ้นเฉพาะกลุ่มที่ขาดทุน ลูกค้าดีไม่ย้ายค่าย', cost: 10, icon: 'shield', impact: { growth: 1, risk: -1 }, speed: 'normal', duration: 'long', recommended: true },
          { id: 'withService', label: 'ขึ้นทั้งพอร์ต + บริการฉุกเฉิน 24 ชม.', blurb: 'ลูกค้าจ่ายเพิ่มแต่ได้บริการช่วยเหลือบนถนน ความพอใจไม่ตก', cost: 20, icon: 'wrench', impact: { cx: 1 }, speed: 'normal', duration: 'normal' },
        ],
      },
      { id: 'raise2', label: 'ขึ้นเชิงรุก', blurb: 'เน้นกำไร ยอมเสียส่วนแบ่งและความพอใจลูกค้า', cost: 0, icon: 'up2', impact: { growth: -2, profit: 2, risk: -1, cx: -1 },
        tactics: [
          { id: 'allPortfolio', label: 'ขึ้นทั้งพอร์ต', blurb: 'กำไรเพิ่มทันที แต่ลูกค้าย้ายค่ายจำนวนมาก', cost: 0, icon: 'up2', impact: {  }, speed: 'fast', duration: 'short' },
          { id: 'nonRenew', label: 'ขึ้นราคาพร้อมไม่ต่ออายุลูกค้าเสี่ยงสูง', blurb: 'พอร์ตเล็กลงแต่สะอาดขึ้นมาก ต้องสื่อสารกับลูกค้าอย่างเป็นธรรม', cost: 10, icon: 'userMinus', impact: { growth: -1, risk: -1 }, speed: 'normal', duration: 'long', recommended: true },
        ],
      },
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
      { id: 'dealer', label: 'ทุ่มดีลเลอร์', blurb: 'ได้ยอดรถใหม่จำนวนมาก แต่ค่าคอมมิชชันสูง', cost: 30, icon: 'store', impact: { growth: 2, profit: -1, risk: 0, cx: 0 },
        tactics: [
          { id: 'commission', label: 'เพิ่มค่าคอมมิชชัน', blurb: 'ดีลเลอร์ขายให้เรามากขึ้นทันที แต่หยุดจ่ายเมื่อไหร่ยอดก็หาย', cost: 30, icon: 'store', impact: {  }, speed: 'fast', duration: 'short', recommended: true },
          { id: 'oemDeal', label: 'ทำสัญญาพิเศษกับค่ายรถ', blurb: 'แพ็กประกันคู่กับรถใหม่ของค่าย ลงทุนก้อนใหญ่ แต่ได้ลูกค้าต่อเนื่องหลายปี', cost: 50, icon: 'car', impact: { profit: 1 }, speed: 'slow', duration: 'long' },
          { id: 'onSite', label: 'ส่งพนักงานประจำโชว์รูม', blurb: 'อธิบายความคุ้มครองได้ดี ลูกค้าเข้าใจและพอใจกว่า แต่ยอดโตช้ากว่า', cost: 35, icon: 'users', impact: { growth: -1, cx: 1 }, speed: 'normal', duration: 'normal' },
        ],
      },
      { id: 'balanced', label: 'สมดุล', blurb: 'กระจายทุกช่องทางเท่าเดิม', cost: 0, icon: 'scale', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'agent', label: 'ทุ่มตัวแทน', blurb: 'ลูกค้าภักดีกว่า ต่ออายุสูง แต่โตช้า', cost: 20, icon: 'users', impact: { growth: 1, profit: 0, risk: 0, cx: 1 },
        tactics: [
          { id: 'recruit', label: 'รับตัวแทนใหม่และอบรม', blurb: 'ต้องรอสักพักกว่าตัวแทนใหม่จะขายได้ แต่ฐานการขายยั่งยืน', cost: 25, icon: 'users', impact: {  }, speed: 'slow', duration: 'long', recommended: true },
          { id: 'bonus', label: 'เพิ่มโบนัสตัวแทนเดิม', blurb: 'ยอดขึ้นทันที แต่ต้นทุนการขายสูงขึ้น', cost: 20, icon: 'piggy', impact: { growth: 1, profit: -1 }, speed: 'fast', duration: 'short' },
        ],
      },
      { id: 'digital', label: 'ทุ่มดิจิทัล', blurb: 'ต้นทุนต่อกรมธรรม์ต่ำ ต้องลงทุนระบบก่อน', cost: 40, icon: 'globe', impact: { growth: 1, profit: 1, risk: 0, cx: 1 },
        tactics: [
          { id: 'ownApp', label: 'พัฒนาแอปซื้อประกันเอง', blurb: 'ใช้งบและเวลามาก แต่เป็นช่องทางของเราเองในระยะยาว', cost: 0, icon: 'smartphone', impact: { cx: 1 }, speed: 'slow', duration: 'long' },
          { id: 'aggregator', label: 'ขายผ่านเว็บเปรียบเทียบราคา', blurb: 'ได้ลูกค้าเร็ว แต่ต้องแข่งราคากับทุกค่ายบนหน้าจอเดียว', cost: 30, icon: 'globe', impact: { profit: -1 }, speed: 'fast', duration: 'normal', recommended: true },
          { id: 'lineOA', label: 'LINE OA และแชทบอท', blurb: 'งบต่ำ ดูแลลูกค้าเดิมได้ดี แต่หาลูกค้าใหม่ได้น้อย', cost: 0, icon: 'mic', impact: { growth: -1 }, speed: 'normal', duration: 'normal' },
        ],
      },
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
      {
        id: 'save',
        label: 'ประหยัด',
        blurb: 'เก็บเงินไว้ใช้ที่อื่น แบรนด์ค่อยๆ จางลง',
        cost: 0,
        icon: 'piggy',
        impact: { growth: -1, profit: 0, risk: 0, cx: -1 },
        tactics: [
          { id: 'onlineOnly', label: 'ตัดสื่อออฟไลน์ เหลือออนไลน์', blurb: 'เลิกบิลบอร์ดและทีวี ยังยิงโฆษณาออนไลน์ต่อ คนรู้จักน้อยลงบ้างแต่ลูกค้าเดิมยังเห็นเรา', cost: 10, icon: 'smartphone', impact: { cx: 1 }, speed: 'normal', duration: 'normal', recommended: true },
          { id: 'stopEvents', label: 'หยุดสปอนเซอร์และอีเวนต์', blurb: 'สื่อหลักยังอยู่ ยอดขายไม่กระทบทันที แต่ลูกค้าเก่าห่างเหินแบรนด์', cost: 15, icon: 'ticket', impact: { growth: 1, cx: -1 }, speed: 'slow', duration: 'long' },
          { id: 'cutTeam', label: 'ลดคนในทีมการตลาด', blurb: 'ประหยัดที่สุดและกำไรดีขึ้น แต่ทีมเล็กลง ไตรมาสหน้าทำแคมเปญได้อ่อนลง', cost: 0, icon: 'userMinus', impact: { profit: 1 }, speed: 'fast', duration: 'long' },
        ],
      },
      { id: 'maintain', label: 'รักษาระดับ', blurb: 'คนยังจำแบรนด์ได้ ไม่เพิ่มไม่ลด', cost: 25, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      {
        id: 'campaign',
        label: 'แคมเปญใหญ่',
        blurb: 'ดึงลูกค้าใหม่และตอบโต้คู่แข่งได้ แต่ใช้งบหนัก',
        cost: 70,
        icon: 'megaphone',
        impact: { growth: 2, profit: 0, risk: 0, cx: 1 },
        tactics: [
          { id: 'inHouse', label: 'ทำแคมเปญออนไลน์เอง', blurb: 'ทีมเราทำโฆษณาออนไลน์และโซเชียลเอง ยอดขึ้นเร็ว แต่กระแสจางเร็ว', cost: 60, icon: 'smartphone', impact: {}, speed: 'fast', duration: 'short', recommended: true },
          { id: 'ambassador', label: 'จ้าง Brand Ambassador', blurb: 'คนดังที่ลูกค้าไว้ใจช่วยสร้างแบรนด์ ใช้งบหนัก แต่ภาพจำอยู่นานหลายไตรมาส', cost: 95, icon: 'mic', impact: { growth: 1 }, speed: 'normal', duration: 'long' },
          { id: 'sponsor', label: 'สปอนเซอร์กีฬาและอีเวนต์', blurb: 'ลูกค้ารู้สึกผูกพันกับแบรนด์ ต่ออายุดีขึ้น แต่ยอดลูกค้าใหม่โตช้า', cost: 55, icon: 'trophy', impact: { growth: -1, cx: 1 }, speed: 'slow', duration: 'long' },
        ],
      },
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
      { id: 'buyMore', label: 'ซื้อ reinsurance เพิ่ม', blurb: 'ปลอดภัยขึ้นมากถ้าเกิดภัยใหญ่ แต่เสียเบี้ยประกันภัยต่อ', cost: 30, icon: 'umbrella', impact: { growth: 0, profit: -1, risk: -2, cx: 0 },
        tactics: [
          { id: 'quotaShare', label: 'เพิ่ม Quota share', blurb: 'โอนส่วนแบ่งของทุกกรมธรรม์ให้ reinsurer ลดความเสี่ยงทั้งพอร์ต แต่แบ่งกำไรออกไปด้วย', cost: 30, icon: 'umbrella', impact: {  }, speed: 'normal', duration: 'normal', recommended: true },
          { id: 'catXL', label: 'ซื้อ Cat XL', blurb: 'คุ้มครองเฉพาะภัยใหญ่ที่เกินเกณฑ์ ราคาถูกกว่า แต่ไม่ช่วยเคลมทั่วไป', cost: 20, icon: 'shield', impact: { profit: 1, risk: 1 }, speed: 'normal', duration: 'normal' },
        ],
      },
      { id: 'retain', label: 'รับความเสี่ยงเอง', blurb: 'ประหยัดเบี้ยประกันภัยต่อ ถ้าเกิดภัยใหญ่จะเจ็บหนัก', cost: 0, icon: 'safe', impact: { growth: 0, profit: 1, risk: 2, cx: 0 },
        tactics: [
          { id: 'lessQS', label: 'ลดสัดส่วน Quota share', blurb: 'เก็บเบี้ยไว้เองมากขึ้น กำไรขึ้นถ้าไม่มีเคลมใหญ่', cost: 0, icon: 'safe', impact: {  }, speed: 'fast', duration: 'normal' },
          { id: 'higherRetention', label: 'เพิ่ม retention ของ XL', blurb: 'รับผิดชอบเองมากขึ้นก่อนที่ XL จะเริ่มจ่าย เบี้ยถูกลง แต่ยังมีตาข่ายรองรับภัยใหญ่', cost: 0, icon: 'umbrella', impact: { profit: -1, risk: -1 }, speed: 'normal', duration: 'long', recommended: true },
        ],
      },
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
      { id: 'motor', label: 'เน้นรถยนต์', blurb: 'ตลาดใหญ่ที่เราถนัด แต่กระจุกความเสี่ยง', cost: 0, icon: 'car', impact: { growth: 1, profit: 0, risk: 1, cx: 0 },
        tactics: [
          { id: 'newType1', label: 'ชั้น 1 รถใหม่', blurb: 'เบี้ยสูง เคลมสม่ำเสมอ เป็นตลาดที่เราถนัด', cost: 0, icon: 'car', impact: {  }, speed: 'normal', duration: 'normal', recommended: true },
          { id: 'budget2plus', label: '2+ และ 3+ ราคาประหยัด', blurb: 'ลูกค้ากลุ่มใหญ่ แต่แข่งราคาดุ', cost: 0, icon: 'down', impact: { growth: 1, profit: -1 }, speed: 'fast', duration: 'normal' },
          { id: 'evProduct', label: 'ประกันรถ EV', blurb: 'ตลาดยังเล็กแต่โตเร็ว ยังไม่รู้ต้นทุนแบตเตอรี่ที่แท้จริง', cost: 15, icon: 'bolt', impact: { growth: -1, risk: 1 }, speed: 'slow', duration: 'long' },
        ],
      },
      { id: 'balanced', label: 'สมดุล', blurb: 'สัดส่วนเดิม', cost: 0, icon: 'scale', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'diversify', label: 'กระจายไปทรัพย์สินและ PA', blurb: 'ลดการพึ่งพารถยนต์ ต้องลงทุนทีมและผลิตภัณฑ์', cost: 20, icon: 'spread', impact: { growth: 0, profit: 1, risk: -1, cx: 0 },
        tactics: [
          { id: 'propertySME', label: 'อัคคีภัยบ้านและ SME', blurb: 'กระจายความเสี่ยงจากรถยนต์ แต่ต้องคุมภัยน้ำท่วมของทรัพย์สินแทน', cost: 20, icon: 'safe', impact: {  }, speed: 'slow', duration: 'long', recommended: true },
          { id: 'paTravel', label: 'PA และประกันเดินทาง', blurb: 'เบี้ยเล็ก เคลมน้อย กระจายความเสี่ยงได้ดี แต่โตช้า', cost: 15, icon: 'users', impact: { growth: -1, risk: -1 }, speed: 'normal', duration: 'normal' },
        ],
      },
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
      { id: 'strict', label: 'เข้มงวด', blurb: 'คัดลูกค้าเสี่ยงต่ำ พอร์ตสวยแต่โตยาก', cost: 0, icon: 'shield', impact: { growth: -1, profit: 1, risk: -1, cx: 0 },
        tactics: [
          { id: 'inspection', label: 'ตรวจสภาพรถก่อนรับ', blurb: 'คัดรถเสี่ยงออกได้ทันที แต่ลูกค้ารอนานและเสียค่าคน', cost: 15, icon: 'wrench', impact: { cx: -1 }, speed: 'fast', duration: 'normal' },
          { id: 'riskScore', label: 'ใช้คะแนนความเสี่ยงจากข้อมูล', blurb: 'คัดแม่นขึ้นเรื่อยๆ และไม่ทำให้ลูกค้าดีหลุด ต้องลงทุนระบบก่อน', cost: 25, icon: 'shield', impact: { growth: 1 }, speed: 'slow', duration: 'long', recommended: true },
        ],
      },
      { id: 'normal', label: 'ปกติ', blurb: 'เกณฑ์เดิม', cost: 0, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'broad', label: 'เปิดรับกว้าง', blurb: 'รับทุกกลุ่มเพื่อเร่งยอด เสี่ยงได้ลูกค้าเคลมบ่อย', cost: 0, icon: 'open', impact: { growth: 2, profit: -1, risk: 2, cx: 0 },
        tactics: [
          { id: 'oldCars', label: 'รับรถอายุมาก', blurb: 'ตลาดที่คู่แข่งไม่ค่อยรับ แต่ค่าซ่อมและอะไหล่หายากสูง', cost: 0, icon: 'car', impact: {  }, speed: 'fast', duration: 'normal', recommended: true },
          { id: 'youngDrivers', label: 'รับผู้ขับขี่อายุน้อย', blurb: 'กลุ่มใหญ่และโตเร็ว แต่เกิดอุบัติเหตุบ่อยกว่าเฉลี่ย', cost: 0, icon: 'users', impact: { growth: 1, profit: -1, risk: 1 }, speed: 'fast', duration: 'long' },
        ],
      },
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
      { id: 'costCut', label: 'คุมต้นทุน', blurb: 'ต่อรองค่าซ่อมลง ลูกค้าบ่นเรื่องคุณภาพ', cost: 0, icon: 'down', impact: { growth: 0, profit: 1, risk: 0, cx: -2 },
        tactics: [
          { id: 'laborRate', label: 'ต่อรองค่าแรงอู่', blurb: 'ประหยัดได้พอสมควร อู่บางแห่งอาจไม่พอใจ', cost: 0, icon: 'scale', impact: {  }, speed: 'normal', duration: 'normal', recommended: true },
          { id: 'nonOEM', label: 'ใช้อะไหล่เทียบแท้', blurb: 'ประหยัดมาก แต่ลูกค้าบ่นและเสี่ยงถูกร้องเรียน', cost: 0, icon: 'wrench', impact: { profit: 1, cx: -1 }, speed: 'fast', duration: 'long' },
          { id: 'repairFirst', label: 'เน้นซ่อมแทนเปลี่ยน', blurb: 'ประหยัดโดยลูกค้ายังรับได้ ต้องใช้ช่างฝีมือดี', cost: 5, icon: 'star', impact: { cx: 1 }, speed: 'normal', duration: 'normal' },
        ],
      },
      { id: 'balanced', label: 'สมดุล', blurb: 'อู่เดิม เงื่อนไขเดิม', cost: 0, icon: 'scale', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'premium', label: 'อู่คุณภาพสูง', blurb: 'ลูกค้าประทับใจ ต่ออายุดีขึ้น ค่าซ่อมแพงขึ้น', cost: 20, icon: 'star', impact: { growth: 0, profit: -1, risk: 0, cx: 2 },
        tactics: [
          { id: 'dealerService', label: 'ส่งซ่อมศูนย์บริการของค่ายรถ', blurb: 'ลูกค้าพอใจทันที แต่ค่าซ่อมแพงมาก', cost: 35, icon: 'car', impact: { profit: -1 }, speed: 'fast', duration: 'normal' },
          { id: 'upgradeNetwork', label: 'อัปเกรดอู่ในเครือ + รับรองมาตรฐาน', blurb: 'ใช้เวลา แต่คุมทั้งคุณภาพและต้นทุนได้เอง', cost: 20, icon: 'star', impact: {  }, speed: 'slow', duration: 'long', recommended: true },
        ],
      },
      { id: 'ev', label: 'ลงทุนอู่ EV', blurb: 'พร้อมรับลูกค้า EV ก่อนคู่แข่ง ใช้เงินลงทุนสูง', cost: 50, icon: 'bolt', impact: { growth: 1, profit: 0, risk: 0, cx: 1 },
        tactics: [
          { id: 'ownEvCenter', label: 'สร้างศูนย์ซ่อม EV ของเราเอง', blurb: 'ลงทุนสูง แต่คุมค่าซ่อมแบตเตอรี่ได้ในระยะยาว', cost: 70, icon: 'bolt', impact: { profit: 1 }, speed: 'slow', duration: 'long' },
          { id: 'evPartner', label: 'จับมืออู่ EV พันธมิตร', blurb: 'เริ่มได้ทันที งบน้อยกว่า แต่ต่อรองราคาได้จำกัด', cost: 30, icon: 'users', impact: {  }, speed: 'fast', duration: 'normal', recommended: true },
        ],
      },
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
      { id: 'reduce', label: 'ลดพื้นที่เสี่ยง', blurb: 'ถอยจากพื้นที่ลุ่มน้ำท่วม เสียยอดบางส่วน', cost: 0, icon: 'map', impact: { growth: -1, profit: 0, risk: -2, cx: 0 },
        tactics: [
          { id: 'noNewLowland', label: 'ไม่รับงานใหม่ในพื้นที่ลุ่ม', blurb: 'ลูกค้าเดิมยังอยู่ ความเสี่ยงค่อยๆ ลดลง', cost: 0, icon: 'map', impact: {  }, speed: 'normal', duration: 'long', recommended: true },
          { id: 'zonePricing', label: 'ขึ้นเบี้ยเฉพาะพื้นที่เสี่ยง', blurb: 'ยังรับงานได้ ยอดไม่หาย แต่ความเสี่ยงลดน้อยกว่า', cost: 10, icon: 'scale', impact: { growth: 1, risk: 1 }, speed: 'normal', duration: 'normal' },
        ],
      },
      { id: 'hold', label: 'คงเดิม', blurb: 'พอร์ตพื้นที่เดิม', cost: 0, icon: 'hold', impact: { growth: 0, profit: 0, risk: 0, cx: 0 } },
      { id: 'grow', label: 'รับเพิ่มเพื่อโต', blurb: 'เบี้ยเพิ่มเร็ว ถ้าน้ำท่วมจะโดนหนัก', cost: 0, icon: 'up', impact: { growth: 1, profit: 1, risk: 2, cx: 0 },
        tactics: [
          { id: 'newRegions', label: 'ขยายไปภาคเหนือและอีสาน', blurb: 'กระจายพื้นที่เสี่ยง แต่ต้องสร้างเครือข่ายใหม่', cost: 20, icon: 'map', impact: { risk: -1 }, speed: 'slow', duration: 'long', recommended: true },
          { id: 'lowlandGap', label: 'รับงานพื้นที่ลุ่มที่คู่แข่งถอยออก', blurb: 'เบี้ยดีและได้เร็ว แต่ถ้าน้ำท่วมจะเจ็บหนัก', cost: 0, icon: 'umbrella', impact: { growth: 1, risk: 1 }, speed: 'fast', duration: 'short' },
        ],
      },
    ],
  },
]

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<DecisionId, DecisionCard>

/** Discretionary budget per quarter (million THB). Mock game-design value. */
export const QUARTER_BUDGET_MB = 150

export function defaultPlan(): QuarterPlan {
  return Object.fromEntries(CARDS.map((c) => [c.id, { option: c.defaultOption }])) as QuarterPlan
}

/** Choosing a stance pre-selects its recommended tactic, so a quick player can move on. */
export function choiceFor(option: DecisionOption): Choice {
  const t = option.tactics?.find((x) => x.recommended) ?? option.tactics?.[0]
  return t ? { option: option.id, tactic: t.id } : { option: option.id }
}

export function isUnlocked(card: DecisionCard, quarterIndex: number, unlockAll = false) {
  return unlockAll || quarterIndex >= card.unlockQuarter
}
