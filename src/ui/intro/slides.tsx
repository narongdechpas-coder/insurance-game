import { ArrowRight, Building2, CheckCheck, ClipboardList, Compass, Cpu, Gauge, Handshake, Languages, LineChart, Map, MessageCircleQuestion, Play, Scale, ShieldCheck, Siren, Target, Umbrella, Users, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { RIVAL_ART } from '../../assets/registry'
import { STARTING_CAPITAL_MB } from '../../game/config'
import { COMPETITORS } from '../../game/data/competitors'
import { STYLE } from '../../game/narrative/rivals'
import OPS_JSON from '../../game/data/operations.json'
import { P } from '../../game/sim/params'
import { Card, cover, img, logo, MockTag, Slide } from './kit'

export interface IntroSlide {
  body: ReactNode
  /** what the facilitator says; shown with N */
  notes: string
}

const PLAYER_SHARE = 0.2 // src/game/sim/init.ts: the player starts with 20% of the in-game market

/* 1 ─ cover */
const s1: IntroSlide = {
  body: (
    <div className="absolute inset-0">
      <img src={cover()} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,16,42,0.88)_0%,rgba(6,16,42,0.6)_45%,rgba(6,16,42,0.05)_80%)]" />
      <div className="relative px-[96px] pt-[150px] text-white max-w-[980px]">
        <img src={logo()} alt="Insure Universe" className="w-[360px] drop-shadow-[0_16px_24px_rgba(0,0,0,0.45)]" />
        <h1 className="font-display font-bold text-[62px] leading-[1.15] mt-8 [text-shadow:0_3px_12px_rgba(0,0,0,0.5)]">
          ลองเป็น CEO บริษัทประกันวินาศภัย 12 ไตรมาส
        </h1>
        <p className="text-[26px] text-white/90 mt-5 leading-snug">
          เกมจำลองการวางแผนธุรกิจประกันวินาศภัย สำหรับผู้บริหารที่อยากเห็นว่าแต่ละการตัดสินใจไปกระทบตัวเลขของบริษัทอย่างไร
        </p>
      </div>
    </div>
  ),
  notes:
    'เปิดด้วยบทบาท: วันนี้ทุกคนเป็น CEO ของบริษัทประกันวินาศภัยหนึ่งบริษัท บริหาร 3 ปี (12 ไตรมาส) แข่งกับอีก 4 บริษัท\nย้ำว่าเป็นเกมจำลอง ตัวเลขและชื่อบริษัทในเกมเป็นสมมติทั้งหมด ไม่ใช่ข้อมูลของบริษัทหรือตลาดจริง',
}

