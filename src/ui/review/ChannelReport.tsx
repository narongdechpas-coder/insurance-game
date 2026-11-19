import { portraitKey, type Mood } from '../../assets/portraits'
import { spriteUrl } from '../../assets/registry'
import type { ChannelId } from '../../game/sim/channels'
import { CHANNEL_IDS, CH, type ChannelSnapshot } from '../../game/sim/v2'
import type { GameState } from '../../game/types'
import { Glossed } from '../glossary/Term'
import { stepLabel } from '../decision/ChannelStage'
import { Sparkline } from './Sparkline'

const NAME: Record<ChannelId, { en: string; who: string; color: string }> = {
  dealer: { en: 'Dealer', who: 'ผู้ดูแลเครือข่ายดีลเลอร์', color: '#2f7bff' },
  agent: { en: 'Agent', who: 'ผู้จัดการเครือข่ายตัวแทน', color: '#a855f7' },
  direct: { en: 'Direct', who: 'หัวหน้าการขายออนไลน์', color: '#14b8a6' },
}

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`
const mb = (v: number) => Math.round(v).toLocaleString('th-TH')
const growth = (now: number, prev: number | undefined) => (prev ? now / prev - 1 : 0)

/** What each channel head says about the quarter (game narrative, from the numbers). */
function channelComment(c: ChannelId, now: ChannelSnapshot['channels'][ChannelId], prev: ChannelSnapshot['channels'][ChannelId] | undefined, lever: number) {
  const g = growth(now.gwp, prev?.gwp)
  const lines: string[] = []
  if (lever > 2) lines.push(CH[c].lever === 'commission' ? 'ค่าคอมที่สูงกว่าตลาดทำให้ตัวกลางส่งงานให้เรามากขึ้น' : 'งบโฆษณาที่มากกว่าคู่แข่งดึงลูกค้าเข้ามาได้มากขึ้น')
  if (lever < 2) lines.push(CH[c].lever === 'commission' ? 'ค่าคอมที่ต่ำกว่าตลาดทำให้ตัวกลางเริ่มส่งงานให้คู่แข่ง และต่ออายุผ่านเราน้อยลง' : 'งบโฆษณาที่น้อยกว่าคู่แข่งทำให้ลูกค้าใหม่หาเราเจอน้อยลง')
  if (now.combinedRatio > 1) lines.push(`ช่องทางนี้ขาดทุนจากการรับประกัน (CR ${pct(now.combinedRatio, 0)}) ควรดูค่าคอมหรือกลุ่มรถที่ขาย`)
  else if (g > 0.05) lines.push(`เบี้ยโต ${pct(g, 0)} และยังมีกำไรจากการรับประกัน`)
  else if (g < -0.05) lines.push(`เบี้ยลดลง ${pct(-g, 0)} จากไตรมาสก่อน`)
  if (!lines.length) lines.push('ไตรมาสนี้ทรงตัว ยังไม่มีสัญญาณที่ต้องแก้ด่วน')
  return lines.slice(0, 2).join(' ')
}

function moodOf(now: ChannelSnapshot['channels'][ChannelId], prev: ChannelSnapshot['channels'][ChannelId] | undefined): Mood {
  const g = growth(now.gwp, prev?.gwp)
  if (now.combinedRatio > 1.03 || g < -0.08) return 'shocked'
  if (now.combinedRatio < 0.97 && g > 0.02) return 'happy'
  return 'normal'
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-xl bg-navy-900/[0.035] px-2.5 py-1.5">
      <div className="text-[11px] text-navy-700/65 leading-tight">
        <Glossed text={label} />
      </div>
      <div className="font-semibold text-[15px] text-navy-900 tabular-nums leading-tight">
        {value} {sub && <span className={`text-[11.5px] font-medium ${tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-navy-700/60'}`}>{sub}</span>}
      </div>
    </div>
  )
}

function Head({ who, title, portrait, mood }: { who: string; title: string; portrait: string; mood: Mood }) {
  const key = portraitKey(portrait as never, mood)
  return (
    <div className="flex items-center gap-2.5">
      {key && <img src={spriteUrl(key)} alt="" data-portrait={key} className="size-12 rounded-full object-cover object-top bg-gradient-to-b from-brand-100 to-brand-50 ring-2 ring-white shadow" />}
      <div>
        <div className="font-display font-bold text-[17px] text-navy-900 leading-tight">{title}</div>
        <div className="text-[12px] text-navy-700/65">{who}</div>
      </div>
    </div>
  )
}

