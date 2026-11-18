import { ChevronsRight, SkipForward } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { RIVAL_ART, spriteUrl, type SpriteKey } from '../../assets/registry'
import { changedCards } from '../../game/decisions/plan'
import { floodLine, headline } from '../../game/narrative/review'
import type { GameState } from '../../game/types'
import { useGameStore } from '../../store/useGameStore'
import { Stage } from '../Stage'
import { mb, pct } from './format'

/** Each story is laid out as a skeleton first, then "printed" in this order. */
const STORY_MS = 950

interface Story {
  id: string
  kicker: string
  title: string
  body: string[]
  art?: SpriteKey
  accent?: string
}

/** Build the front page from the quarter's report: lead story, our company, rival briefs, market. */
function frontPage(game: GameState, changed: number): { lead: Story; ours: Story; rivals: Story[]; market: Story } {
  const r = game.lastReport!
  const flood = floodLine(r)
  const eco = r.drivers.find((d) => d.id === 'economy')
  const reg = r.drivers.find((d) => d.id === 'fine' || d.id === 'reg-pass')
  const lead: Story =
    r.flood === 'hit'
      ? { id: 'lead', kicker: 'ภัยพิบัติ', title: 'น้ำท่วมภาคกลาง ประกันรถยนต์รับเคลมพร้อมกันทั้งตลาด', body: [flood!, ...r.rivals.filter((x) => x.impacts.some((m) => m.label.startsWith('ความเสียหาย'))).slice(0, 2).map((x) => `${name(game, x.id)} เสียหายสุทธิ ${mb(-x.impacts.find((m) => m.label.startsWith('ความเสียหาย'))!.amount)} ล้านบาท`)], art: 'events/flood' }
      : eco
        ? { id: 'lead', kicker: 'เศรษฐกิจ', title: 'เศรษฐกิจชะลอ ลูกค้าเปรียบเทียบราคาประกันหนักขึ้น', body: [eco.text, ...(reg ? [reg.text] : [])], art: 'events/economy' }
        : reg
          ? { id: 'lead', kicker: 'กำกับดูแล', title: 'หน่วยงานกำกับตรวจการบริการสินไหมทั้งอุตสาหกรรม', body: [reg.text], art: 'events/regulation' }
          : { id: 'lead', kicker: 'ตลาดประกันภัย', title: headline(r).text, body: [flood ?? 'ตลาดเคลื่อนไหวตามปกติ ไม่มีเหตุการณ์ใหญ่', `ตลาดรวมไตรมาสนี้ราว ${mb(game.sim.marketGwp)} ล้านบาท`], art: 'events/market-normal' }
  const ours: Story = {
    id: 'ours',
    kicker: game.config.companyName,
    title: `${game.config.companyName} ${r.uwResult >= 0 ? 'ปิดไตรมาสมีกำไรจากการรับประกัน' : 'ขาดทุนจากการรับประกันไตรมาสนี้'}`,
    body: [
      `ปรับกลยุทธ์ ${changed} เรื่อง ใช้งบ ${mb(r.spend)} ล้านบาท`,
      `เบี้ยรับ ${mb(r.gwp)} ล้าน · Combined Ratio ${pct(r.after.combinedRatio)} · ส่วนแบ่ง ${pct(r.after.marketShare)}`,
    ],
    art: 'buildings/hq',
    accent: '#2f7bff',
  }
  const rivals: Story[] = r.rivals.map((x) => {
    const c = game.competitors.find((k) => k.id === x.id)!
    const dShare = x.after.share - x.before.share
    return {
      id: x.id,
      kicker: c.name,
      title: x.move.replace(c.name + ' ', ''),
      body: [
        ...x.eventActions.slice(0, 1),
        `ส่วนแบ่ง ${pct(x.after.share)} (${dShare >= 0 ? '+' : '−'}${pct(Math.abs(dShare))}) · CR ${pct(x.after.combinedRatio)}`,
      ],
      art: RIVAL_ART[c.id],
      accent: c.color,
    }
  })
  const market: Story = { id: 'market', kicker: 'ตารางตลาด', title: 'ส่วนแบ่งตลาดหลังปิดไตรมาส', body: [] }
  return { lead, ours, rivals, market }
}

