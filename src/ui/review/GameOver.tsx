import { RotateCcw, Trophy } from 'lucide-react'
import { portraitKey } from '../../assets/portraits'
import { spriteUrl } from '../../assets/registry'
import { useGameStore } from '../../store/useGameStore'
import { Stage } from '../Stage'
import { mb, pct } from './format'

/** Final standings after the last quarter (or bankruptcy). */
export function GameOver() {
  const game = useGameStore((s) => s.game)
  const restart = useGameStore((s) => s.restart)
  const o = game.outcome
  if (!o) return null
  const name = (id: string) => (id === 'player' ? game.config.companyName : (game.competitors.find((c) => c.id === id)?.name ?? id))
  const won = o.playerRank === 1 && o.reason === 'completed'
  return (
    <>
      <div className="fixed inset-0" style={{ backdropFilter: 'blur(8px)', background: 'rgba(7,21,55,0.6)' }} />
      <Stage>
        <section data-screen="gameover" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[860px] glass rounded-[30px] p-8 pointer-events-auto anim-rise">
          <div className="flex items-center gap-5">
            <img
              src={spriteUrl(portraitKey('advisor', won ? 'happy' : 'shocked') ?? (won ? 'characters/advisor-happy' : 'characters/advisor-warning'))}
              alt=""
              className={`object-contain object-bottom ${portraitKey('advisor') ? 'h-[140px] w-[130px]' : 'h-[150px] w-[90px]'}`}
            />
            <div>
              <div className="text-[14px] text-brand-600 font-medium">{o.reason === 'bankrupt' ? 'เงินทุนต่ำกว่าครึ่งของทุนเริ่มต้น เกมจบก่อนกำหนด' : `จบเกม ${game.config.quarters} ไตรมาส`}</div>
              <h1 className="font-display font-bold text-[32px] leading-tight text-navy-900">
                {o.reason === 'bankrupt' ? 'บริษัทต้องหยุดรับประกัน' : won ? 'ยินดีด้วย คุณคือผู้นำตลาด' : `จบที่อันดับ ${o.playerRank} จาก ${o.standings.length}`}
              </h1>
            </div>
          </div>
          <table className="w-full mt-5 text-[14.5px]">
            <thead>
              <tr className="text-navy-700/70 text-left">
                <th className="py-1.5">อันดับ</th>
                <th>บริษัท</th>
                <th className="text-right">คะแนน</th>
                <th className="text-right">เงินทุน (ล้านบาท)</th>
                <th className="text-right">ส่วนแบ่ง</th>
                <th className="text-right">CR เฉลี่ย</th>
                <th className="text-right">ความพอใจ</th>
              </tr>
            </thead>
            <tbody>
              {o.standings.map((s, i) => (
                <tr key={s.id} className={`border-t border-navy-900/5 ${s.id === 'player' ? 'font-semibold text-brand-600' : 'text-navy-900'}`}>
                  <td className="py-2">{i === 0 ? <Trophy size={16} className="text-gold-500" /> : i + 1}</td>
                  <td>{name(s.id)}</td>
                  <td className="text-right tabular-nums">{s.score}</td>
                  <td className="text-right tabular-nums">{mb(s.capital)}</td>
                  <td className="text-right tabular-nums">{pct(s.share)}</td>
                  <td className="text-right tabular-nums">{pct(s.avgCombinedRatio)}</td>
                  <td className="text-right tabular-nums">{s.satisfaction.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[12px] text-navy-700/60">คะแนน = เงินทุนที่เติบโต 30 + ส่วนแบ่งตลาด 25 + CR เฉลี่ย 25 + ความพอใจลูกค้า 20 · ตัวเลขจำลองเพื่อเกม</p>
          <button onClick={restart} className="mt-5 h-[60px] w-full rounded-[20px] btn-gold flex items-center justify-center gap-3 font-display font-bold text-[21px] hover:brightness-105">
            <RotateCcw size={22} /> เล่นใหม่
          </button>
        </section>
      </Stage>
    </>
  )
}
