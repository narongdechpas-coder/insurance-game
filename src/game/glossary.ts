/**
 * Plain-language explanations of insurance jargon for first-time players.
 * Shown by the small "?" next to a term and listed in full in the CEO guide.
 * Draft wording: have an insurance professional review before public release.
 */
export interface GlossaryEntry {
  id: string
  term: string
  th: string
  body: string
  /** How the game models it, when that differs from or simplifies real life. */
  game?: string
  /** Text patterns that should get a "?" (English is matched on word boundaries). */
  match: string[]
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'reinsurance',
    term: 'Reinsurance',
    th: 'ประกันภัยต่อ',
    body: 'บริษัทประกันซื้อประกันอีกชั้นหนึ่งจากบริษัทรับประกันภัยต่อ (reinsurer) เพื่อโอนความเสี่ยงบางส่วนออกไป เมื่อเกิดเคลมก้อนใหญ่ เงินทุนของเราจะไม่เสียหายหนักเกินไป',
    game: 'ในเกมมี 2 แบบคือ Quota share กับ Cat XL ต้องจ่ายค่าคุ้มครองทุกไตรมาส ไม่ว่าจะเกิดภัยหรือไม่',
    match: ['reinsurance', 'reinsurer', 'ประกันภัยต่อ'],
  },
  {
    id: 'quotaShare',
    term: 'Quota Share',
    th: 'สัญญาแบ่งสัดส่วน',
    body: 'สัญญาประกันภัยต่อที่ยกเบี้ยของทุกกรมธรรม์ให้ reinsurer ตามสัดส่วนที่ตกลง เช่น 30% แลกกับให้เขาจ่ายเคลมในสัดส่วนเดียวกัน ผลคือความผันผวนลดลงทั้งพอร์ต แต่กำไรก็ถูกแบ่งออกไปด้วย',
    match: ['Quota share'],
  },
  {
    id: 'catXL',
    term: 'Cat XL',
    th: 'ประกันภัยต่อสำหรับภัยพิบัติ',
    body: 'ย่อมาจาก Catastrophe Excess of Loss คุ้มครองเฉพาะเหตุการณ์ใหญ่ เช่น น้ำท่วม เมื่อความเสียหายรวมจากเหตุการณ์เดียวเกินระดับที่เรารับเองไว้ (retention) reinsurer จะจ่ายส่วนที่เกินจนถึงวงเงินสูงสุด ราคาถูกกว่า Quota share แต่ไม่ช่วยเคลมทั่วไป',
    match: ['Cat XL'],
  },
  {
    id: 'xl',
    term: 'XL (Excess of Loss)',
    th: 'ประกันภัยต่อส่วนเกินความเสียหาย',
    body: 'ประกันภัยต่อที่เริ่มจ่ายเมื่อความเสียหายเกินระดับที่ตกลงไว้เท่านั้น ส่วนที่ต่ำกว่าระดับนั้นเรารับผิดชอบเอง ต่างจาก Quota share ที่แบ่งกันทุกบาท',
    match: ['XL'],
  },
  {
    id: 'retention',
    term: 'Retention',
    th: 'ส่วนที่รับผิดชอบเอง',
    body: 'จำนวนเงินที่บริษัทต้องจ่ายเองก่อนที่ประกันภัยต่อจะเริ่มจ่าย ตั้งสูงแล้วค่าประกันภัยต่อถูกลง แต่ถ้าเกิดภัยใหญ่ต้องควักเงินเองมากขึ้น',
    match: ['retention'],
  },
  {
    id: 'combinedRatio',
    term: 'Combined Ratio',
    th: 'อัตราส่วนรวม',
    body: '(ค่าสินไหม + ค่าใช้จ่ายทั้งหมด) ÷ เบี้ยที่ถือเป็นรายได้ ต่ำกว่า 100% แปลว่ามีกำไรจากการรับประกัน เกิน 100% แปลว่าขาดทุนจากการรับประกัน โดยยังไม่นับรายได้จากการลงทุน',
    game: 'เป็น 1 ใน 4 ตัวที่ใช้คิดคะแนน ยิ่งเฉลี่ยต่ำยิ่งได้คะแนนมาก',
    match: ['Combined Ratio'],
  },
  {
    id: 'lossRatio',
    term: 'Loss Ratio',
    th: 'อัตราค่าสินไหม',
    body: 'ค่าสินไหมที่เกิดขึ้น ÷ เบี้ยที่ถือเป็นรายได้ บอกว่าเบี้ยทุก 100 บาทถูกใช้จ่ายเคลมไปกี่บาท เป็นส่วนที่ใหญ่ที่สุดของ Combined Ratio',
    match: ['Loss Ratio'],
  },
  {
    id: 'earnedPremium',
    term: 'Earned Premium',
    th: 'เบี้ยประกันภัยที่ถือเป็นรายได้',
    body: 'เบี้ยที่ขายได้จะยังไม่นับเป็นรายได้ทั้งก้อนทันที แต่จะทยอยนับตามช่วงเวลาที่คุ้มครองไปแล้ว เช่น กรมธรรม์ 1 ปีผ่านไป 3 เดือน นับเป็นรายได้ประมาณหนึ่งในสี่',
    game: 'เกมทำให้ง่ายขึ้นโดยนับเบี้ยที่ขายได้เป็นรายได้ครึ่งหนึ่งในไตรมาสนั้น และอีกครึ่งในไตรมาสถัดไป',
    match: ['Earned Premium'],
  },
  {
    id: 'paidLoss',
    term: 'Paid Loss',
    th: 'ค่าสินไหมจ่ายแล้ว',
    body: 'เงินค่าสินไหมที่จ่ายออกไปจริงในไตรมาสนี้ ยังไม่รวมเคลมที่เกิดแล้วแต่ยังไม่ได้จ่าย',
    match: ['Paid Loss'],
  },
  {
    id: 'incurredLoss',
    term: 'Incurred Loss',
    th: 'ค่าสินไหมที่เกิดขึ้น',
    body: 'ค่าสินไหมที่จ่ายแล้วรวมกับเงินสำรองที่ตั้งไว้สำหรับเคลมที่ยังรอจ่าย สะท้อนต้นทุนจริงของงานที่รับไว้ จึงใช้ตัวนี้คำนวณ Loss Ratio',
    match: ['Incurred Loss'],
  },
  {
    id: 'commission',
    term: 'Commission',
    th: 'ค่าบำเหน็จ/ค่านายหน้า',
    body: 'เงินที่จ่ายให้ช่องทางขาย เช่น ดีลเลอร์รถหรือตัวแทน คิดเป็นเปอร์เซ็นต์ของเบี้ยที่ขายได้ ช่องทางขายตรงไม่มีค่าใช้จ่ายส่วนนี้แต่ต้องใช้งบการตลาดแทน',
    match: ['Commission'],
  },
  {
    id: 'uwResult',
    term: 'U/W Result',
    th: 'ผลการรับประกันภัย',
    body: 'กำไรหรือขาดทุนจากการรับประกันล้วนๆ คือเบี้ยที่ถือเป็นรายได้ หักค่าสินไหมและค่าใช้จ่ายทั้งหมด ยังไม่รวมรายได้จากการลงทุน (U/W ย่อมาจาก Underwriting)',
    match: ['U/W Result'],
  },
  {
    id: 'productMix',
    term: 'Product Mix',
    th: 'สัดส่วนผลิตภัณฑ์',
    body: 'สัดส่วนของประกันแต่ละประเภทในพอร์ต เช่น รถยนต์ อัคคีภัย หรืออุบัติเหตุ แต่ละแบบมีเบี้ย ความถี่เคลม และความเสี่ยงต่างกัน การกระจายหลายแบบช่วยลดการพึ่งพาตลาดเดียว',
    match: ['Product mix'],
  },
  {
    id: 'appetite',
    term: 'Underwriting Appetite',
    th: 'นโยบายการรับประกัน',
    body: 'เกณฑ์ว่าบริษัทพร้อมรับลูกค้าหรือความเสี่ยงแบบไหน เข้มงวดได้พอร์ตคุณภาพดีแต่โตช้า เปิดกว้างโตเร็วแต่เสี่ยงได้ลูกค้าที่เคลมบ่อย',
    match: ['Underwriting appetite'],
  },
  {
    id: 'catExposure',
    term: 'Cat Exposure',
    th: 'ความเสี่ยงภัยพิบัติสะสม',
    body: 'มูลค่างานที่เรารับประกันไว้ในพื้นที่ที่อาจเสียหายพร้อมกันจากภัยธรรมชาติครั้งเดียว เช่น ที่ลุ่มน้ำท่วม ยิ่งกระจุกมาก เมื่อเกิดภัยก็ยิ่งเสียหายหนักในคราวเดียว',
    match: ['Cat exposure'],
  },
  {
    id: 'brand',
    term: 'Brand Awareness',
    th: 'การรู้จักแบรนด์',
    body: 'สัดส่วนคนที่รู้จักและนึกถึงแบรนด์เราเมื่อจะซื้อประกัน สร้างได้ด้วยการตลาดและบริการที่คนบอกต่อ และค่อยๆ จางลงถ้าไม่ดูแล',
    game: 'คะแนน 0–100 เริ่มที่ 50 ดึงลูกค้าใหม่ทุกช่องทาง ช่องทางตรง (Direct) ไวที่สุด เพราะลูกค้าหาเราเอง',
    match: ['Brand Awareness'],
  },
  {
    id: 'service',
    term: 'Service Quality',
    th: 'คุณภาพบริการ',
    body: 'ความสามารถของบริษัทในการดูแลลูกค้า ตั้งแต่รับสาย จ่ายเคลม จนถึงซ่อมรถ เป็นสิ่งที่ต้องลงทุนสร้างและใช้เวลา ต่างจากความพึงพอใจที่ขึ้นลงตามประสบการณ์ล่าสุดของลูกค้า',
    game: 'คะแนน 0–100 เริ่มที่ 55 ขึ้นเมื่อลงทุนบริการ ลดเมื่องานล้นกำลัง ช่วยเพิ่มอัตราต่ออายุและดึงความพึงพอใจขึ้น',
    match: ['Service Quality'],
  },
  {
    id: 'pa',
    term: 'PA',
    th: 'ประกันอุบัติเหตุส่วนบุคคล',
    body: 'ย่อมาจาก Personal Accident คุ้มครองการบาดเจ็บ ทุพพลภาพ หรือเสียชีวิตจากอุบัติเหตุ เบี้ยต่อกรมธรรม์ไม่สูงและเคลมไม่บ่อย',
    match: ['PA'],
  },
  {
    id: 'motorClass',
    term: 'ประกันรถชั้น 1 / 2+ / 3+',
    th: 'ระดับความคุ้มครองประกันรถยนต์',
    body: 'ชั้น 1 คุ้มครองรถเราเกือบทุกกรณีรวมถึงชนแบบไม่มีคู่กรณี เบี้ยสูงสุด ส่วน 2+ และ 3+ คุ้มครองรถเราเฉพาะชนกับยานพาหนะที่มีคู่กรณี เบี้ยถูกกว่าและนิยมกับรถอายุมาก',
    match: ['ชั้น 1', '2\\+ และ 3\\+'],
  },
]

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((g) => [g.id, g])) as Record<string, GlossaryEntry>

