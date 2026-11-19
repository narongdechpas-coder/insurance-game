import { Box, Building2, Home, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { InstallButton } from '../InstallButton'
import { ModalShell } from './ModalShell'

const SPEEDS = [
  { v: 1, label: 'ปกติ', note: 'ดูเมืองทำงานครบ 3 เดือน (ราว 7 วินาที)' },
  { v: 2, label: 'เร็ว 2 เท่า', note: 'เหลือราว 4 วินาที' },
  { v: 0, label: 'ข้าม', note: 'ไปหนังสือพิมพ์ทันที' },
] as const

const CITY_STYLES = [
  { v: 'walkup', label: 'ตึกแถว Walk-up', note: 'ตึกขาวเตี้ยๆ เต็มเมือง ดูมีชีวิต', icon: Building2 },
  { v: 'massing', label: 'โมเดลโปร่ง', note: 'กล่องขาวโปร่ง เน้นตึกหลักให้เด่น', icon: Box },
] as const

export function SettingsModal() {
  const cityStyle = useGameStore((s) => s.settings.cityStyle)
  const setCityStyle = useGameStore((s) => s.setCityStyle)
  const speed = useGameStore((s) => s.settings.runSpeed)
  const setSpeed = useGameStore((s) => s.setRunSpeed)
  const toCover = useGameStore((s) => s.toCover)
  const deleteSave = useGameStore((s) => s.deleteSave)
  const q = useGameStore((s) => s.game.quarter)
  const [confirm, setConfirm] = useState(false)
  return (
    <ModalShell id="settings" title="ตั้งค่า" width={620}>
      <div className="text-[14px] text-navy-700/80 mb-2">ความเร็วตอนเมืองเล่นผลไตรมาส</div>
      <div className="grid grid-cols-3 gap-2.5">
        {SPEEDS.map((s) => (
          <button
            key={s.v}
            data-speed={s.v}
            onClick={() => setSpeed(s.v)}
            className={`rounded-2xl px-3 py-2.5 text-left transition-all ${speed === s.v ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow' : 'bg-white/80 text-navy-800 hover:bg-white'}`}
          >
            <div className="font-display font-semibold text-[16px]">{s.label}</div>
            <div className={`text-[12px] ${speed === s.v ? 'text-white/85' : 'text-navy-700/65'}`}>{s.note}</div>
          </button>
        ))}
      </div>

      <div className="text-[14px] text-navy-700/80 mt-5 mb-2">รูปแบบตึกรอบเมือง</div>
      <div className="grid grid-cols-2 gap-2.5">
        {CITY_STYLES.map((c) => {
          const Icon = c.icon
          const on = cityStyle === c.v
          return (
            <button
              key={c.v}
              data-city-style={c.v}
              onClick={() => setCityStyle(c.v)}
              className={`rounded-2xl px-3 py-2.5 text-left flex items-center gap-3 transition-all ${on ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow' : 'bg-white/80 text-navy-800 hover:bg-white'}`}
            >
              <Icon size={22} className="shrink-0" />
              <span>
                <span className="block font-display font-semibold text-[16px]">{c.label}</span>
                <span className={`block text-[12px] ${on ? 'text-white/85' : 'text-navy-700/65'}`}>{c.note}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-white/80 px-4 py-3 flex items-center gap-3 text-[14px] text-navy-800">
        <Save size={18} className="text-good shrink-0" />
        เกมบันทึกอัตโนมัติทุกครั้งที่จบไตรมาส ตอนนี้บันทึกถึงปีที่ {q.year} ไตรมาส {q.q} แล้ว (เก็บไว้ในเบราว์เซอร์เครื่องนี้)
      </div>

      <InstallButton className="mt-4 flex justify-start" />
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button onClick={toCover} data-action="to-cover" className="h-12 rounded-2xl bg-white/90 text-navy-900 font-medium flex items-center justify-center gap-2 hover:bg-white shadow-sm">
          <Home size={18} /> กลับหน้าแรก (เล่นต่อได้)
        </button>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} data-action="delete-save" className="h-12 rounded-2xl bg-alert/10 text-red-700 font-medium flex items-center justify-center gap-2 hover:bg-alert/15">
            <Trash2 size={18} /> ลบเกมที่บันทึกไว้
          </button>
        ) : (
          <button onClick={deleteSave} data-action="delete-save-confirm" className="h-12 rounded-2xl bg-alert text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110">
            <Trash2 size={18} /> ยืนยันลบ เริ่มใหม่หมด
          </button>
        )}
      </div>
    </ModalShell>
  )
}
