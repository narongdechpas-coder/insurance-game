import { BookOpen, Flag, ListOrdered, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { GLOSSARY } from '../../game/glossary'
import { useGameStore } from '../../store/useGameStore'
import { Glossed } from '../glossary/Term'
import { ModalShell } from './ModalShell'

const TABS = [
  { id: 'goal', label: 'เป้าหมาย', icon: Flag },
  { id: 'turn', label: 'เล่น 1 ไตรมาส', icon: ListOrdered },
  { id: 'cause', label: 'ผลของการตัดสินใจ', icon: Sparkles },
  { id: 'terms', label: 'คำศัพท์', icon: BookOpen },
] as const
type Tab = (typeof TABS)[number]['id']

function Item({ n, title, children }: { n: number | string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 grid place-items-center size-7 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 text-white text-[13px] font-bold">{n}</span>
      <div>
        <div className="font-display font-semibold text-[16px] text-navy-900">{title}</div>
        <div className="text-[14px] text-navy-800 leading-relaxed">{children}</div>
      </div>
    </li>
  )
}

/** How to play, how the score works, what moves the numbers, and a glossary. */
export function GuideModal() {
  const [tab, setTab] = useState<Tab>('goal')
  const game = useGameStore((s) => s.game)
  const start = game.config.startingCapitalMB.toLocaleString('th-TH')
  return (
    <ModalShell id="guide" kicker="คู่มือ CEO" title="วิธีบริหาร Universe ให้ชนะ" width={920}>
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              data-guide-tab={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 h-10 px-4 rounded-full text-[14.5px] font-medium transition-all ${
                tab === t.id ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow' : 'bg-white/80 text-navy-800 hover:bg-white'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'goal' && (
        <ol className="space-y-3.5">
          <Item n={1} title="คุณคือ CEO แข่งกับบริษัท AI อีก 4 ราย">
            เริ่มด้วยเงินทุน {start} ล้านบาท เล่น {game.config.quarters} ไตรมาส ทุกไตรมาสตัดสินใจครั้งเดียว แล้วดูผลพร้อมกับคู่แข่ง
          </Item>
          <Item n={2} title="ชนะด้วยคะแนนรวมสูงสุดตอนจบเกม (เต็ม 100)">
            <span className="block">• เงินทุน 30 คะแนน: เต็มเมื่อทุนโตเป็น 2 เท่าของตอนเริ่ม</span>
            <span className="block">• ส่วนแบ่งตลาด 25 คะแนน: เต็มที่ 30%</span>
            <span className="block">
              • <Glossed text="Combined Ratio" /> เฉลี่ยทั้งเกม 25 คะแนน: เต็มเมื่อต่ำกว่า 93% ได้ 0 เมื่อถึง 105%
            </span>
            <span className="block">• ความพอใจลูกค้า 20 คะแนน: เต็มที่ 5 ดาว ได้ 0 ที่ 2.5 ดาว</span>
          </Item>
          <Item n={3} title="รักษาเงินทุนให้เหนือเส้นทุนขั้นต่ำ">ทุนขั้นต่ำ = 12.5% ของเบี้ยทั้งปี (ตอนเริ่มราว 1,000 ล้านบาท) ยิ่งขายมาก เส้นยิ่งสูง ถ้าเงินทุนต่ำกว่าเส้น บริษัทต้องหยุดรับประกันและเกมจบทันที · เป็นกติกาของเกม ไม่ใช่เกณฑ์ CAR ของ คปภ.</Item>
          <Item n="!" title="ไม่มีทางเลือกที่ดีที่สุดตลอดไป">โตเร็วมักแลกกับกำไรหรือความเสี่ยง ดูภาพรวม 4 ด้าน (โต · กำไร · เสี่ยง · ลูกค้า) ก่อนยืนยันแผนทุกครั้ง ดูอันดับปัจจุบันได้ที่ปุ่มถ้วยรางวัล</Item>
        </ol>
      )}

      {tab === 'turn' && (
        <ol className="space-y-3.5">
          <Item n={1} title="อ่านสถานการณ์ใน Command Center">ดูเหตุการณ์สำคัญของไตรมาสด้านล่าง คลิกตึกเพื่อดูว่าหน่วยงานนั้นเจออะไร หัวหน้าแผนกจะทำหน้าตามสถานการณ์</Item>
          <Item n={2} title="รับมือเหตุการณ์">เข้าห้องตัดสินใจ แล้วตอบทุกเหตุการณ์ก่อน แต่ละทางใช้งบจากก้อนเดียวกับกลยุทธ์</Item>
          <Item n={3} title="วางกลยุทธ์">
            เลือกทิศทางของแต่ละการ์ด แล้วเลือกวิธีทำ งบกลยุทธ์ไตรมาสละ 7.5% ของเบี้ยไตรมาสก่อน (เริ่มที่ราว 150 ล้านบาท) · ค่าที่เลือกใช้ต่อทุกไตรมาสจนกว่าจะเปลี่ยน บางการ์ดเปิดให้ใช้ตั้งแต่ไตรมาส 2 และ 3 น้องพลอยจะเตือนเมื่อแผนขัดกันเอง
          </Item>
          <Item n={4} title="ยืนยันแผน แล้วดูเมืองทำงาน 3 เดือน">เห็นเบี้ยเข้า เคลมออก งานล้น และความเคลื่อนไหวของคู่แข่ง ปรับความเร็วหรือข้ามได้ในหน้าตั้งค่า</Item>
          <Item n={5} title="อ่านหนังสือพิมพ์และรายงานไตรมาส">ดูว่าทำไมผลออกมาแบบนี้ คู่แข่งทำอะไร และงบการรับประกันแยกช่องทาง เกมบันทึกให้อัตโนมัติทุกไตรมาส</Item>
        </ol>
      )}

      {tab === 'cause' && (
        <ol className="space-y-3.5">
          <Item n={1} title="ผลไม่ได้มาทันทีทั้งหมด">บนการ์ดมีป้ายบอกว่าเห็นผลเร็วหรือช้า และผลอยู่นานแค่ไหน การตลาดบางแบบเห็นผลทันทีแต่หายเร็ว ส่วนการลงทุนเครือข่ายใช้เวลาแต่ผลอยู่นาน</Item>
          <Item n={2} title="ราคาเบี้ยทยอยมีผลราว 3 ไตรมาส">เพราะกรมธรรม์เดิมยังไม่ครบรอบต่ออายุ ถ้าตั้งราคาแพงกว่าตลาดมากเกินไป ลูกค้าดีจะย้ายไปคู่แข่ง เหลือแต่ลูกค้าที่เคลมบ่อย</Item>
          <Item n={3} title="งานเกินกำลังทีมมีราคาที่ต้องจ่าย">โตเร็วแต่ไม่เพิ่มกำลังสายด่วน ทีมสินไหม หรืออู่ ความพอใจจะตก ต้นทุนเคลมสูงขึ้น และอาจเกิดเหตุการณ์ต่อเนื่องในไตรมาสถัดไป</Item>
          <Item n={4} title="ภัยใหญ่ทดสอบการป้องกันความเสี่ยง">
            <Glossed text="น้ำท่วมทำให้เคลมพุ่งในคราวเดียว ประกันภัยต่อ อย่าง Quota share หรือ Cat XL ช่วยรับส่วนหนึ่งไว้ แลกกับค่าคุ้มครองที่จ่ายทุกไตรมาส" />
          </Item>
          <Item n={5} title="คู่แข่งมีนิสัยของตัวเอง">บางรายตัดราคา บางรายเน้นบริการ บางรายเน้นดิจิทัล ดูท่าทีที่คาดไว้ได้ในหน้า Market ก่อนตัดสินใจ</Item>
        </ol>
      )}

      {tab === 'terms' && (
        <div className="grid grid-cols-2 gap-2.5" data-glossary-list>
          {GLOSSARY.map((g) => (
            <div key={g.id} className="rounded-2xl bg-white/85 border border-brand-100 px-4 py-3">
              <div className="font-display font-semibold text-[15.5px] text-navy-900">
                {g.term} <span className="text-[12.5px] font-normal text-brand-600">· {g.th}</span>
              </div>
              <p className="text-[13px] text-navy-800 leading-relaxed mt-0.5">{g.body}</p>
              {g.game && <p className="text-[12px] text-navy-700/75 mt-1">ในเกม: {g.game}</p>}
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-[12px] text-navy-700/55">ตัวเลขและกลไกในเกมเป็นแบบจำลองเพื่อการเรียนรู้ ไม่ใช่ข้อมูลตลาดจริง</p>
    </ModalShell>
  )
}
