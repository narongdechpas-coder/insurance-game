import { useMemo } from 'react'
import { portraitKey } from '../../assets/portraits'
import { SEGMENTS, type Level } from '../../game/data/tables'
import { forecastSegments, stepsChanged, type SegmentSteps } from '../../game/forecast'
import { SEG_PRICE_STEPS, type SegmentId } from '../../game/sim/v2'
import { useGameStore } from '../../store/useGameStore'
import { HeaderChip, StageHeader } from './StageHeader'
import { BUILDINGS, PANEL_ART } from '../../world/layout'
import { priceSensitivityFor } from '../../game/sim/init'
import { Glossed } from '../glossary/Term'

const LEVEL: Record<Level, string> = { low: 'ต่ำ', mid: 'กลาง', high: 'สูง' }
const short = (label: string) => label.replace(' (≤ 3 ปี)', '').replace(' (บ้าน/SME + PA)', '')
const pts = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v * 100).toFixed(1)}`
const tone = (v: number, good: number) => (Math.abs(v) < 0.0005 ? 'text-navy-700/45' : v * good > 0 ? 'text-emerald-700' : 'text-red-700')
export const stepText = (i: number) => (SEG_PRICE_STEPS[i] === 0 ? 'คง' : `${SEG_PRICE_STEPS[i] > 0 ? '+' : '−'}${Math.abs(SEG_PRICE_STEPS[i] * 100)}%`)

/** "ชั้น 1 รถใหม่ −4% · 2+ / 3+ +4%" or "คงราคาทุกกลุ่ม". */
export function priceSummary(steps: SegmentSteps) {
  if (!stepsChanged(steps)) return 'คงราคาทุกกลุ่ม'
  return SEGMENTS.filter((s) => steps[s.id] !== 2)
    .map((s) => `${short(s.label)} ${stepText(steps[s.id])}`)
    .join(' · ')
}

/**
 * Pricing by vehicle segment (replaces the single pricing card): one price move per segment,
 * with the engine's estimate of what it does to share, premium and the book's loss ratio.
 */
export function PricingStage() {
  const game = useGameStore((s) => s.game)
  const plan = useGameStore((s) => s.plan)
  const responses = useGameStore((s) => s.responses)
  const channels = useGameStore((s) => s.channels)
  const steps = useGameStore((s) => s.segSteps)
  const setStep = useGameStore((s) => s.setSegStep)
  const fc = useMemo(() => forecastSegments(game, plan, responses, channels, steps), [game, plan, responses, channels, steps])
  const market = game.sim.firms.reduce((a, f) => a + f.price * f.share, 0) / game.sim.firms.reduce((a, f) => a + f.share, 0)
  const last = game.sim.v2.history[game.sim.v2.history.length - 1]
  const lrNow = (k: SegmentId) => last?.segLossRatio[k] ?? SEGMENTS.find((s) => s.id === k)!.adequateLR
  const head = portraitKey('hq', 'normal')
  const all = fc.find((f) => f.segment === 'all')!

  return (
    <section
      data-stage="pricing"
      className="absolute left-[calc(352px+max(0px,100%-1600px)*0.15)] right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[calc(100%-172px-150px)] glass rounded-[28px] overflow-hidden pointer-events-auto anim-rise flex flex-col"
    >
      <StageHeader
        art={PANEL_ART.hq ?? BUILDINGS.hq.sprite}
        kicker="Insurance HQ · ราคาเบี้ย"
        title="ตั้งราคาแยกรายกลุ่มรถ"
        subtitle="ไตรมาสนี้จะปรับราคากลุ่มไหนเท่าไหร่"
        chips={
          <>
            <QualityNote />
            <HeaderChip>มีผลถาวร</HeaderChip>
          </>
        }
        head={head}
      />
      <div className="min-h-0 overflow-y-auto px-4 pb-4 pt-2">
        <table className="w-full text-[12.5px]" data-table="segment-pricing">
          <thead>
            <tr className="text-left text-[11px] text-navy-700/60">
              <th className="py-1.5 pl-2">กลุ่ม</th>
              <th className="text-right">ราคาเทียบตลาด</th>
              <th className="text-right">
                <Glossed text="Loss Ratio" />
              </th>
              <th className="text-center w-[230px]">ปรับราคาไตรมาสนี้</th>
              <th className="text-right">ส่วนแบ่ง</th>
              <th className="text-right">เบี้ย/ไตรมาส</th>
              <th className="text-right pr-2">LR พอร์ตเต็มผล</th>
            </tr>
          </thead>
          <tbody>
            {SEGMENTS.map((s) => {
              const f = fc.find((x) => x.segment === s.id)!
              const gapNow = game.sim.v2.segPrice[s.id] / market - 1
              const moved = steps[s.id] !== 2
              return (
                <tr key={s.id} data-seg-row={s.id} className={`border-t border-navy-900/5 ${moved ? 'bg-gold-300/15' : ''}`}>
                  <td className="py-2 pl-2">
                    <div className="font-medium text-[13.5px] text-navy-900 leading-tight">
                      <Glossed text={short(s.label)} />
                    </div>
                    <div className="text-[11px] text-navy-700/60">ไวต่อราคา{LEVEL[s.priceSensitivity]} · ผันผวน{LEVEL[s.volatility]}</div>
                  </td>
                  <td className={`text-right tabular-nums ${gapNow > 0.04 ? 'text-amber-700 font-medium' : ''}`}>{pts(gapNow)}%</td>
                  <td className="text-right tabular-nums">{(lrNow(s.id) * 100).toFixed(1)}%</td>
                  <td>
                    <div className="grid grid-cols-5 gap-1 px-2">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <button
                          key={i}
                          data-seg-step={`${s.id}-${i}`}
                          aria-pressed={steps[s.id] === i}
                          onClick={() => setStep(s.id, i)}
                          className={`h-8 rounded-lg text-[11.5px] font-medium transition-colors ${
                            steps[s.id] === i ? (i < 2 ? 'bg-alert text-white' : i > 2 ? 'bg-good text-white' : 'bg-brand-500 text-white') : 'bg-navy-900/5 text-navy-800 hover:bg-navy-900/10'
                          }`}
                        >
                          {stepText(i)}
                        </button>
                      ))}
                    </div>
                  </td>
                  {moved ? (
                    <>
                      <td className={`text-right tabular-nums font-medium ${tone(f.dShare, 1)}`}>{pts(f.dShare)} จุด</td>
                      <td className={`text-right tabular-nums font-medium ${tone(f.dGwp, 1)}`}>
                        {f.dGwp >= 0 ? '+' : '−'}
                        {Math.abs(Math.round(f.dGwp)).toLocaleString('th-TH')} ล้าน
                      </td>
                      <td className={`text-right tabular-nums font-medium pr-2 ${tone(f.dLossRatioFull, -1)}`}>
                        {pts(f.dLossRatioFull)} จุด
                        {f.gapAfter > 0.04 && <div className="text-[10.5px] text-amber-800 font-normal">แพงกว่าตลาด {Math.round(f.gapAfter * 100)}% ลูกค้าดีอาจย้ายออก</div>}
                      </td>
                    </>
                  ) : (
                    <td colSpan={3} className="text-right text-navy-700/40 pr-2">
                      คงราคา
                    </td>
                  )}
                </tr>
              )
            })}
            <tr className="border-t-2 border-navy-900/15 font-semibold" data-seg-row="all">
              <td className="py-2 pl-2 text-navy-900" colSpan={4}>
                รวมทุกกลุ่มที่ปรับ <span className="font-normal text-navy-700/60">(ผลรวมไม่เท่ากับบวกทีละแถว เพราะกลุ่มแย่งลูกค้ากันเอง)</span>
              </td>
              <td className={`text-right tabular-nums ${tone(all.dShare, 1)}`}>{pts(all.dShare)} จุด</td>
              <td className={`text-right tabular-nums ${tone(all.dGwp, 1)}`}>
                {all.dGwp >= 0 ? '+' : '−'}
                {Math.abs(Math.round(all.dGwp)).toLocaleString('th-TH')} ล้าน
              </td>
              <td className={`text-right tabular-nums pr-2 ${tone(all.dLossRatioFull, -1)}`}>{pts(all.dLossRatioFull)} จุด</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}



/** How well customers take a price rise right now: satisfaction scales sensitivity above the market price. */
function QualityNote() {
  const sat = useGameStore((s) => s.game.kpis.satisfaction)
  const k = priceSensitivityFor(sat)
  const pct = Math.round(Math.abs(1 - k) * 100)
  const good = k < 0.97
  const bad = k > 1.03
  return (
    <span data-quality-note title={good ? `แพงกว่าตลาดแล้วเสียลูกค้าน้อยลงราว ${pct}%` : bad ? `แพงกว่าตลาดแล้วลูกค้าย้ายมากกว่าปกติราว ${pct}% ควรยกระดับบริการก่อน` : ''}>
      <HeaderChip tone={good ? 'good' : bad ? 'warn' : 'plain'}>
        ลูกค้าพอใจ {sat.toFixed(1)} ดาว · {good ? `ขึ้นราคาได้ดีกว่าตลาด (เสียลูกค้าน้อยลง ~${pct}%)` : bad ? `ขึ้นราคาเสี่ยง (ลูกค้าย้ายมากขึ้น ~${pct}%)` : 'ขึ้นราคาได้เท่าตลาด'}
      </HeaderChip>
    </span>
  )
}
