import { useMemo } from 'react'
import { portraitKey } from '../../assets/portraits'
import { spriteUrl } from '../../assets/registry'
import { SEGMENTS } from '../../game/data/tables'
import { forecastChannels, settingsOf, type ChannelSettings } from '../../game/forecast'
import type { ChannelId } from '../../game/sim/channels'
import { CH, CHANNEL_IDS, renewalRates, type SegmentId } from '../../game/sim/v2'
import { useGameStore } from '../../store/useGameStore'
import { Glossed } from '../glossary/Term'

const NAME: Record<ChannelId, { en: string; th: string; who: string }> = {
  dealer: { en: 'Dealer', th: 'ดีลเลอร์รถยนต์', who: 'ผู้ดูแลเครือข่ายดีลเลอร์' },
  agent: { en: 'Agent', th: 'ตัวแทน', who: 'ผู้จัดการเครือข่ายตัวแทน' },
  direct: { en: 'Direct', th: 'ขายตรงและออนไลน์', who: 'หัวหน้าการขายออนไลน์' },
}
const PORTRAIT: Record<ChannelId, string> = { dealer: 'dealer', agent: 'agent', direct: 'direct' }

const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`
const mb = (v: number) => Math.round(v).toLocaleString('th-TH')
const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${mb(Math.abs(v))}`

/** Slider step label for a channel (commission points, or ad spend % for Direct). */
export function stepLabel(c: ChannelId, lever: number) {
  const s = CH[c].steps[lever]
  if (s === 0) return 'เท่าตลาด'
  return CH[c].lever === 'commission' ? `${s > 0 ? '+' : '−'}${Math.abs(s * 100)} จุด` : `${s > 0 ? '+' : '−'}${Math.abs(s * 100)}%`
}

/** One line for lists: "Dealer +2 จุด · Agent เท่าตลาด · Direct −25%". */
export function channelSummary(set: ChannelSettings) {
  return CHANNEL_IDS.map((c) => `${NAME[c].en} ${stepLabel(c, set[c].lever)}`).join(' · ')
}

export function channelsChanged(a: ChannelSettings, b: ChannelSettings) {
  return CHANNEL_IDS.some((c) => a[c].lever !== b[c].lever || a[c].focus !== b[c].focus)
}

/**
 * Channel screen (replaces the old "ช่องทางขาย" card): each channel has its own lever and the
 * vehicle segment it pushes, with next quarter's estimate from the engine.
 */
