import { SEGMENTS, type Level } from '../../game/data/tables'
import type { ChannelId } from '../../game/sim/channels'
import { CHANNEL_IDS, portfolioMix, START_PORTFOLIO, type SegmentId } from '../../game/sim/v2'
import { useGameStore } from '../../store/useGameStore'
import { Glossed } from '../glossary/Term'
import { Sparkline } from '../review/Sparkline'
import { PageShell } from './PageShell'

const COLORS = ['#2f7bff', '#7aa7ff', '#f7ad1e', '#22c55e', '#a78bfa']
const LEVEL: Record<Level, string> = { low: 'ต่ำ', mid: 'กลาง', high: 'สูง' }
const CH_NAME: Record<ChannelId, string> = { dealer: 'Dealer', agent: 'Agent', direct: 'Direct' }
const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`

/** Product: the book by vehicle segment, and which channel sells what. */
export function ProductPage() {
  const game = useGameStore((s) => s.game)
  const hist = game.sim.v2.history
  const last = hist[hist.length - 1]
  const mix = last?.portfolio ?? portfolioMix(game.sim.v2, game.sim.mix)
  const gwp = game.lastReport?.gwp ?? game.kpis.marketShare * game.sim.marketGwp
  const segLR = (id: SegmentId) => last?.segLossRatio[id] ?? SEGMENTS.find((s) => s.id === id)!.adequateLR
  const mainChannel = (id: SegmentId) =>
    CHANNEL_IDS.map((c) => ({ c, v: game.sim.mix[c] * game.sim.v2.channels[c].seg[id] })).sort((a, b) => b.v - a.v)[0].c
  return (
    <PageShell id="product" kicker={`ผลิตภัณฑ์ · ปีที่ ${game.quarter.year} ไตรมาส ${game.quarter.q}`} title="พอร์ตแยกตามกลุ่มรถ">
      <div className="rounded-2xl bg-white border border-navy-900/5 px-5 py-4">
        <table className="w-full text-[14px]" data-table="product">
          <thead>
            <tr className="text-left text-[12px] text-navy-700/60">
              <th className="py-1.5">กลุ่ม</th>
              <th className="text-right">สัดส่วนพอร์ต</th>
              <th className="text-right">เทียบตอนเริ่ม</th>
              <th className="text-right">เบี้ยต่อไตรมาส (ล้าน)</th>
              <th className="text-right">
                <Glossed text="Loss Ratio" /> (ประมาณ)
              </th>
              <th className="text-center">ความไวต่อราคา</th>
              <th className="text-center">ความผันผวน</th>
              <th className="text-center">ช่องทางหลัก</th>
              <th className="text-right w-[130px]">แนวโน้มสัดส่วน</th>
            </tr>
          </thead>
          <tbody>
            {SEGMENTS.map((s, i) => {
              const d = mix[s.id] - START_PORTFOLIO[s.id]
              const lr = segLR(s.id)
              return (
                <tr key={s.id} data-segment={s.id} className="border-t border-navy-900/5">
                  <td className="py-2.5 font-medium text-navy-900">
                    <span className="inline-block size-2.5 rounded-full mr-2" style={{ background: COLORS[i] }} />
                    <Glossed text={s.label} />
                  </td>
                  <td className="text-right tabular-nums">{pct(mix[s.id])}</td>
                  <td className={`text-right tabular-nums ${Math.abs(d) < 0.002 ? 'text-navy-700/50' : d > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {Math.abs(d) < 0.002 ? '–' : `${d > 0 ? '+' : '−'}${Math.abs(d * 100).toFixed(1)} จุด`}
                  </td>
                  <td className="text-right tabular-nums">{Math.round(gwp * mix[s.id]).toLocaleString('th-TH')}</td>
                  <td className={`text-right tabular-nums ${lr > 0.65 ? 'text-red-700 font-medium' : ''}`}>{pct(lr)}</td>
                  <td className="text-center">{LEVEL[s.priceSensitivity]}</td>
                  <td className="text-center">{LEVEL[s.volatility]}</td>
                  <td className="text-center">{CH_NAME[mainChannel(s.id)]}</td>
                  <td className="text-right">
                    <span className="inline-block">
                      <Sparkline values={hist.length ? hist.map((h) => h.portfolio[s.id]) : [START_PORTFOLIO[s.id], mix[s.id]]} color={COLORS[i]} w={110} h={28} />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        {CHANNEL_IDS.map((c) => (
          <div key={c} data-product-channel={c} className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3">
            <div className="flex justify-between items-baseline">
              <span className="font-display font-semibold text-[16px] text-navy-900">{CH_NAME[c]} ขายอะไร</span>
              <span className="text-[12px] text-navy-700/60">{pct(game.sim.mix[c], 0)} ของพอร์ต</span>
            </div>
            <div className="mt-2 flex h-3 rounded-full overflow-hidden">
              {SEGMENTS.map((s, i) => (
                <span key={s.id} style={{ width: pct(game.sim.v2.channels[c].seg[s.id]), background: COLORS[i] }} title={`${s.label} ${pct(game.sim.v2.channels[c].seg[s.id], 0)}`} />
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-3 text-[12px] text-navy-800">
              {SEGMENTS.map((s, i) => (
                <span key={s.id} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="truncate">{s.label.replace(' (≤ 3 ปี)', '').replace(' (บ้าน/SME + PA)', '')}</span>
                  <span className="ml-auto tabular-nums">{pct(game.sim.v2.channels[c].seg[s.id], 0)}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-navy-700/60">
        Loss Ratio รายกลุ่มประมาณจาก Loss Ratio ทั้งพอร์ตไตรมาสล่าสุด ตามสมมติฐานความเสี่ยงของแต่ละกลุ่ม (src/game/data/segments.json) · เปลี่ยนกลุ่มที่เน้นขายได้ที่หน้าช่องทางในห้องตัดสินใจ ·
        ตัวเลขทั้งหมดเป็นผลจำลองของเกม
      </p>
    </PageShell>
  )
}