const name = (game: GameState, id: string) => game.competitors.find((c) => c.id === id)?.name ?? id

/** Skeleton bars that stand in for a story until it is "printed". */
function Bars({ lines, title = true }: { lines: number; title?: boolean }) {
  return (
    <div className="space-y-2">
      {title && <div className="skeleton h-5 w-4/5" />}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  )
}

function Slot({ ready, skeleton, children }: { ready: boolean; skeleton: ReactNode; children: ReactNode }) {
  return <div data-story={ready ? 'printed' : 'skeleton'}>{ready ? <div className="ink-in">{children}</div> : skeleton}</div>
}

/** The quarter "goes to press": a front page assembles story by story before the Quarterly Review. */
export function Simulating() {
  const game = useGameStore((s) => s.game)
  const plan = useGameStore((s) => s.plan)
  const done = useGameStore((s) => s.finishSimulation)
  const r = game.lastReport
  const [n, setN] = useState(0) // stories printed so far
  const TOTAL = 7 // lead, ours, 4 rivals, market

  useEffect(() => {
    if (n >= TOTAL) return
    const id = setTimeout(() => setN(n + 1), n === 0 ? 650 : STORY_MS)
    return () => clearTimeout(id)
  }, [n])

  if (!r) return null
  const page = frontPage(game, changedCards(plan).length)
  const ranking = [{ id: 'player', name: game.config.companyName, share: r.after.marketShare, color: '#2f7bff' }, ...game.competitors.map((c) => ({ id: c.id, name: c.name, share: c.marketShare, color: c.color }))].sort((a, b) => b.share - a.share)
  const printed = n >= TOTAL

  return (
    <>
      <div className="fixed inset-0" style={{ backdropFilter: 'blur(6px) saturate(0.85)', background: 'rgba(7,21,55,0.6)' }} />
      <Stage>
        <section
          data-screen="simulating"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1180px] rounded-[10px] pointer-events-auto paper-in text-[#1d2433]"
          style={{ background: 'linear-gradient(180deg,#fbf8f1,#f3eee3)', boxShadow: '0 40px 80px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.06)' }}
        >
          {/* masthead */}
          <header className="px-9 pt-6 pb-3 border-b-[3px] border-double border-[#1d2433]/70">
            <div className="flex items-end justify-between text-[12px] tracking-wide text-[#1d2433]/70">
              <span>ฉบับไตรมาส {r.quarter.q} · ปีที่ {r.quarter.year}</span>
              <span>หนังสือพิมพ์ในเกม · ข่าวสมมติ</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <h1 className="font-display font-bold text-[44px] leading-none tracking-tight">Insure Times</h1>
              <div className="flex items-center gap-3">
                {!printed && <span className="text-[13px] text-[#1d2433]/60">กำลังเรียงข่าว…</span>}
                <button onClick={done} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1d2433]/8 text-[14px] hover:bg-[#1d2433]/15">
                  ข้าม <SkipForward size={15} />
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-[1.45fr_1fr] gap-7 px-9 py-5">
            {/* lead story */}
            <article className="border-r border-[#1d2433]/15 pr-7">
              <Slot
                ready={n >= 1}
                skeleton={
                  <>
                    <div className="skeleton h-3 w-24 mb-3" />
                    <div className="skeleton h-8 w-full mb-2" />
                    <div className="skeleton h-8 w-3/5 mb-4" />
                    <div className="skeleton h-[230px] w-full mb-4 rounded-md" />
                    <Bars lines={3} title={false} />
                  </>
                }
              >
                <div className="text-[12px] font-semibold tracking-wider text-[#b3261e] uppercase">{page.lead.kicker}</div>
                <h2 className="font-display font-bold text-[30px] leading-[1.15] mt-1">{page.lead.title}</h2>
                <div className="mt-3 h-[230px] rounded-md bg-gradient-to-b from-[#dfe9f3] to-[#eef3f7] grid place-items-center overflow-hidden">
                  {page.lead.art && <img src={spriteUrl(page.lead.art)} alt="" className="h-[220px] object-contain drop-shadow-[0_10px_14px_rgba(20,40,70,0.25)]" />}
                </div>
                <div className="mt-3 space-y-1.5 text-[14.5px] leading-relaxed">
                  {page.lead.body.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
              </Slot>
            </article>

            {/* our company + market */}
            <div className="flex flex-col gap-4">
              <article className="pb-4 border-b border-[#1d2433]/15">
                <Slot
                  ready={n >= 2}
                  skeleton={
                    <div className="flex gap-4">
                      <div className="skeleton size-[92px] shrink-0 rounded-md" />
                      <div className="flex-1">
                        <Bars lines={2} />
                      </div>
                    </div>
                  }
                >
                  <div className="flex gap-4">
                    <img src={spriteUrl(page.ours.art!)} alt="" className="size-[92px] object-contain shrink-0" />
                    <div>
                      <div className="text-[12px] font-semibold tracking-wider text-[#2f7bff]">{page.ours.kicker}</div>
                      <h3 className="font-display font-bold text-[19px] leading-snug">{page.ours.title}</h3>
                      {page.ours.body.map((t) => (
                        <p key={t} className="text-[13.5px] leading-snug mt-0.5">
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>
                </Slot>
              </article>
              <article>
                <Slot
                  ready={n >= TOTAL}
                  skeleton={
                    <div className="space-y-2">
                      <div className="skeleton h-4 w-2/5" />
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton h-3.5" style={{ width: `${88 - i * 9}%` }} />
                      ))}
                    </div>
                  }
                >
                  <div className="text-[12px] font-semibold tracking-wider text-[#1d2433]/60">{page.market.kicker}</div>
                  <h3 className="font-display font-bold text-[17px]">{page.market.title}</h3>
                  <div className="mt-1.5 space-y-1">
                    {ranking.map((c) => (
                      <div key={c.id} className={`flex items-center gap-2 text-[13px] ${c.id === 'player' ? 'font-semibold' : ''}`}>
                        <span className="w-[120px] truncate">{c.name}</span>
                        <span className="flex-1 h-2.5 bg-[#1d2433]/8 rounded-sm overflow-hidden">
                          <span className="block h-full rounded-sm transition-[width] duration-700" style={{ width: `${(c.share / 0.35) * 100}%`, background: c.color }} />
                        </span>
                        <span className="w-12 text-right tabular-nums">{pct(c.share)}</span>
                      </div>
                    ))}
                  </div>
                </Slot>
              </article>
            </div>
          </div>

          {/* rival briefs */}
          <div className="grid grid-cols-4 gap-5 px-9 pb-5 pt-4 border-t border-[#1d2433]/15">
            {page.rivals.map((s, i) => (
              <article key={s.id} data-rival-brief={s.id} className="min-h-[150px]">
                <Slot
                  ready={n >= 3 + i}
                  skeleton={
                    <>
                      <div className="skeleton h-[92px] w-full mb-2 rounded-md" />
                      <Bars lines={2} />
                    </>
                  }
                >
                  <div className="h-[92px] rounded-md grid place-items-center overflow-hidden mb-2" style={{ background: `linear-gradient(180deg, ${s.accent}22, ${s.accent}08)` }}>
                    <img src={spriteUrl(s.art!)} alt="" className="h-[88px] object-contain" />
                  </div>
                  <div className="text-[12px] font-semibold" style={{ color: s.accent }}>
                    {s.kicker}
                  </div>
                  <h4 className="font-display font-bold text-[15px] leading-snug">{s.title}</h4>
                  {s.body.map((t) => (
                    <p key={t} className="text-[12.5px] leading-snug text-[#1d2433]/80 mt-0.5">
                      {t}
                    </p>
                  ))}
                </Slot>
              </article>
            ))}
          </div>

          <footer className="flex items-center justify-between px-9 py-3 border-t-[3px] border-double border-[#1d2433]/70">
            <span className="text-[12px] text-[#1d2433]/55">ตัวเลขในข่าวมาจากการจำลองของเกม ไม่ใช่ข้อมูลจริง</span>
            <button
              onClick={done}
              disabled={!printed}
              className="h-12 px-6 rounded-full btn-gold flex items-center gap-2 font-display font-bold text-[17px] disabled:opacity-40 disabled:grayscale transition-opacity"
            >
              อ่านรายงานไตรมาสฉบับเต็ม <ChevronsRight size={20} />
            </button>
          </footer>
        </section>
      </Stage>
    </>
  )
}