export function ChannelStage() {
  const game = useGameStore((s) => s.game)
  const plan = useGameStore((s) => s.plan)
  const responses = useGameStore((s) => s.responses)
  const set = useGameStore((s) => s.channels)
  const setLever = useGameStore((s) => s.setLever)
  const setFocus = useGameStore((s) => s.setFocus)
  const fc = useMemo(() => forecastChannels(game, plan, responses, set), [game, plan, responses, set])
  const saved = useMemo(() => settingsOf(game), [game])
  const renewal = renewalRates(game.sim.v2)
  const mix = game.sim.mix

  return (
    <section
      data-stage="channels"
      className="absolute left-[calc(352px+max(0px,100%-1600px)*0.15)] right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[612px] glass rounded-[28px] overflow-hidden pointer-events-auto anim-rise flex flex-col"
    >
      <header className="px-7 pt-5 pb-3 bg-gradient-to-br from-brand-100 via-white to-brand-50">
        <div className="text-[13px] text-brand-600 font-medium">Distribution · ช่องทางขาย</div>
        <h2 className="font-display font-bold text-[26px] leading-tight text-navy-900">ตั้งค่าแยกรายช่องทาง</h2>
        <p className="text-[13.5px] text-navy-700/75">
          <Glossed text="ค่าคอมมิชชันคิดจากเบี้ยของช่องทางนั้นทั้งก้อน ค่าที่ตั้งใช้ต่อทุกไตรมาสจนกว่าจะเปลี่ยน · ตัวเลขด้านล่างเป็นประมาณการไตรมาสหน้า ถ้าไม่มีเหตุการณ์ไม่คาดคิด" />
        </p>
      </header>
      <div className="grid grid-cols-3 gap-3 px-4 pb-4 pt-3 min-h-0 overflow-y-auto">
        {CHANNEL_IDS.map((c) => {
          const st = set[c]
          const f = fc[c]
          const isComm = CH[c].lever === 'commission'
          const head = portraitKey(PORTRAIT[c] as never, st.lever < 2 ? 'shocked' : st.lever > 2 ? 'happy' : 'normal')
          const rate = isComm ? CH[c].marketRate + CH[c].steps[st.lever] : CH[c].marketRate * (1 + CH[c].steps[st.lever])
          const moved = st.lever !== saved[c].lever || st.focus !== saved[c].focus
          return (
            <div key={c} data-channel={c} className={`rounded-[20px] bg-white/85 border-2 p-3 flex flex-col gap-2.5 ${moved ? 'border-gold-500' : 'border-transparent'}`}>
              <div className="flex items-center gap-2.5">
                {head && <img src={spriteUrl(head)} alt="" data-portrait={head} className="size-14 rounded-full object-cover object-top bg-gradient-to-b from-brand-100 to-brand-50 ring-2 ring-white shadow" />}
                <div className="min-w-0">
                  <div className="font-display font-bold text-[18px] text-navy-900 leading-tight">{NAME[c].en}</div>
                  <div className="text-[12px] text-navy-700/70 leading-tight">{NAME[c].th}</div>
                  <div className="text-[11.5px] text-navy-700/60 leading-tight">
                    พอร์ต {pct(mix[c])} · ต่ออายุ {pct(renewal[c])}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-[12.5px] text-navy-800">
                  <span className="font-medium">{isComm ? <Glossed text="Commission เทียบตลาด" /> : 'งบโฆษณาออนไลน์เทียบคู่แข่ง'}</span>
                  <span className="text-navy-700/65">{pct(rate, 0)} ของเบี้ย</span>
                </div>
                <div className="mt-1 grid grid-cols-5 gap-1" role="radiogroup" aria-label={`${NAME[c].en} lever`}>
                  {[0, 1, 2, 3, 4].map((l) => (
                    <button
                      key={l}
                      role="radio"
                      aria-checked={st.lever === l}
                      data-lever={`${c}-${l}`}
                      onClick={() => setLever(c, l)}
                      className={`h-9 rounded-lg text-[11.5px] font-medium leading-none transition-colors ${
                        st.lever === l ? (l < 2 ? 'bg-alert text-white' : l > 2 ? 'bg-good text-white' : 'bg-brand-500 text-white') : 'bg-navy-900/5 text-navy-800 hover:bg-navy-900/10'
                      }`}
                    >
                      {stepLabel(c, l)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[12.5px] font-medium text-navy-800">กลุ่มรถที่ให้ช่องทางนี้เน้นขาย</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[null, ...SEGMENTS.map((s) => s.id)].map((id) => {
                    const on = st.focus === id
                    const label = id ? SEGMENTS.find((s) => s.id === id)!.label.replace(' (≤ 3 ปี)', '').replace(' (บ้าน/SME + PA)', '') : 'ไม่เน้น'
                    return (
                      <button
                        key={id ?? 'none'}
                        data-focus={`${c}-${id ?? 'none'}`}
                        onClick={() => setFocus(c, id as SegmentId | null)}
                        className={`h-7 px-2 rounded-full text-[11.5px] transition-colors ${on ? 'bg-navy-800 text-white' : 'bg-navy-900/5 text-navy-800 hover:bg-navy-900/10'}`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                {/* what this channel sells now */}
                <div className="mt-1.5 flex h-2 rounded-full overflow-hidden" title="ส่วนผสมกลุ่มรถของช่องทางนี้">
                  {SEGMENTS.map((s, i) => (
                    <span key={s.id} style={{ width: pct(game.sim.v2.channels[c].seg[s.id], 1), background: ['#2f7bff', '#7aa7ff', '#f7ad1e', '#22c55e', '#a78bfa'][i] }} />
                  ))}
                </div>
              </div>

              <div data-forecast={c} className="mt-auto rounded-xl bg-brand-50 px-3 py-2 text-[12.5px] text-navy-800 space-y-0.5">
                <div className="text-[11px] text-brand-600 font-medium">ประมาณการไตรมาสหน้า</div>
                <div className="flex justify-between">
                  <span>เบี้ยรับ</span>
                  <span className="tabular-nums font-medium">
                    {mb(f.gwp)} ล้าน {Math.abs(f.dGwp) >= 1 && <span className={f.dGwp > 0 ? 'text-emerald-700' : 'text-red-700'}>({signed(f.dGwp)})</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isComm ? 'ค่าคอม + ต้นทุนขาย' : 'ต้นทุนหาลูกค้า'}</span>
                  <span className="tabular-nums font-medium">
                    {mb(f.commission)} ล้าน {Math.abs(f.dCommission) >= 1 && <span className={f.dCommission > 0 ? 'text-red-700' : 'text-emerald-700'}>({signed(f.dCommission)})</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <Glossed text="Loss Ratio" />
                  </span>
                  <span className="tabular-nums font-medium">{pct(f.lossRatio, 1)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
