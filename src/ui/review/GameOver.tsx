import { Flag, Lightbulb, Printer, RotateCcw, Swords, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { createPortal } from 'react-dom'
import { portraitKey } from '../../assets/portraits'
import { spriteUrl } from '../../assets/registry'
import { lessons, turningPoints, winnerNote, type Lesson, type TurningPoint, type WinnerNote } from '../../game/narrative/lessons'
import { sumPnl } from '../../game/sim/channels'
import { P } from '../../game/sim/params'
import type { GameState } from '../../game/types'
import { useGameStore } from '../../store/useGameStore'
import { Glossed } from '../glossary/Term'
import { Stage } from '../Stage'
import { useState } from 'react'
import { mb, pct } from './format'
import { PnlTable } from './PnlTable'

const PARTS = [
  { k: 'capital', label: 'เงินทุน', max: 30 },
  { k: 'share', label: 'ส่วนแบ่งตลาด', max: 25 },
  { k: 'cr', label: 'Combined Ratio เฉลี่ย', max: 25 },
  { k: 'cx', label: 'ความพอใจลูกค้า', max: 20 },
] as const

/** One KPI across the game, with markers on the quarters where something big happened. */
function TimelineChart({ g, title, values, fmt, line, lineLabel, color, higherIsBetter = true }: { g: GameState; title: string; values: number[]; fmt: (v: number) => string; line?: number; lineLabel?: string; color: string; higherIsBetter?: boolean }) {
  const W = 330
  const H = 130
  const lo = Math.min(...values, line ?? Infinity)
  const hi = Math.max(...values, line ?? -Infinity)
  const pad = (hi - lo) * 0.12 || 1
  const y = (v: number) => 14 + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - 36)
  const x = (i: number) => 30 + (i / Math.max(1, values.length - 1)) * (W - 50)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const log = g.sim.log ?? []
  const marks = log.flatMap((l, i) => {
    const m: { i: number; kind: 'flood' | 'cut' | 'renewal' }[] = []
    if (l.flood === 'hit') m.push({ i: i + 1, kind: 'flood' })
    if (Object.values(l.priceMoves ?? {}).some((v) => v < 0)) m.push({ i: i + 1, kind: 'cut' })
    if (l.renewal !== null) m.push({ i: i + 1, kind: 'renewal' })
    return m
  })
  const first = values[0]
  const lastV = values[values.length - 1]
  const better = (lastV - first) * (higherIsBetter ? 1 : -1) >= 0
  return (
    <div className="rounded-2xl bg-white border border-navy-900/5 px-3 py-2.5" data-chart={title}>
      <div className="flex items-baseline justify-between">
        <span className="font-display font-semibold text-[14.5px] text-navy-900">
          <Glossed text={title} />
        </span>
        <span className={`text-[13px] font-semibold ${better ? 'text-emerald-700' : 'text-red-700'}`}>
          {fmt(first)} → {fmt(lastV)}
        </span>
      </div>
      {/* scales with its column (screen or A4) */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
        {line !== undefined && (
          <g>
            <line x1={30} x2={W - 20} y1={y(line)} y2={y(line)} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.7} />
            <text x={W - 20} y={y(line) - 4} textAnchor="end" fontSize={10} fill="#b91c1c">
              {lineLabel}
            </text>
          </g>
        )}
        <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={2.4} fill={color} />
        ))}
        {marks.map((m, k) => (
          <g key={k} transform={`translate(${x(m.i)} ${H - 12})`}>
            <circle r={6.5} fill={m.kind === 'flood' ? '#2f7bff' : m.kind === 'cut' ? '#ef4444' : '#22c55e'} />
            <text y={3.5} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={700}>
              {m.kind === 'flood' ? 'น' : m.kind === 'cut' ? 'ล' : 'ต'}
            </text>
          </g>
        ))}
        {values.map((_, i) =>
          i === 0 || i === values.length - 1 || i % 4 === 0 ? (
            <text key={`t${i}`} x={x(i)} y={H - 24} textAnchor="middle" fontSize={9.5} fill="#0b1f4b" fillOpacity={0.5}>
              {i === 0 ? 'เริ่ม' : `Q${i}`}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  )
}

function Debrief({ g, ls, tps, wn }: { g: GameState; ls: Lesson[]; tps: TurningPoint[]; wn: WinnerNote | null }) {
  const o = g.outcome!
  const me = o.standings.find((s) => s.id === 'player')!
  const top = o.standings[0]
  const name = (id: string) => (id === 'player' ? g.config.companyName : (g.competitors.find((c) => c.id === id)?.name ?? id))
  const kh = g.kpiHistory
  const line = g.config.startingCapitalMB * P.bankruptcyFraction
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[380px_1fr] gap-3">
        {/* score: ours vs the winner (or runner-up when we won) */}
        <div className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3" data-score>
          <div className="font-display font-semibold text-[15.5px] text-navy-900">คะแนน {me.score} / 100</div>
          <div className="text-[12px] text-navy-700/65 mb-2">เทียบกับ{top.id === 'player' ? `อันดับ 2 (${name(o.standings[1].id)})` : `ผู้ชนะ (${name(top.id)} ${top.score} คะแนน)`}</div>
          {PARTS.map((pt) => {
            const ref = top.id === 'player' ? o.standings[1] : top
            const a = me.parts?.[pt.k] ?? 0
            const b = ref.parts?.[pt.k] ?? 0
            return (
              <div key={pt.k} className="mb-1.5">
                <div className="flex justify-between text-[12.5px] text-navy-800">
                  <span>
                    <Glossed text={pt.label} /> <span className="text-navy-700/50">(เต็ม {pt.max})</span>
                  </span>
                  <span className="tabular-nums">
                    <b className="text-brand-600">{a.toFixed(1)}</b> · {b.toFixed(1)}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-navy-900/8 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-navy-900/25" style={{ width: `${(b / pt.max) * 100}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-brand-500 h-1 top-0.5" style={{ width: `${(a / pt.max) * 100}%` }} />
                </div>
              </div>
            )
          })}
          <div className="text-[11px] text-navy-700/55">แถบน้ำเงิน = เรา · แถบเทา = บริษัทที่เทียบ</div>
        </div>
        <div className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3">
          <table className="w-full text-[13.5px]" data-table="final">
            <thead>
              <tr className="text-navy-700/65 text-left text-[12px]">
                <th className="py-1">อันดับ</th>
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
                  <td className="py-1.5">{i === 0 ? <Trophy size={15} className="text-gold-500" /> : i + 1}</td>
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
          <p className="mt-1.5 text-[11.5px] text-navy-700/60">คะแนน = เงินทุนที่เติบโต 30 + ส่วนแบ่งตลาด 25 + CR เฉลี่ย 25 + ความพอใจลูกค้า 20 · ตัวเลขจำลองเพื่อเกม</p>
        </div>
      </div>

      {/* the road */}
      <div>
        <div className="font-display font-semibold text-[16px] text-navy-900 mb-1.5 flex items-center gap-2">
          เส้นทางตลอดเกม
          <span className="text-[11.5px] font-normal text-navy-700/65">
            หมุด: <b className="text-brand-600">น</b> น้ำท่วมเกิดจริง · <b className="text-red-600">ล</b> ลดราคา · <b className="text-emerald-600">ต</b> ฤดูต่ออายุ
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <TimelineChart g={g} title="เงินทุน (ล้านบาท)" values={kh.map((k) => k.capitalMB)} fmt={(v) => mb(v)} line={line} lineLabel="เส้นหยุดรับประกัน" color="#d98a07" />
          <TimelineChart g={g} title="ส่วนแบ่งตลาด" values={kh.map((k) => k.marketShare)} fmt={(v) => pct(v)} color="#2f7bff" />
          <TimelineChart g={g} title="Combined Ratio" values={kh.map((k) => k.combinedRatio)} fmt={(v) => pct(v, 0)} line={1} lineLabel="100% = เท่าทุน" color="#22a06b" higherIsBetter={false} />
        </div>
      </div>

      {/* turning points */}
      <div>
        <div className="font-display font-semibold text-[16px] text-navy-900 mb-1.5 flex items-center gap-2">
          <Flag size={17} className="text-brand-600" /> 3 จุดเปลี่ยนของเกม
        </div>
        <div className="grid grid-cols-3 gap-3">
          {tps.map((t, i) => (
            <div key={i} data-turning-point className={`rounded-2xl bg-white border-l-4 px-4 py-3 ${t.tone === 'good' ? 'border-good' : 'border-alert'}`}>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-navy-700/70">
                {t.tone === 'good' ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-red-600" />} {t.label}
              </div>
              <div className="text-[13.5px] text-navy-900 leading-snug mt-0.5">
                <Glossed text={t.text} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* lessons */}
      <div className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3">
        <div className="font-display font-semibold text-[16px] text-navy-900 mb-2 flex items-center gap-2">
          <Lightbulb size={17} className="text-gold-600" /> บทเรียนจากเกมนี้
        </div>
        <ol className="space-y-2.5">
          {ls.map((l, i) => (
            <li key={l.id} data-lesson={l.id} className="flex gap-3">
              <span className={`shrink-0 grid place-items-center size-6 rounded-full text-[12px] font-bold text-white ${l.tone === 'good' ? 'bg-good' : 'bg-alert'}`}>{i + 1}</span>
              <div>
                <div className="font-semibold text-[14.5px] text-navy-900">{l.title}</div>
                <div className="text-[13.5px] text-navy-800 leading-relaxed">
                  <Glossed text={l.text} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <DebriefPnl g={g} />

      {/* what the winner did */}
      {wn && (
        <div className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3" data-winner-note>
          <div className="font-display font-semibold text-[16px] text-navy-900 mb-1 flex items-center gap-2">
            <Swords size={17} className="text-brand-600" /> {wn.winnerId === 'player' ? 'เราชนะได้อย่างไร' : `${wn.winnerName} ชนะได้อย่างไร`}
          </div>
          <p className="text-[13.5px] text-navy-800 leading-relaxed">
            <Glossed text={wn.text} />
          </p>
        </div>
      )}
    </div>
  )
}

/** Underwriting P&L for the whole game or one year; a full year can be compared with the year before. */
function DebriefPnl({ g }: { g: GameState }) {
  const log = g.sim.log ?? []
  const years = Array.from({ length: Math.ceil(log.length / 4) }, (_, i) => log.slice(i * 4, i * 4 + 4))
  const [period, setPeriod] = useState<number>(-1) // -1 = whole game
  const pnl = period < 0 ? sumPnl(log.map((l) => l.pnl)) : sumPnl(years[period].map((l) => l.pnl))
  const full = (i: number) => years[i]?.length === 4
  const prev = period > 0 && full(period) && full(period - 1) ? sumPnl(years[period - 1].map((l) => l.pnl)) : null
  if (!pnl) return null
  return (
    <div data-debrief-pnl>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-display font-semibold text-[16px] text-navy-900">งบการรับประกัน (U/W)</span>
        <div className="ml-2 flex gap-1" data-print-hide>
          {[-1, ...years.map((_, i) => i)].map((i) => (
            <button
              key={i}
              data-period={i}
              onClick={() => setPeriod(i)}
              className={`h-8 px-3 rounded-full text-[12.5px] font-medium ${period === i ? 'bg-navy-800 text-white' : 'bg-white/80 text-navy-800 hover:bg-white'}`}
            >
              {i < 0 ? 'ทั้งเกม' : `ปีที่ ${i + 1}${full(i) ? '' : ` (${years[i].length} ไตรมาส)`}`}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12px] text-navy-700/60">{period < 0 ? `รวม ${log.length} ไตรมาส` : `ปีที่ ${period + 1}`} · ล้านบาท</span>
      </div>
      <PnlTable key={period} pnl={pnl} prev={prev} prevLabel={`ปีที่ ${period}`} />
    </div>
  )
}

/** End-of-game debrief: result, the road, turning points, lessons, and what the winner did. */
export function GameOver() {
  const game = useGameStore((s) => s.game)
  const restart = useGameStore((s) => s.restart)
  const o = game.outcome
  if (!o) return null
  const won = o.playerRank === 1 && o.reason === 'completed'
  const ls = lessons(game)
  const tps = turningPoints(game)
  const wn = winnerNote(game)
  const title = o.reason === 'bankrupt' ? 'บริษัทต้องหยุดรับประกัน' : won ? 'ยินดีด้วย คุณคือผู้นำตลาด' : `จบที่อันดับ ${o.playerRank} จาก ${o.standings.length}`
  const kicker = o.reason === 'bankrupt' ? `เงินทุนต่ำกว่าครึ่งของทุนเริ่มต้น เกมจบที่ไตรมาส ${game.sim.log?.length ?? ''}` : `จบเกม ${game.config.quarters} ไตรมาส`
  return (
    <>
      <div className="fixed inset-0" style={{ backdropFilter: 'blur(8px)', background: 'rgba(7,21,55,0.6)' }} />
      <Stage>
        <section data-screen="gameover" className="absolute left-1/2 -translate-x-1/2 w-[75%] min-w-[1180px] top-6 bottom-6 glass rounded-[30px] pointer-events-auto anim-rise flex flex-col overflow-hidden">
          <header className="flex items-center gap-4 px-8 pt-4 pb-3">
            <img
              src={spriteUrl(portraitKey('advisor', won ? 'happy' : 'shocked') ?? (won ? 'characters/advisor-happy' : 'characters/advisor-warning'))}
              alt=""
              className="portrait-fade h-[92px] w-[86px] object-contain object-bottom"
            />
            <div>
              <div className="text-[13px] text-brand-600 font-medium">
                สรุปบทเรียน · {game.config.companyName} · {kicker}
              </div>
              <h1 className="font-display font-bold text-[28px] leading-tight text-navy-900">{title}</h1>
            </div>
            <div className="ml-auto flex gap-2.5">
              <button data-action="print" onClick={() => window.print()} className="h-12 px-5 rounded-2xl bg-white/90 text-navy-900 font-medium flex items-center gap-2 hover:bg-white shadow-sm">
                <Printer size={18} /> พิมพ์ / บันทึก PDF
              </button>
              <button onClick={restart} className="h-12 px-6 rounded-2xl btn-gold flex items-center gap-2 font-display font-bold text-[17px] hover:brightness-105">
                <RotateCcw size={18} /> เล่นใหม่
              </button>
            </div>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-6">
            <Debrief g={game} ls={ls} tps={tps} wn={wn} />
          </div>
        </section>
      </Stage>
      {/* print version: a plain A4 document, only visible when printing */}
      {createPortal(
        <div className="print-only" data-print>
          <div className="text-[12px] text-brand-600 font-medium">Insure Universe · สรุปบทเรียน · {game.config.playerName} · {game.config.companyName}</div>
          <h1 className="font-display font-bold text-[24px] text-navy-900 mb-1">{title}</h1>
          <div className="text-[12px] text-navy-700/70 mb-3">
            {kicker} · ระดับ {game.config.difficulty} · ตัวเลขทั้งหมดเป็นผลจำลองของเกม ไม่ใช่ข้อมูลตลาดจริง
          </div>
          <Debrief g={game} ls={ls} tps={tps} wn={wn} />
        </div>,
        document.body,
      )}
    </>
  )
}