/* 2 ─ learning goals */
const CHAIN = [
  { icon: Scale, label: 'ราคาเบี้ย' },
  { icon: LineChart, label: 'ยอดขาย' },
  { icon: Users, label: 'ภาระงานทีม' },
  { icon: Gauge, label: 'Loss Ratio' },
  { icon: Wallet, label: 'เงินทุน' },
]
const GOALS = [
  { n: '1', t: 'เห็นความเชื่อมโยง', d: 'การปรับเรื่องหนึ่ง เช่น ลดราคา ส่งผลต่อยอดขาย งานของทีม Loss Ratio และเงินทุนเป็นทอดๆ' },
  { n: '2', t: 'ตัดสินใจภายใต้ข้อจำกัด', d: 'มีงบกลยุทธ์ก้อนเดียวต่อไตรมาส ต้องแบ่งระหว่างรับมือเหตุการณ์กับลงทุนตามแผน' },
  { n: '3', t: 'อ่านผลแล้วปรับแผน', d: 'ทุกไตรมาสมีสรุปผลว่าอะไรทำให้ตัวเลขขยับ ใช้ปรับแผนไตรมาสถัดไป' },
]
const s2: IntroSlide = {
  body: (
    <Slide kicker="เป้าหมายการเรียนรู้" title="การตัดสินใจเรื่องเดียวกระทบทั้งแผน เกมนี้ฝึกให้เห็นภาพนั้น">
      <div className="flex items-center gap-3">
        {CHAIN.map(({ icon: Icon, label }, k) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full bg-white border border-brand-100 shadow-sm pl-2 pr-6 py-2">
              <span className="grid place-items-center size-12 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 text-white">
                <Icon size={24} />
              </span>
              <span className="font-display font-semibold text-[24px] text-navy-900">{label}</span>
            </div>
            {k < CHAIN.length - 1 && <ArrowRight size={28} className="text-brand-400" />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6 mt-14">
        {GOALS.map((g) => (
          <Card key={g.n} className="p-9 min-h-[330px]">
            <div className="font-display font-bold text-[56px] leading-none text-brand-500">{g.n}</div>
            <div className="font-display font-bold text-[32px] text-navy-900 mt-3">{g.t}</div>
            <p className="text-[23px] leading-relaxed text-navy-800 mt-3">{g.d}</p>
          </Card>
        ))}
      </div>
    </Slide>
  ),
  notes:
    'แผนธุรกิจประกันมีหลายส่วนที่ผูกกันอยู่ ในงานจริงแต่ละฝ่ายมักเห็นแค่ส่วนของตัวเอง\nเกมนี้ย่อทั้งห่วงโซ่ให้เห็นในจอเดียว: ราคา → ยอดขาย → ภาระงาน → Loss Ratio → เงินทุน\nชวนผู้เรียนจับตาว่าการตัดสินใจของตัวเองส่งผลไปถึงปลายทางทางไหน',
}

/* 3 ─ expected benefits */
const FOR_PLAYERS = [
  { icon: LineChart, t: 'เห็นภาพ P&L ประกันทั้งเส้น', d: 'ตั้งแต่เบี้ยประกัน สินไหม ค่าใช้จ่าย ประกันภัยต่อ จนถึงเงินทุน' },
  { icon: Scale, t: 'เข้าใจ trade-off', d: 'ระหว่างการเติบโต กำไร ความเสี่ยง และความพอใจลูกค้า' },
  { icon: Gauge, t: 'อ่าน KPI หลักได้คล่อง', d: 'GWP · Loss Ratio · Combined Ratio · เงินทุนเทียบเส้นขั้นต่ำ' },
  { icon: Target, t: 'ฝึกตัดสินใจภายใต้ความไม่แน่นอน', d: 'งบจำกัด เหตุการณ์ไม่คาดคิด และคู่แข่งที่ตอบโต้' },
]
const FOR_ORG = [
  { icon: Languages, t: 'ภาษากลางเรื่องแผนธุรกิจ', d: 'ทุกฝ่ายใช้คำและตัวชี้วัดชุดเดียวกันเวลาคุยแผน' },
  { icon: Handshake, t: 'เห็นว่างานของฝ่ายตัวเองกระทบผลบริษัทอย่างไร', d: 'ขาย สินไหม ปฏิบัติการ IT และการเงิน อยู่ในแผนเดียวกัน' },
  { icon: Compass, t: 'จุดตั้งต้นคุยแผนและงบประมาณจริง', d: 'ใช้บทเรียนจากเกมเป็นโจทย์เปิดวงคุยแผนของบริษัท' },
]
function BenefitList({ items }: { items: typeof FOR_ORG }) {
  return (
    <div className="space-y-7">
      {items.map(({ icon: Icon, t, d }) => (
        <div key={t} className="flex gap-4">
          <span className="shrink-0 grid place-items-center size-14 rounded-2xl bg-brand-50 text-brand-600">
            <Icon size={28} />
          </span>
          <div>
            <div className="font-display font-semibold text-[26px] text-navy-900 leading-tight">{t}</div>
            <div className="text-[20px] text-navy-700/85 leading-snug mt-1">{d}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
const s3: IntroSlide = {
  body: (
    <Slide kicker="ประโยชน์ที่คาดว่าจะได้รับ" title="ผู้เล่นได้จำลองบทบาท CEO องค์กรได้พัฒนาองค์ความรู้ด้านกลยุทธ์">
      <div className="grid grid-cols-2 gap-7 h-[560px]">
        <Card className="p-9 h-full">
          <div className="flex items-center gap-3 mb-7">
            <span className="rounded-full bg-brand-500 text-white px-4 py-1.5 font-display font-semibold text-[20px]">สำหรับผู้เล่น</span>
          </div>
          <BenefitList items={FOR_PLAYERS} />
        </Card>
        <Card className="p-9 h-full">
          <div className="flex items-center gap-3 mb-7">
            <span className="rounded-full bg-navy-900 text-white px-4 py-1.5 font-display font-semibold text-[20px]">สำหรับองค์กร</span>
          </div>
          <BenefitList items={FOR_ORG} />
        </Card>
      </div>
    </Slide>
  ),
  notes:
    'เป็นประโยชน์ที่ "คาดว่า" จะได้ ยังไม่ได้วัดผลจริง\nฝั่งผู้เล่น: เห็น P&L ประกันครบทั้งเส้น และเข้าใจว่าทุกการตัดสินใจมีราคาที่ต้องจ่ายที่อื่น\nฝั่งองค์กร: ผู้บริหารจากต่างฝ่ายใช้ภาษาเดียวกัน และนำบทเรียนไปเปิดวงคุยแผนและงบประมาณจริง',
}

/* 4 ─ the setup */
const SCORE = [
  { t: 'เงินทุน', w: 30, d: 'ทุนปลายเกมเทียบทุนตั้งต้น' },
  { t: 'ส่วนแบ่งตลาด', w: 25, d: 'ส่วนแบ่ง 30% ได้เต็ม' },
  { t: 'Combined Ratio', w: 25, d: 'เฉลี่ยต่ำกว่า 93% ได้เต็ม' },
  { t: 'ความพอใจลูกค้า', w: 20, d: 'คะแนนดาว 5 ดาวได้เต็ม' },
]
const pct = (x: number) => `${Math.round(x * 100)}%`
const s4: IntroSlide = {
  body: (
    <Slide kicker="กติกาเริ่มต้น" title={`เราแข่งกับ 4 บริษัท ด้วยทุนตั้งต้น ${STARTING_CAPITAL_MB.toLocaleString('th-TH')} ล้านบาท`}>
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-5 border-2 border-brand-500 text-center">
          <img src={img('buildings/hq')} alt="" className="h-[110px] mx-auto object-contain" />
          <div className="font-display font-bold text-[22px] text-navy-900 mt-2">บริษัทของเรา</div>
          <div className="text-[17px] text-navy-700/80">ผู้เล่นเป็น CEO</div>
          <div className="font-display font-bold text-[30px] text-brand-600 mt-1">{pct(PLAYER_SHARE)}</div>
        </Card>
        {COMPETITORS.map((c) => (
          <Card key={c.id} className="p-5 text-center">
            <img src={img(RIVAL_ART[c.id])} alt="" className="h-[110px] mx-auto object-contain" />
            <div className="font-display font-bold text-[22px] mt-2" style={{ color: c.color }}>{c.name}</div>
            <div className="text-[17px] text-navy-700/80">{STYLE[c.personality].label}</div>
            <div className="font-display font-bold text-[30px] text-navy-900 mt-1">{pct(c.marketShare)}</div>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[17px] text-navy-700/80">
        <Building2 size={18} /> ตัวเลขใต้ชื่อ = ส่วนแบ่งตลาดตอนเริ่มเกม · ชื่อบริษัทคู่แข่งตั้งขึ้นเอง <MockTag className="ml-2" />
      </div>
      <Card className="p-7 mt-6">
        <div className="flex items-baseline justify-between">
          <div className="font-display font-bold text-[28px] text-navy-900">จบ 12 ไตรมาส ตัดสินจากคะแนน 100 คะแนน</div>
          <div className="text-[18px] text-navy-700/70">ล้มละลายถ้าเงินทุนต่ำกว่าเส้นขั้นต่ำ</div>
        </div>
        <div className="flex mt-5 h-[64px] rounded-2xl overflow-hidden">
          {SCORE.map((p, k) => (
            <div key={p.t} className={`flex items-center justify-center gap-2 text-white font-display font-semibold text-[22px] ${['bg-brand-600', 'bg-brand-500', 'bg-[#14b8a6]', 'bg-[#f59e0b]'][k]}`} style={{ width: `${p.w}%` }}>
              {p.t} {p.w}
            </div>
          ))}
        </div>
        <div className="flex mt-2">
          {SCORE.map((p) => (
            <div key={p.t} className="text-[17px] text-navy-700/80 px-1" style={{ width: `${p.w}%` }}>{p.d}</div>
          ))}
        </div>
      </Card>
    </Slide>
  ),
  notes:
    'ทุกคนเริ่มเท่ากัน: บริษัทของเรามีส่วนแบ่ง 20% ทุนตั้งต้น 2,000 ล้านบาท (ตัวเลขสมมติในเกม)\nคู่แข่ง 4 รายมีนิสัยต่างกัน Super Save บุกราคา Prestige ขายบริการพรีเมียม Digitech เน้นออนไลน์ Guardian ระมัดระวัง และตอบโต้สิ่งที่เราทำ\nคะแนนไม่ได้ดูแค่ยอดขาย: เงินทุน 30 ส่วนแบ่ง 25 Combined Ratio 25 ความพอใจลูกค้า 20 โตอย่างเดียวไม่ชนะ\nถ้าเงินทุนต่ำกว่าเส้นขั้นต่ำ (12.5% ของเบี้ยทั้งปีในเกม) ถือว่าล้มละลาย จบเกมทันที',
}

/* 5 ─ one quarter */
const LOOP = [
  { icon: Map, t: 'ดูเมือง', d: 'สถานะบริษัท ตึกของแต่ละฝ่าย และเหตุการณ์ของไตรมาส', art: 'icons/event-ev' },
  { icon: Siren, t: '① รับมือเหตุการณ์', d: 'ทุกเหตุการณ์ต้องเลือก 1 ใน 3 ทาง', art: 'icons/event-flood', step: true },
  { icon: ClipboardList, t: '② วางกลยุทธ์', d: 'ราคา ช่องทาง คน/ระบบ ประกันภัยต่อ และการ์ดอื่น', art: 'buildings/marketing', step: true },
  { icon: CheckCheck, t: '③ ยืนยันแผน', d: 'ทบทวนทั้งแผนกับงบ ก่อนกดยืนยัน', art: 'buildings/hq', step: true },
  { icon: Play, t: 'ตลาดเดิน', d: 'ดูเบี้ย เคลม และคู่แข่งขยับทีละเดือน', art: 'buildings/dealer' },
  { icon: LineChart, t: 'สรุปผล', d: 'อะไรทำให้ตัวเลขขยับ และควรปรับอะไรต่อ', art: 'buildings/market-intel' },
]
const s5: IntroSlide = {
  body: (
    <Slide kicker="วิธีเล่น" title="แต่ละไตรมาสมี 3 ขั้นตัดสินใจ แล้วจึงดูผล">
      <div className="grid grid-cols-6 gap-3 items-stretch">
        {LOOP.map(({ icon: Icon, t, d, art, step }, k) => (
          <div key={t} className="relative">
            <Card className={`h-full px-5 pt-5 pb-6 flex flex-col items-center text-center ${step ? 'border-2 border-brand-500' : ''}`}>
              <img src={img(art)} alt="" className="h-[96px] object-contain" />
              <span className={`mt-3 grid place-items-center size-11 rounded-full ${step ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}>
                <Icon size={22} />
              </span>
              <div className="font-display font-bold text-[24px] text-navy-900 mt-3 leading-tight">{t}</div>
              <p className="text-[18px] text-navy-700/85 leading-snug mt-2">{d}</p>
            </Card>
            {k < LOOP.length - 1 && <ArrowRight size={24} className="absolute -right-[18px] top-1/2 -translate-y-1/2 text-brand-400 z-10" />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5 mt-8">
        {[
          ['งบกลยุทธ์ต่อไตรมาส', 'มีงบก้อนเดียว ใช้ทั้งรับมือเหตุการณ์และลงทุนตามแผน'],
          ['ค่าที่ตั้งไว้ใช้ต่อ', 'ราคา ค่าคอม และจำนวนคน ใช้ต่อทุกไตรมาสจนกว่าจะเปลี่ยน'],
          ['AI Business Advisor', 'เตือนเมื่อแผนเสี่ยง เช่น ทุนใกล้เส้นขั้นต่ำ หรือทีมรับงานไม่ไหว'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl bg-brand-50/80 px-6 py-4">
            <div className="font-display font-semibold text-[22px] text-navy-900">{t}</div>
            <div className="text-[18px] text-navy-700/85 mt-1">{d}</div>
          </div>
        ))}
      </div>
    </Slide>
  ),
  notes:
    'หนึ่งไตรมาสเริ่มจากหน้าเมือง ดูสถานะบริษัทและเหตุการณ์ของไตรมาส แล้วเข้าห้องตัดสินใจ 3 ขั้น\n① รับมือเหตุการณ์: ต้องตอบทุกเรื่อง ② วางกลยุทธ์: ปรับการ์ดต่างๆ ③ ยืนยันแผน: เช็คงบรวม\nจากนั้นตลาดเดินทีละเดือน และจบด้วยหน้าสรุปผลที่บอกว่าอะไรทำให้ตัวเลขขยับ\nย้ำ: ค่าที่ตั้งไว้ใช้ต่อทุกไตรมาส ไม่ต้องตั้งใหม่ทุกครั้ง',
}

/* 6 ─ the map: game decisions ↔ business-plan components (key slide) */
const MAP_ROWS: [string, string, string][] = [
  ['ราคาเบี้ย (5 กลุ่มลูกค้า)', 'Pricing และ rate adequacy', 'GWP · Loss Ratio'],
  ['ช่องทางขาย (Dealer · Agent · Direct)', 'กลยุทธ์ช่องทางและต้นทุนการได้มาซึ่งลูกค้า', 'GWP · Expense Ratio'],
  ['การตลาดและแบรนด์', 'Brand และการหาลูกค้าใหม่', 'Brand Awareness · ยอดขายใหม่'],
  ['ทีมงานและระบบ', 'Operating model และกำลังรองรับงาน', 'Expense Ratio · Service Quality'],
  ['การเงินและประกันภัยต่อ', 'Reinsurance และการบริหารเงินทุน', 'ผลรับประกันสุทธิ · เงินทุน'],
  ['Product mix', 'Portfolio mix ของสายผลิตภัณฑ์', 'การเติบโต · Loss Ratio'],
  ['Underwriting appetite', 'การคัดเลือกความเสี่ยง (UW guideline)', 'Loss Ratio · ส่วนแบ่งตลาด'],
  ['เครือข่ายอู่', 'การบริหารต้นทุนสินไหม', 'Loss Ratio · ความพอใจลูกค้า'],
  ['Cat exposure', 'การสะสมความเสี่ยงภัยธรรมชาติ', 'ความเสียหายน้ำท่วม · เงินทุน'],
  ['รับมือเหตุการณ์', 'แผนรับมือสถานการณ์และความเสี่ยง', 'ใช้งบก้อนเดียวกับกลยุทธ์'],
]
const s6: IntroSlide = {
  body: (
    <Slide kicker="เชื่อมกับงานจริง" title="ทุกปุ่มในเกมตรงกับองค์ประกอบของแผนธุรกิจประกันจริง">
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_1.25fr_1fr] bg-navy-900 text-white font-display font-semibold text-[21px]">
          <div className="px-7 py-3.5">การตัดสินใจในเกม</div>
          <div className="px-7 py-3.5">องค์ประกอบของแผนธุรกิจ</div>
          <div className="px-7 py-3.5">ตัวชี้วัดที่ขยับ</div>
        </div>
        {MAP_ROWS.map(([g, b, k], r) => (
          <div key={g} className={`grid grid-cols-[1fr_1.25fr_1fr] text-[19.5px] ${r % 2 ? 'bg-brand-50/50' : 'bg-white'}`}>
            <div className="px-7 py-[9px] font-semibold text-navy-900">{g}</div>
            <div className="px-7 py-[9px] text-navy-800">{b}</div>
            <div className="px-7 py-[9px] text-brand-700">{k}</div>
          </div>
        ))}
      </Card>
    </Slide>
  ),
  notes:
    'นี่คือสไลด์หลัก ทุกการตัดสินใจในเกมตรงกับหัวข้อที่อยู่ในแผนธุรกิจประกันวินาศภัย\nชวนผู้เรียนจับคู่กับฝ่ายของตัวเอง เช่น ฝ่ายขายดูแถวช่องทาง ฝ่ายสินไหมดูแถวเครือข่ายอู่และทีมงาน\nคอลัมน์ขวาบอกว่าแต่ละเรื่องไปขยับตัวชี้วัดไหน ใช้เป็นแผนที่ตอนอ่านหน้าสรุปผล\nการ์ด Product mix และ Underwriting ปลดล็อกไตรมาส 2 ส่วนเครือข่ายอู่และ Cat exposure ปลดล็อกไตรมาส 3',
}

/* 7 ─ price now, loss ratio later */
const lag = P.rateLagWeights // earned rate = this quarter, last, the one before
const s7: IntroSlide = {
  body: (
    <Slide kicker="ราคากับ Loss Ratio" title="ลดราคาได้ยอดทันที แต่ Loss Ratio ทยอยตามมาอีกหลายไตรมาส">
      <div className="grid grid-cols-[1.25fr_1fr] gap-8 items-center">
        <Card className="p-7">
          <div className="flex items-center justify-between">
            <div className="font-display font-semibold text-[22px] text-navy-900">ถ้าลดราคาในไตรมาส 1 (ภาพประกอบแนวคิด)</div>
            <MockTag />
          </div>
          <svg viewBox="0 0 640 300" className="w-full mt-3">
            {[0, 1, 2, 3, 4].map((q) => (
              <g key={q}>
                <line x1={70 + q * 130} y1={30} x2={70 + q * 130} y2={250} stroke="#dbe6fb" strokeDasharray="4 6" />
                <text x={70 + q * 130} y={282} textAnchor="middle" fontSize="20" fill="#3b4a6b">{q === 0 ? 'ก่อน' : `Q${q}`}</text>
              </g>
            ))}
            <polyline points="70,200 200,92 330,90 460,88 590,88" fill="none" stroke="#1d5fe0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="70,212 200,205 330,182 460,160 590,152" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <text x={590} y={70} fontSize="21" fill="#1d5fe0" textAnchor="end" fontWeight="600">ยอดขาย: ขึ้นทันที</text>
            <text x={590} y={190} fontSize="21" fill="#ef4444" textAnchor="end" fontWeight="600">Loss Ratio: ค่อยๆ สูงขึ้น</text>
          </svg>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <div className="font-display font-bold text-[24px] text-navy-900">อัตราเบี้ยมีผลกับ LR ช้ากว่ายอดขาย</div>
            <p className="text-[19px] text-navy-800 mt-2 leading-snug">
              ในเกม อัตราเบี้ยที่มีผลกับ Loss Ratio คิดจากไตรมาสนี้ {Math.round(lag[0] * 100)}% ไตรมาสก่อน {Math.round(lag[1] * 100)}% และก่อนหน้านั้น {Math.round(lag[2] * 100)}% เลยใช้ราว 3 ไตรมาสกว่าจะเห็นผลเต็ม
            </p>
          </Card>
          <Card className="p-6">
            <div className="font-display font-bold text-[24px] text-navy-900">บริการดี ขึ้นราคาได้มากกว่า</div>
            <p className="text-[19px] text-navy-800 mt-2 leading-snug">ถ้าตั้งราคาสูงกว่าตลาด ลูกค้าที่พอใจบริการจะยอมจ่ายมากกว่า ความพอใจลูกค้าจึงเป็นเครื่องมือด้านราคาด้วย</p>
          </Card>
        </div>
      </div>
    </Slide>
  ),
  notes:
    'กราฟเป็นภาพประกอบแนวคิด ไม่ใช่ผลจากเกมจริง\nลดราคาแล้วยอดขายขึ้นทันที แต่ Loss Ratio ไม่ได้แย่ลงทันที เพราะอัตราเบี้ยทยอยมีผลราว 3 ไตรมาส (สัดส่วน 30/40/30 ในเกม)\nกับดักที่เจอบ่อยในเกม: เห็นยอดขึ้นในไตรมาสแรกแล้วคิดว่าได้ผล แต่ LR มาแย่ในอีก 2–3 ไตรมาส\nอีกด้าน: บริษัทที่บริการดีขึ้นราคาได้โดยเสียลูกค้าน้อยกว่า',
}

/* 8 ─ people and systems */
const pct0 = (x: number) => `${Math.round(x * 100)}%`
const s8: IntroSlide = {
  body: (
    <Slide kicker="คนและระบบ" title="โตเร็วโดยไม่เพิ่มคนหรือระบบ ต้นทุนบริการจะย้อนมากินกำไร">
      <div className="grid grid-cols-3 gap-6">
        <Card className="p-7 min-h-[360px]">
          <span className="grid place-items-center size-14 rounded-2xl bg-red-50 text-red-600"><Gauge size={28} /></span>
          <div className="font-display font-bold text-[26px] text-navy-900 mt-4">ทีมรับงานเกิน 100%</div>
          <p className="text-[20px] text-navy-800 mt-3 leading-relaxed">ยอดขายที่โตขึ้นมาพร้อมสายเข้า เคลม และงานซ่อมที่มากขึ้น ถ้าทีมรับไม่ไหว ลูกค้าจะพอใจน้อยลง และ Loss Ratio สูงขึ้น ถ้าภาระงานเกิน {pct0(P.consequenceThreshold)} จะเกิดเหตุการณ์ตามมาในไตรมาสถัดไป</p>
        </Card>
        <Card className="p-7 min-h-[360px]">
          <span className="grid place-items-center size-14 rounded-2xl bg-brand-50 text-brand-600"><Users size={28} /></span>
          <div className="font-display font-bold text-[26px] text-navy-900 mt-4">เพิ่มคน: เร็ว แต่เป็นต้นทุนคงที่</div>
          <p className="text-[20px] text-navy-800 mt-3 leading-relaxed">จ่ายเงินเดือนทันที ได้กำลังหลังอบรม 1 ไตรมาส รับเพิ่มได้ไม่เกิน {pct0(OPS_JSON.hireCapOfTeam)} ของทีมต่อไตรมาส ลดคนต้องจ่ายค่าชดเชย {OPS_JSON.severanceMonths} เดือน</p>
        </Card>
        <Card className="p-7 min-h-[360px]">
          <span className="grid place-items-center size-14 rounded-2xl bg-emerald-50 text-emerald-600"><Cpu size={28} /></span>
          <div className="font-display font-bold text-[26px] text-navy-900 mt-4">ลงระบบ: ช้า แต่ต้นทุนระยะยาวต่ำ</div>
          <p className="text-[20px] text-navy-800 mt-3 leading-relaxed">ทีม IT พัฒนาได้พร้อมกัน {OPS_JSON.itSlots} ระบบ ใช้เวลาหลายไตรมาส มีโอกาสล่าช้า {pct0(OPS_JSON.systemRisk.delay)} และลูกค้ากับคู่ค้าค่อยๆ ย้ายมาใช้</p>
        </Card>
      </div>
      <div className="flex items-center gap-3 mt-6 text-[18px] text-navy-700/85">
        <MockTag /> ต้นทุนแยกเป็นต้นทุนคงที่ (เงินเดือน ค่าเช่า IT) กับต้นทุนผันแปร (ค่าออกกรมธรรม์ ค่าสำรวจภัย) ทุกค่าเป็นสมมติฐานของเกม
      </div>
    </Slide>
  ),
  notes:
    'ยอดขายไม่ได้มาฟรี ลูกค้าใหม่ทำให้มีสายเข้า เคลม และงานซ่อมมากขึ้น ทีมงานคือเพดานของการเติบโต\nเลือกได้ 2 ทาง: เพิ่มคน ได้ผลไตรมาสถัดไปแต่เป็นต้นทุนคงที่ หรือลงระบบ ใช้เวลาหลายไตรมาสแต่ต้นทุนระยะยาวต่ำกว่า\nในเกม ถ้าทีมรับงานเกินราว 112% จะเกิดเหตุการณ์ตามมา เช่น สายด่วนแน่นหรือเคลมค้าง\nชวนคิด: ในบริษัทจริง ทีมไหนเป็นคอขวดของการเติบโต',
}

/* 9 ─ reinsurance and capital */
const sc = P.slidingScale
const s9: IntroSlide = {
  body: (
    <Slide kicker="ประกันภัยต่อและเงินทุน" title="ประกันภัยต่อคือการซื้อความมั่นคงของทุน ไม่ใช่แค่ค่าใช้จ่าย">
      <div className="grid grid-cols-[1fr_1.6fr] gap-7 items-stretch">
        <Card className="p-7 flex flex-col">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-14 rounded-2xl bg-red-50 text-red-600"><Wallet size={28} /></span>
            <div className="font-display font-bold text-[26px] text-navy-900">เส้นเงินทุนขั้นต่ำ</div>
          </div>
          <p className="text-[20px] text-navy-800 mt-4 leading-relaxed">
            ในเกม เงินทุนต้องไม่ต่ำกว่า {(P.minCapitalOfAnnualGwp * 100).toLocaleString("th-TH")}% ของเบี้ยทั้งปี ถ้าต่ำกว่าคือล้มละลาย จบเกมทันที
          </p>
          <p className="text-[20px] text-navy-800 mt-3 leading-relaxed">ยิ่งขายได้มาก เส้นนี้ก็ยิ่งสูงขึ้น การโตเร็วจึงต้องมีทุนรองรับ</p>
          <div className="mt-auto pt-5"><MockTag /></div>
        </Card>
        <div className="grid grid-rows-3 gap-4">
          <Card className="px-7 py-5 flex gap-5 items-start">
            <span className="shrink-0 grid place-items-center size-12 rounded-2xl bg-brand-50 text-brand-600"><ShieldCheck size={26} /></span>
            <div>
              <div className="font-display font-bold text-[23px] text-navy-900">Quota share {pct0(P.quotaShare.keep)} (ปรับเป็น {pct0(P.quotaShare.less)} หรือ {pct0(P.quotaShare.more)} ได้)</div>
              <p className="text-[19px] text-navy-800 mt-1 leading-snug">แบ่งเบี้ยและเคลมทุกกรมธรรม์ให้ reinsurer ลดความผันผวนทั้งพอร์ต แต่แบ่งกำไรออกไปด้วย</p>
            </div>
          </Card>
          <Card className="px-7 py-5 flex gap-5 items-start">
            <span className="shrink-0 grid place-items-center size-12 rounded-2xl bg-brand-50 text-brand-600"><Scale size={26} /></span>
            <div>
              <div className="font-display font-bold text-[23px] text-navy-900">ค่าคอมแบบ sliding scale ปรับตอนปิดปี</div>
              <p className="text-[19px] text-navy-800 mt-1 leading-snug">
                จ่ายเบื้องต้น {pct0(sc.provisional)} ทุกไตรมาส แล้วปรับตาม LR ทั้งปี: LR ดีขึ้น 1 จุด ค่าคอม +1 จุด ({pct0(sc.provisional)} ที่ LR {pct0(sc.atLR)}, ช่วง {pct0(sc.min)}–{pct0(sc.max)})
              </p>
            </div>
          </Card>
          <Card className="px-7 py-5 flex gap-5 items-start">
            <span className="shrink-0 grid place-items-center size-12 rounded-2xl bg-brand-50 text-brand-600"><Umbrella size={26} /></span>
            <div>
              <div className="font-display font-bold text-[23px] text-navy-900">Cat XL รับภัยใหญ่ เช่น น้ำท่วม</div>
              <p className="text-[19px] text-navy-800 mt-1 leading-snug">ส่วนที่เกิน {P.xl.retention.toLocaleString('th-TH')} ล้านต่อเหตุการณ์ reinsurer จ่ายให้ (วงเงิน {P.xl.limit.toLocaleString('th-TH')} ล้าน) สัญญาเป็นรายปี เลือกได้เฉพาะไตรมาส 1</p>
            </div>
          </Card>
        </div>
      </div>
    </Slide>
  ),
  notes:
    'หลายคนมองประกันภัยต่อเป็นแค่ค่าใช้จ่าย ในเกมจะเห็นว่าตอนไม่มีภัยใหญ่ ประกันภัยต่อดูเป็นต้นทุน แต่ปีที่น้ำท่วม ประกันภัยต่อคือสิ่งที่ทำให้ทุนไม่หลุดเส้นขั้นต่ำ\nเส้นทุนขั้นต่ำในเกมคือ 12.5% ของเบี้ยทั้งปี ขายได้มากขึ้นเส้นก็สูงขึ้น\nค่าคอมของ Quota share เป็น sliding scale รายปี คุมสินไหมดีได้ค่าคอมคืนมากขึ้น\nทุกค่าเป็นสมมติฐานของเกม ไม่ใช่เงื่อนไขของสัญญาจริงหรือข้อกำหนดของหน่วยงานกำกับ',
}

/* 10 ─ events */
const EVENTS = [
  { b: 'banners/flood', kind: 'ภัยคุกคาม', cls: 'bg-[#ef4444]', t: 'เสี่ยงน้ำท่วมภาคกลาง', d: 'เตรียมทีมสำรวจภัยและรถลากล่วงหน้า เตือนลูกค้าให้ย้ายรถขึ้นที่สูง หรือเฝ้าดูสถานการณ์ก่อน' },
  { b: 'banners/motor-show', kind: 'โอกาส', cls: 'bg-[#14b8a6]', t: 'ช่วงงาน Motor Show', d: 'ตั้งบูธร่วมกับค่ายรถ ทำแพ็กเกจราคาพิเศษเฉพาะงาน หรือไม่เข้าร่วม' },
  { b: 'banners/competitor', kind: 'คู่แข่ง', cls: 'bg-[#f59e0b]', t: 'คู่แข่งเตรียมโปรโมชันใหม่', d: 'จัดโปรตอบโต้ ให้บริการเสริมแทนการลดราคา หรือไม่ตอบโต้ เน้นลูกค้าคุณภาพ' },
]
const s10: IntroSlide = {
  body: (
    <Slide kicker="เหตุการณ์" title="เหตุการณ์ภายนอกใช้งบก้อนเดียวกับกลยุทธ์ จึงต้องเลือก">
      <div className="grid grid-cols-3 gap-6">
        {EVENTS.map((e) => (
          <Card key={e.t} className="overflow-hidden">
            <div className="relative h-[190px]">
              <img src={img(e.b)} alt="" className="absolute inset-0 size-full object-cover object-[center_35%]" />
              <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-white text-[16px] font-semibold ${e.cls}`}>{e.kind}</span>
            </div>
            <div className="p-6">
              <div className="font-display font-bold text-[25px] text-navy-900">{e.t}</div>
              <p className="text-[19px] text-navy-800 mt-2 leading-snug">{e.d}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6 mt-7">
        <div className="rounded-2xl bg-brand-50/80 px-6 py-4">
          <div className="font-display font-semibold text-[22px] text-navy-900">ทุกเหตุการณ์มี 3 ทางเลือก</div>
          <div className="text-[18px] text-navy-700/85 mt-1">แต่ละทางมีต้นทุน ความเร็วที่เห็นผล และตัวเลขเทียบกับการไม่ทำอะไร</div>
        </div>
        <div className="rounded-2xl bg-red-50 px-6 py-4">
          <div className="font-display font-semibold text-[22px] text-navy-900">บางเหตุการณ์เกิดจากการตัดสินใจของเราเอง</div>
          <div className="text-[18px] text-navy-700/85 mt-1">เช่น ทีมรับงานไม่ไหวจนสายด่วนแน่นหรือเคลมค้าง กลายเป็นโจทย์ในไตรมาสถัดไป</div>
        </div>
      </div>
    </Slide>
  ),
  notes:
    'เหตุการณ์มี 3 แบบ: ภัยคุกคาม โอกาส และการเคลื่อนไหวของคู่แข่ง ทุกเรื่องต้องเลือก 1 ใน 3 ทาง\nสำคัญคือใช้งบก้อนเดียวกับกลยุทธ์ ทุ่มรับมือเหตุการณ์มากก็เหลืองบลงทุนตามแผนน้อย\nบางเหตุการณ์เป็นผลจากการตัดสินใจของเราเอง เช่น โตเร็วจนทีมรับไม่ไหว\nชวนคิด: ในงานจริง แผนของเรามีงบสำรองสำหรับเหตุการณ์ไม่คาดคิดไหม',
}

/* 11 ─ reading the results */
const BRIDGE = [
  { t: 'ทุนต้นงวด', v: 2000, base: true },
  { t: 'ผลรับประกัน (ก่อนประกันภัยต่อ)', v: 180 },
  { t: 'ค่าประกันภัยต่อสุทธิ', v: -60 },
  { t: 'รายได้จากการลงทุน', v: 12 },
  { t: 'ทุนปลายงวด', v: 2132, base: true },
]
const s11: IntroSlide = {
  body: (
    <Slide kicker="อ่านผลไตรมาส" title="อ่านผลไตรมาสจาก Combined Ratio และการเปลี่ยนแปลงของเงินทุน">
      <div className="grid grid-cols-[1fr_1.15fr] gap-7">
        <Card className="p-7">
          <div className="font-display font-bold text-[26px] text-navy-900">Combined Ratio = Loss Ratio + Expense Ratio</div>
          <div className="flex items-end gap-5 mt-8 h-[230px]">
            {[
              ['Loss Ratio', 62, 'bg-[#ef4444]'],
              ['Expense Ratio', 35, 'bg-brand-500'],
            ].map(([t, v, c]) => (
              <div key={t as string} className="flex-1 flex flex-col items-center">
                <div className="font-display font-bold text-[26px] text-navy-900">{v as number}%</div>
                <div className={`w-full rounded-t-xl ${c}`} style={{ height: (v as number) * 1.7 }} />
                <div className="text-[18px] text-navy-800 mt-2">{t as string}</div>
              </div>
            ))}
            <div className="flex-1 flex flex-col items-center">
              <div className="font-display font-bold text-[26px] text-navy-900">97%</div>
              <div className="w-full flex flex-col" style={{ height: 97 * 1.7 }}>
                <div className="bg-brand-500 rounded-t-xl" style={{ flex: 35 }} />
                <div className="bg-[#ef4444]" style={{ flex: 62 }} />
              </div>
              <div className="text-[18px] text-navy-800 mt-2">Combined</div>
            </div>
          </div>
          <p className="text-[19px] text-navy-800 mt-5 leading-snug">(ตัวเลขตัวอย่าง) ต่ำกว่า 100% คือมีกำไรจากการรับประกัน หน้าสรุปผลยังแยก Combined Ratio ตามช่องทาง Dealer · Agent · Direct ด้วย</p>
        </Card>
        <Card className="p-7">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold text-[26px] text-navy-900">เงินทุนเปลี่ยนจากอะไร</div>
            <MockTag />
          </div>
          <div className="mt-5 space-y-2.5">
            {BRIDGE.map((b) => (
              <div key={b.t} className={`flex items-center justify-between rounded-xl px-5 py-3 text-[20px] ${b.base ? 'bg-navy-900 text-white font-semibold' : 'bg-brand-50/70 text-navy-900'}`}>
                <span>{b.t}</span>
                <span className={`tabular-nums font-semibold ${b.base ? '' : b.v < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {b.base ? '' : b.v > 0 ? '+' : '−'}{Math.abs(b.v).toLocaleString('th-TH')} ล้าน
                </span>
              </div>
            ))}
          </div>
          <p className="text-[18px] text-navy-700/80 mt-4 leading-snug">หน้าสรุปผลบอก 4 เรื่องใหญ่ที่ทำให้ตัวเลขขยับในไตรมาสนั้น พร้อมข้อแนะนำสำหรับไตรมาสถัดไป</p>
        </Card>
      </div>
    </Slide>
  ),
  notes:
    'หน้าสรุปผลทุกไตรมาสตอบ 2 คำถาม: รับประกันแล้วกำไรไหม (Combined Ratio) และเงินทุนเปลี่ยนเพราะอะไร\nตัวเลขในสไลด์นี้เป็นตัวอย่างสมมติเพื่ออธิบายวิธีอ่าน ไม่ใช่ผลจากเกมจริง\nชวนผู้เรียนดู Combined Ratio แยกตามช่องทาง เพื่อหาว่าช่องทางไหนทำกำไรหรือขาดทุน\nปัจจัยที่ทำให้ตัวเลขขยับถูกเรียงตามขนาดผลกระทบ ใช้เป็นจุดเริ่มปรับแผนไตรมาสถัดไป',
}

/* 12 ─ debrief questions */
const QUESTIONS = [
  'ไตรมาสไหนที่การตัดสินใจของเราส่งผลช้ากว่าที่คิด และในงานจริงมีเรื่องไหนที่มีจังหวะแบบนั้น',
  'เราเลือกโตหรือเลือกรักษากำไรตอนไหน ใช้ข้อมูลอะไรตัดสินใจ',
  'ทีมไหนเป็นคอขวดของการเติบโตในเกม และในบริษัทของเราคือทีมไหน',
  'ประกันภัยต่อที่ซื้อคุ้มกับความมั่นคงของทุนที่ได้ไหม ปีที่ไม่มีภัยใหญ่คิดอย่างไร',
  'ถ้าเขียนแผนปีหน้าของบริษัทจริง จะทำอะไรต่างจากเดิม 1 เรื่อง',
]
const s12: IntroSlide = {
  body: (
    <Slide kicker="หลังเล่น" title="คำถามชวนคิด: จากเกมกลับมาที่แผนของบริษัทเรา">
      <div className="grid grid-cols-[1.7fr_1fr] gap-8 items-center">
        <div className="space-y-4">
          {QUESTIONS.map((q, k) => (
            <Card key={q} className="flex items-center gap-5 px-6 py-4">
              <span className="shrink-0 grid place-items-center size-12 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 text-white font-display font-bold text-[22px]">{k + 1}</span>
              <span className="text-[22px] text-navy-900 leading-snug">{q}</span>
            </Card>
          ))}
        </div>
        <div className="flex flex-col items-center text-center">
          <img src={img('portraits/advisor-happy')} alt="" className="h-[420px] object-contain drop-shadow-[0_16px_24px_rgba(20,50,110,0.3)]" />
          <div className="flex items-center gap-2 mt-3 text-[20px] text-navy-700/85">
            <MessageCircleQuestion size={22} className="text-brand-600" /> คุยเป็นกลุ่ม แล้วแชร์ทีละทีม
          </div>
        </div>
      </div>
    </Slide>
  ),
  notes:
    'ใช้คำถามเหล่านี้หลังเล่นจบ แบ่งกลุ่มคุยตามทีมที่เล่น แล้วให้แต่ละทีมแชร์ 1–2 ข้อ\nคำถามสุดท้ายสำคัญที่สุด: ให้ทุกคนเขียน 1 เรื่องที่จะทำต่างไปในแผนจริง\n\nจุดที่ควรให้ผู้เชี่ยวชาญยืนยันก่อนใช้ deck นี้:\n1) การจับคู่การตัดสินใจในเกมกับองค์ประกอบของแผนธุรกิจ (สไลด์ 6) ใช้คำตรงกับที่บริษัทใช้ไหม\n2) กลไกประกันภัยต่อในเกม (Quota share, sliding scale รายปี, Cat XL) เป็นแบบย่อ ไม่ใช่เงื่อนไขสัญญาจริง\n3) เส้นทุนขั้นต่ำ 12.5% ของเบี้ยเป็นกติกาของเกม ไม่ใช่ข้อกำหนดของ คปภ.\n4) ตัวเลขทั้งหมดใน deck เป็นตัวเลขสมมติของเกม',
}

export const SLIDES: IntroSlide[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12]
