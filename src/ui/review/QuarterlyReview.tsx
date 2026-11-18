import { ArrowDownRight, ArrowUpRight, BookOpen, ChevronsRight, CloudRain, Coins, Gauge, Lightbulb, PieChart, Sparkles, Star, Swords, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { spriteUrl } from '../../assets/registry'
import { ADVISOR_NAME } from '../../game/narrative/advisor'
import { consequenceLines, floodLine, headline, recommendations } from '../../game/narrative/review'
import { useGameStore } from '../../store/useGameStore'
import { Stage } from '../Stage'
import { mb, pct, signed } from './format'
import { PnlTable } from './PnlTable'
import { RivalsPanel } from './RivalsPanel'
import { Sparkline } from './Sparkline'

type Tab = 'story' | 'rivals' | 'pnl'

/** Screen C — what happened this quarter, why, and what to do next. */
export function QuarterlyReview() {
  const game = useGameStore((s) => s.game)
  const next = useGameStore((s) => s.nextQuarter)
  const reviewOnly = useGameStore((s) => s.ui.reviewOnly)
  const closeReport = useGameStore((s) => s.closeReport)
  const [tab, setTab] = useState<Tab>('story')
  const r = game.lastReport
  if (!r) return null
  const h = headline(r)
  const hist = game.kpiHistory
  const flood = floodLine(r)
  const recs = recommendations(r, game)
  const cons = consequenceLines(r)
  const pose = h.tone === 'good' ? 'characters/advisor-happy' : h.tone === 'bad' ? 'characters/advisor-warning' : 'characters/advisor'
  const kpis = [
    { icon: Coins, label: 'เงินทุน', now: r.after.capitalMB, d: r.after.capitalMB - r.before.capitalMB, fmt: (v: number) => `${mb(v)} ล้าน`, good: 1, series: hist.map((k) => k.capitalMB), color: '#d98a07' },
    { icon: PieChart, label: 'ส่วนแบ่งตลาด', now: r.after.marketShare, d: r.after.marketShare - r.before.marketShare, fmt: (v: number) => pct(v), good: 1, series: hist.map((k) => k.marketShare), color: '#2f7bff' },
    { icon: Gauge, label: 'Combined Ratio', now: r.after.combinedRatio, d: r.after.combinedRatio - r.before.combinedRatio, fmt: (v: number) => pct(v), good: -1, series: hist.map((k) => k.combinedRatio), color: '#22a06b' },
    { icon: Star, label: 'ความพอใจ', now: r.after.satisfaction, d: r.after.satisfaction - r.before.satisfaction, fmt: (v: number) => v.toFixed(2), good: 1, series: hist.map((k) => k.satisfaction), color: '#e5487a' },
  ]
  const ranking = [
    { id: 'player', name: game.config.companyName, share: r.after.marketShare, me: true },
    ...game.competitors.map((c) => ({ id: c.id, name: c.name, share: c.marketShare, me: false })),
  ].sort((a, b) => b.share - a.share)

  return (
    <>
      <div className="fixed inset-0" style={{ backdropFilter: 'blur(8px) saturate(0.8)', background: 'rgba(7,21,55,0.55)' }} />
      <Stage>
        <section data-screen="review" className="absolute left-7 right-7 top-6 bottom-6 glass rounded-[30px] pointer-events-auto anim-rise flex flex-col overflow-hidden">
          {/* header */}
          <header className="flex items-center gap-5 px-8 pt-6 pb-4">
            <div>
              <div className="text-[13px] text-brand-600 font-medium">
                Quarterly Review · ปีที่ {r.quarter.year} ไตรมาส {r.quarter.q} · {game.config.companyName}
              </div>
              <h1 className="font-display font-bold text-[28px] leading-tight text-navy-900">{h.text}</h1>
            </div>
            <div className="ml-auto glass-dark rounded-full p-1 flex gap-1 text-[15px]">
              {(
                [
                  ['story', 'สรุปไตรมาส'],
                  ['rivals', 'คู่แข่ง'],
                  ['pnl', 'งบการรับประกัน (U/W)'],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  data-tab={id}
                  onClick={() => setTab(id)}
                  className={`h-10 px-5 rounded-full font-medium transition-colors ${tab === id ? 'bg-white text-navy-900' : 'text-white/85 hover:bg-white/10'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          {tab === 'story' ? (
            <div className="flex-1 min-h-0 grid grid-cols-[1fr_400px] gap-5 px-8 pb-4">
              <div className="flex flex-col gap-4 min-h-0">
                {/* KPIs */}
                <div className="grid grid-cols-4 gap-3">
                  {kpis.map((k) => {
                    const better = k.d * k.good > 0
                    const flat = Math.abs(k.d) < (k.label === 'เงินทุน' ? 0.5 : 0.0005)
                    const Icon = k.icon
                    const Arrow = k.d > 0 ? ArrowUpRight : ArrowDownRight
                    return (
                      <div key={k.label} className="rounded-2xl bg-white px-4 py-3 border border-navy-900/5">
                        <div className="flex items-center gap-2 text-[13px] text-navy-700/75">
                          <Icon size={16} /> {k.label}
                        </div>
                        <div className="flex items-end justify-between mt-1">
                          <div>
                            <div className="font-display font-bold text-[24px] leading-tight text-navy-900">{k.fmt(k.now)}</div>
                            <div className={`inline-flex items-center gap-0.5 text-[13px] font-medium ${flat ? 'text-navy-700/50' : better ? 'text-good' : 'text-alert'}`}>
                              {!flat && <Arrow size={15} />}
                              {flat ? 'ทรงตัว' : signed(k.d, k.fmt)}
                            </div>
                          </div>
                          <Sparkline values={k.series} color={k.color} w={96} h={40} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* why */}
                <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
                  <div className="font-display font-semibold text-[17px] text-navy-900 mb-2">ทำไมผลออกมาแบบนี้</div>
                  <ol className="space-y-2">
                    {r.drivers.slice(0, 4).map((d, i) => (
                      <li key={d.id} className="flex gap-3 items-start text-[14.5px] text-navy-800" data-driver={d.id}>
                        <span className={`shrink-0 grid place-items-center size-6 rounded-full text-[12px] font-bold text-white ${d.tone === 'good' ? 'bg-good' : 'bg-alert'}`}>{i + 1}</span>
                        {d.text}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* world */}
                <div className="grid grid-cols-2 gap-3 min-h-0">
                  <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
                    <div className="flex items-center gap-2 font-display font-semibold text-[16px] text-navy-900 mb-2">
                      <Swords size={17} className="text-brand-600" /> คู่แข่งเคลื่อนไหว
                    </div>
                    <ul className="space-y-1.5 text-[13.5px] text-navy-800">
                      {r.competitorMoves.map((m) => (
                        <li key={m.id}>• {m.text}</li>
                      ))}
                    </ul>
                    <button onClick={() => setTab('rivals')} className="mt-2 text-[13px] text-brand-600 hover:underline">
                      ดูการตัดสินใจและผลของคู่แข่งแต่ละราย →
                    </button>
                  </div>
                  <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
                    <div className="flex items-center gap-2 font-display font-semibold text-[16px] text-navy-900 mb-2">
                      <CloudRain size={17} className="text-brand-600" /> เหตุการณ์และผลต่อเนื่อง
                    </div>
                    <ul className="space-y-1.5 text-[13.5px] text-navy-800">
                      {flood && <li>• {flood}</li>}
                      {r.drivers.filter((d) => d.id === 'economy' || d.id === 'fine' || d.id === 'reg-pass').map((d) => (
                        <li key={d.id} className={d.tone === 'bad' ? 'text-alert' : ''}>• {d.text}</li>
                      ))}
                      {cons.map((c) => (
                        <li key={c} className="text-alert">
                          <TriangleAlert size={13} className="inline -mt-0.5 mr-1" />
                          ผลจากการตัดสินใจ: “{c}” จะเป็นโจทย์ไตรมาสหน้า
                        </li>
                      ))}
                      {!flood && cons.length === 0 && !r.drivers.some((d) => ['economy', 'fine', 'reg-pass'].includes(d.id)) && <li className="text-navy-700/60">ไม่มีเหตุการณ์ใหญ่ ไตรมาสนี้ผ่านไปอย่างราบรื่น</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {/* right column: advisor + ranking */}
              <div className="flex flex-col gap-4 min-h-0">
                <div className="relative rounded-2xl bg-gradient-to-b from-brand-50 to-white border border-brand-100 pl-[118px] pr-5 py-4 min-h-[210px]">
                  <img src={spriteUrl(pose)} alt={ADVISOR_NAME} className="absolute left-2 bottom-0 h-[200px] w-[104px] object-contain object-bottom" />
                  <div className="flex items-center gap-2 font-display font-semibold text-brand-600 text-[15px]">
                    <Sparkles size={15} /> คำแนะนำไตรมาสหน้า
                  </div>
                  <ul className="mt-2 space-y-2 text-[14px] text-navy-900 leading-snug">
                    {recs.map((t) => (
                      <li key={t} className="flex gap-2">
                        <Lightbulb size={15} className="shrink-0 mt-0.5 text-gold-600" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
                  <div className="font-display font-semibold text-[16px] text-navy-900 mb-2">อันดับส่วนแบ่งตลาด</div>
                  {ranking.map((c, i) => (
                    <div key={c.id} className={`flex items-center gap-3 py-1 text-[14px] ${c.me ? 'font-semibold text-brand-600' : 'text-navy-800'}`}>
                      <span className="w-5 text-navy-700/60">{i + 1}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="w-[120px] h-2 rounded-full bg-navy-900/8 overflow-hidden">
                        <span className={`block h-full rounded-full ${c.me ? 'bg-brand-500' : 'bg-navy-900/30'}`} style={{ width: `${Math.min(100, (c.share / 0.4) * 100)}%` }} />
                      </span>
                      <span className="w-12 text-right tabular-nums">{pct(c.share)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === 'rivals' ? (
            <div className="flex-1 min-h-0 px-8 pb-4">
              <RivalsPanel game={game} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 px-8 pb-4 overflow-auto">
              <PnlTable pnl={r.pnl} />
              <p className="mt-2 text-[12px] text-navy-700/60 flex items-center gap-1.5">
                <BookOpen size={13} /> ตัวเลขจำลองจากค่าประมาณการเพื่อเกม หน่วยล้านบาท · ทุกอัตราส่วนคิดบนเบี้ยประกันภัยที่ถือเป็นรายได้ (Earned Premium) · ค่าการตลาดของช่อง Direct รวมค่าโฆษณาและค่าแพลตฟอร์ม
              </p>
            </div>
          )}

          <footer className="flex items-center gap-4 px-8 py-4 border-t border-navy-900/5">
            <span className="text-[13.5px] text-navy-700/70">
              ผลรับประกันสุทธิ <b className={r.uwResult < 0 ? 'text-alert' : 'text-navy-900'}>{mb(r.uwResult)}</b> ล้านบาท · รายได้ลงทุน <b className="text-navy-900">{mb(r.investmentIncome)}</b> ล้านบาท · ใช้งบกลยุทธ์ {mb(r.spend)} ล้านบาท
            </span>
            <button
              onClick={reviewOnly ? closeReport : next}
              className="ml-auto h-[64px] w-[330px] rounded-[22px] btn-gold shine flex items-center justify-center gap-3 font-display font-bold text-[22px] hover:brightness-105 transition-all"
            >
              {reviewOnly ? 'กลับ Command Center' : game.outcome ? 'ดูผลจบเกม' : `ไปไตรมาสถัดไป (Q${game.quarter.q})`} <ChevronsRight size={28} strokeWidth={2.8} />
            </button>
          </footer>
        </section>
      </Stage>
    </>
  )
}