/** Review tab: each channel head and the marketing head report their own numbers. */
export function ChannelReport({ game }: { game: GameState }) {
  const hist = game.sim.v2.history
  const now = hist[hist.length - 1]
  const prev = hist[hist.length - 2]
  if (!now) return <div className="text-navy-700/70">ยังไม่มีข้อมูลช่องทาง</div>
  const levers = game.lastReport?.v2.levers
  const brandHist = hist.map((h) => h.brand)
  const brandDelta = game.lastReport?.v2.brandDelta ?? 0
  const costPer = now.newBusiness > 1 ? now.marketingSpend / now.newBusiness : null
  const season = game.lastReport?.v2.renewalSeason
  return (
    <div data-channel-report className="grid grid-cols-2 gap-3">
      {CHANNEL_IDS.map((c) => {
        const n = now.channels[c]
        const p = prev?.channels[c]
        const g = growth(n.gwp, p?.gwp)
        const lever = levers?.[c] ?? 2
        return (
          <div key={c} data-report-channel={c} className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <Head who={NAME[c].who} title={`${NAME[c].en} · ${stepLabel(c, lever)}`} portrait={c} mood={moodOf(n, p)} />
              <div className="text-right">
                <div className="text-[11px] text-navy-700/60">เบี้ยรับรายไตรมาส</div>
                <Sparkline values={hist.map((h) => h.channels[c].gwp)} color={NAME[c].color} w={120} h={34} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <Stat label="เบี้ยรับ (ล้าน)" value={mb(n.gwp)} sub={p ? `${g >= 0 ? '+' : ''}${pct(g, 0)}` : undefined} tone={g >= 0 ? 'good' : 'bad'} />
              <Stat label="Loss Ratio" value={pct(n.lossRatio)} />
              <Stat label="Combined Ratio" value={pct(n.combinedRatio)} tone={n.combinedRatio > 1 ? 'bad' : 'good'} sub={n.combinedRatio > 1 ? 'ขาดทุน' : 'กำไร'} />
              <Stat label={c === 'direct' ? 'ต้นทุนหาลูกค้า (ล้าน)' : 'ค่าคอม + ต้นทุนขาย (ล้าน)'} value={mb(n.commission)} sub={pct(n.commission / Math.max(1, n.gwp), 0)} />
              <Stat label="อัตราต่ออายุ" value={pct(n.renewal, 0)} sub={season ? 'ฤดูต่ออายุ' : undefined} />
              <Stat label="สัดส่วนพอร์ต" value={pct(n.mix, 0)} />
            </div>
            <p className="mt-2 text-[13px] text-navy-800 leading-snug">“{channelComment(c, n, p, lever)}”</p>
          </div>
        )
      })}
      <div data-report-channel="marketing" className="rounded-2xl bg-white border border-navy-900/5 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <Head who="Brand manager" title="Marketing & Brand" portrait="marketing" mood={brandDelta > 1 ? 'happy' : brandDelta < -1 ? 'shocked' : 'normal'} />
          <div className="text-right">
            <div className="text-[11px] text-navy-700/60">Brand Awareness</div>
            <Sparkline values={brandHist} color="#f59e0b" w={120} h={34} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          <Stat label="งบการตลาด (ล้าน)" value={mb(now.marketingSpend)} />
          <Stat label="Brand Awareness" value={Math.round(now.brand).toString()} sub={`${brandDelta >= 0 ? '+' : ''}${brandDelta.toFixed(1)}`} tone={brandDelta >= 0 ? 'good' : 'bad'} />
          <Stat label="เบี้ยจากลูกค้าใหม่ (ล้าน)" value={mb(now.newBusiness)} />
          <Stat label="งบต่อเบี้ยใหม่ 100 บาท" value={costPer === null ? '–' : `${(costPer * 100).toFixed(1)} บาท`} />
          <Stat label="Service Quality" value={Math.round(now.service).toString()} />
          <Stat label="สัดส่วน Direct" value={pct(now.channels.direct.mix, 0)} />
        </div>
        <p className="mt-2 text-[13px] text-navy-800 leading-snug">
          “
          {brandDelta > 1
            ? 'แคมเปญไตรมาสนี้ทำให้คนรู้จักเรามากขึ้น ผลจะเห็นชัดที่ช่องทาง Direct ก่อน'
            : brandDelta < -1
              ? 'แบรนด์เริ่มจางลง ถ้าประหยัดต่อ ลูกค้าใหม่ที่หาเราเองจะลดลง'
              : 'แบรนด์ทรงตัว ถ้าอยากเร่ง Direct ต้องลงแคมเปญ'}
          ”
        </p>
      </div>
    </div>
  )
}