const escape = (s: string) => s.replace(/[.*?^${}()|[\]/]/g, '\\$&')
/** Longest patterns first, so "Cat XL" wins over "XL". */
const PATTERNS = GLOSSARY.flatMap((g) => g.match.map((m) => ({ id: g.id, src: m })))
  .sort((a, b) => b.src.length - a.src.length)
  .map(({ id, src }) => ({ id, re: /^[A-Za-z]/.test(src) ? `\\b${src.includes('\\') ? src : escape(src)}\\b` : src }))
const RE = new RegExp(PATTERNS.map((p) => `(${p.re})`).join('|'), 'gi')

/** Split text into plain parts and glossary hits (each term only once per text). */
export function splitTerms(text: string, skip: string[] = []): ({ text: string } | { text: string; id: string })[] {
  const out: ({ text: string } | { text: string; id: string })[] = []
  const seen = new Set(skip)
  let last = 0
  for (const m of text.matchAll(RE)) {
    const idx = m.slice(1).findIndex((g) => g !== undefined)
    const id = PATTERNS[idx].id
    if (seen.has(id)) continue
    seen.add(id)
    const end = m.index! + m[0].length
    if (m.index! > last) out.push({ text: text.slice(last, m.index) })
    out.push({ text: m[0], id })
    last = end
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}
