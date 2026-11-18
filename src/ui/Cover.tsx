import { CalendarRange, Coins, Gauge, Play, Swords, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { preloadAssets } from '../assets/preload'
import { brandUrl } from '../assets/registry'
import { DIFFICULTIES, GAME_LENGTHS, STARTING_CAPITAL_MB } from '../game/config'
import type { Difficulty, GameLength } from '../game/types'
import { useGameStore } from '../store/useGameStore'
import { Stage } from './Stage'

const DIFF_NOTE: Record<Difficulty, string> = {
  easy: 'คู่แข่งตอบโต้ช้า ภัยพิบัติน้อย',
  normal: 'สมดุล เหมาะกับการเล่นครั้งแรก',
  hard: 'คู่แข่งดุ ตลาดผันผวน',
}

/** Keep the bar on screen long enough to read, even when assets come from cache. */
const MIN_LOADING_MS = 1400

function Choice<T extends string | number>({ value, on, onPick, children }: { value: T; on: boolean; onPick: (v: T) => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => onPick(value)}
      className={`flex-1 h-12 rounded-2xl text-[16px] font-medium transition-all duration-200 ${
        on ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-[0_8px_18px_-8px_rgba(29,95,224,0.9)]' : 'bg-white/80 text-navy-800 hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}

/** Game setup, shown only after the player presses Start. */
function ModeModal({ onClose }: { onClose: () => void }) {
  const start = useGameStore((s) => s.startGame)
  const [quarters, setQuarters] = useState<GameLength>(12)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="absolute inset-0 grid place-items-center pointer-events-auto" style={{ background: 'rgba(6,18,46,0.55)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <section role="dialog" aria-label="เลือกโหมดเกม" className="relative w-[640px] glass rounded-[30px] p-7 anim-rise" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="ปิด" className="absolute top-4 right-4 grid place-items-center size-9 rounded-full bg-white/90 text-navy-800 hover:bg-white shadow">
          <X size={18} />
        </button>
        <h2 className="font-display font-bold text-[26px] text-navy-900">เลือกโหมดเกม</h2>
        <p className="text-[14px] text-navy-700/70">คุณคือ CEO บริษัทประกันวินาศภัย แข่งกับคู่แข่ง AI อีก 4 บริษัท</p>
        <div className="flex items-center gap-2 text-[14px] text-navy-700/80 mt-5 mb-2">
          <CalendarRange size={17} className="text-brand-600" /> ระยะเวลาเกม
        </div>
        <div className="flex gap-2.5">
          {GAME_LENGTHS.map((g) => (
            <Choice key={g.quarters} value={g.quarters} on={quarters === g.quarters} onPick={setQuarters}>
              {g.label}
            </Choice>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[14px] text-navy-700/80 mt-4 mb-2">
          <Gauge size={17} className="text-brand-600" /> ระดับความยาก
          <span className="ml-auto text-[13px] text-navy-700/60">{DIFF_NOTE[difficulty]}</span>
        </div>
        <div className="flex gap-2.5">
          {DIFFICULTIES.map((d) => (
            <Choice key={d.id} value={d.id} on={difficulty === d.id} onPick={setDifficulty}>
              {d.label}
            </Choice>
          ))}
        </div>
        <div className="flex items-center gap-5 mt-6">
          <div className="text-[13.5px] text-navy-800 space-y-1">
            <div className="flex items-center gap-2"><Coins size={16} className="text-gold-600" /> ทุนเริ่มต้น {STARTING_CAPITAL_MB.toLocaleString('th-TH')} ล้านบาท</div>
            <div className="flex items-center gap-2"><Swords size={16} className="text-brand-600" /> ตลาดประกันวินาศภัยไทย</div>
          </div>
          <button
            onClick={() => start({ quarters, difficulty })}
            className="ml-auto h-[66px] w-[260px] rounded-[22px] btn-gold shine flex items-center justify-center gap-3 font-display font-bold text-[24px] hover:brightness-105 hover:-translate-y-0.5 transition-all"
          >
            เริ่มเลย <Play size={24} fill="currentColor" />
          </button>
        </div>
      </section>
    </div>
  )
}

/** Title screen: cover art + logo, loading bar while assets load, then Start → mode modal. */
export function Cover() {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    let alive = true
    const t0 = performance.now()
    preloadAssets((p) => alive && setProgress(p)).then(() => {
      const wait = Math.max(0, MIN_LOADING_MS - (performance.now() - t0))
      setTimeout(() => alive && setReady(true), wait)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <div className="fixed inset-0 overflow-hidden bg-[#8fc3f0]">
        <img src={brandUrl('cover.jpg')} alt="" draggable={false} className="absolute inset-0 size-full object-cover cover-drift" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.18), transparent 55%), linear-gradient(180deg, transparent 60%, rgba(7,21,55,0.45) 100%)' }} />
      </div>
      <Stage>
        <img
          src={brandUrl('logo.webp')}
          alt="Insure Universe"
          draggable={false}
          className="absolute left-1/2 top-[120px] w-[600px] -translate-x-1/2 drop-shadow-[0_22px_34px_rgba(6,30,80,0.5)] logo-float"
        />
        <div className="absolute left-1/2 bottom-[70px] -translate-x-1/2 w-[620px] h-[110px] grid place-items-center pointer-events-auto">
          {!ready ? (
            <div className="w-full anim-rise" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-[30px] rounded-full p-[4px] glass-dark">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out shine"
                  style={{ width: `${Math.max(4, progress * 100)}%`, background: 'linear-gradient(180deg, #d6ff7a 0%, #8fe03c 55%, #5cbf1f 100%)', boxShadow: '0 0 14px rgba(160,240,80,0.65)' }}
                />
              </div>
              <div className="mt-2.5 text-center text-white font-display font-semibold text-[20px] tracking-wide drop-shadow-[0_2px_4px_rgba(4,16,48,0.7)]">
                กำลังโหลด… {Math.round(progress * 100)}%
              </div>
            </div>
          ) : (
            <button
              onClick={() => setModal(true)}
              className="h-[80px] w-[340px] rounded-[26px] btn-gold shine flex items-center justify-center gap-3 font-display font-bold text-[30px] hover:brightness-105 hover:-translate-y-0.5 transition-all anim-rise"
            >
              <Play size={30} fill="currentColor" /> เริ่มเกม
            </button>
          )}
        </div>
        {modal && <ModeModal onClose={() => setModal(false)} />}
      </Stage>
    </>
  )
}
