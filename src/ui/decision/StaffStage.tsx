import { measureLabel } from '../../game/decisions/scenarios'
import { Minus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SystemsPanel } from './SystemsPanel'
import { HeaderChip, ManagerBubble, StageHeader } from './StageHeader'
import { BUILDINGS } from '../../world/layout'
import { portraitKey } from '../../assets/portraits'
import { hasSprite, spriteUrl } from '../../assets/registry'
import { CARD_BY_ID, CARDS } from '../../game/decisions/cards'
import { EVENT_BY_ID } from '../../game/data/events'
import { forecastQuarter, fmtUnits, staffOf } from '../../game/forecast'
import { boostAt, hireCap, INVESTMENT_IDS, OPS, TEAMS, type Team } from '../../game/sim/ops'
import type { DecisionId } from '../../game/decisions/types'
import { useGameStore } from '../../store/useGameStore'
import OPS_JSON from '../../game/data/operations.json'
import { buildingCount } from '../../game/sim/systems'

const TEAM_UI: Record<Team, { loc: string; who: string }> = {
  claims: { loc: 'claims', who: 'พิจารณาและอนุมัติเคลม (งานสำรวจจ้างบริษัทภายนอกต่อเคลม)' },
  contact: { loc: 'customers', who: 'รับสายลูกค้า แจ้งเคลม สอบถาม และลูกค้าใหม่' },
}
const mb = (v: number) => (Math.abs(v) < 100 ? v.toFixed(1) : Math.round(v).toLocaleString('th-TH'))
const pct = (v: number) => `${Math.round(v * 100)}%`
const loadTone = (v: number) => (v > 1.05 ? 'text-red-700' : v > 0.97 ? 'text-amber-700' : 'text-emerald-700')
const sourceLabel = (src: string) => measureLabel(src) ?? tacticLabel(src) ?? CARD_BY_ID[src as DecisionId]?.title ?? EVENT_BY_ID[src]?.title ?? src
const tacticLabel = (id: string) => CARDS.flatMap((c) => c.options.flatMap((o) => o.tactics ?? [])).find((t) => t.id === id)?.label ?? null

/**
 * Team screen (engine v3): people are kept from quarter to quarter. Hiring is paid now and adds
 * capacity after training (next quarter); lay-offs cut capacity now and pay severance once.
 */
export function StaffStage() {
  const game = useGameStore((s) => s.game)
  const plan = useGameStore((s) => s.plan)
  const responses = useGameStore((s) => s.responses)
  const channels = useGameStore((s) => s.channels)
  const segSteps = useGameStore((s) => s.segSteps)
  const staff = useGameStore((s) => s.staff)
  const setStaff = useGameStore((s) => s.setStaff)
  const sysOrders = useGameStore((s) => s.sysOrders)
  const now = useMemo(() => staffOf(game), [game])
  const fc = useMemo(() => forecastQuarter(game, plan, responses, channels, segSteps, staff), [game, plan, responses, channels, segSteps, staff])
  const q = game.quarter.index
  const o = game.sim.ops
  const pay = OPS.salaryPerPersonMonth
  const [tab, setTab] = useState<'people' | 'systems'>('people')

  const teamCard = (t: Team) => {
    const cfg = OPS.teams[t]
    const want = staff[t] ?? now[t]
    const diff = want - now[t]
    const training = o.pending.filter((p) => p.team === t).reduce((a, p) => a + p.n, 0)
    const boost = boostAt(o, q + 1)[t]
    const afterTraining = want * cfg.perPersonMonth * 3 * (1 + boost)
    // recruiting and training take in at most 15% of the team a quarter
    const cap = hireCap(o, t)
    const demand = fc.ops.demand[t]
    const head = portraitKey(TEAM_UI[t].loc as never, fc.loads[t] > 1.05 ? 'shocked' : 'normal')
    return (
      <div key={t} data-team={t} className="rounded-[20px] bg-white/85 border border-brand-100 px-3.5 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          {head && <img src={spriteUrl(head)} alt="" data-portrait={head} className="h-[44px] w-[42px] object-contain object-bottom" />}
          <div className="min-w-0">
            <div className="font-display font-bold text-[17px] text-navy-900 leading-tight">{cfg.label}</div>
            <div className="text-[11.5px] text-navy-700/70 leading-snug truncate" title={TEAM_UI[t].who}>{TEAM_UI[t].who}</div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-brand-50/80 px-2.5 py-1.5">
          <button aria-label={`ลด ${cfg.label}`} data-staff-minus={t} onClick={() => setStaff(t, want - cfg.step)} className="grid place-items-center size-8 rounded-full bg-white text-navy-800 shadow-sm hover:brightness-95">
            <Minus size={18} />
          </button>
          <div className="text-center">
            <div className="font-display font-bold text-[22px] leading-none text-navy-900 tabular-nums" data-staff-count={t}>
              {want} <span className="text-[14px] font-medium">คน</span>
            </div>
            <div data-staff-note={t} className={`text-[11px] mt-0.5 ${diff ? 'text-brand-600 font-medium' : 'text-navy-700/60'}`}>
              {diff > 0 ? `รับเพิ่ม ${diff}` : diff < 0 ? `ลด ${-diff}` : training ? `อบรมอยู่ ${training}` : 'เท่าเดิม'} · เพิ่มได้ ≤{cap}
            </div>
          </div>
          <button aria-label={`เพิ่ม ${cfg.label}`} data-staff-plus={t} disabled={diff >= cap} onClick={() => setStaff(t, Math.min(now[t] + cap, want + cfg.step))} className="grid place-items-center size-8 rounded-full bg-white text-navy-800 shadow-sm hover:brightness-95 disabled:opacity-35">
            <Plus size={18} />
          </button>
        </div>
        <dl className="text-[12px] leading-snug text-navy-800 space-y-0.5">
          <div className="flex justify-between gap-2">
            <dt>งานต่อคน</dt>
            <dd className="tabular-nums">
              {cfg.perPersonMonth.toLocaleString('th-TH')} {cfg.unit}/เดือน
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="whitespace-nowrap">งานเข้า / รับได้</dt>
            <dd className="tabular-nums whitespace-nowrap">~{fmtUnits(demand)} / {fmtUnits(fc.ops.capacity[t])}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>ภาระงาน Q หน้า</dt>
            <dd className={`tabular-nums font-semibold ${loadTone(fc.loads[t])}`} data-team-load={t}>{pct(fc.loads[t])}</dd>
          </div>
          {diff > 0 && (
            <div className="flex justify-between gap-2 text-brand-700">
              <dt>หลังอบรมเสร็จ</dt>
              <dd className="tabular-nums">รับได้ {fmtUnits(afterTraining)} · ~{pct(demand / afterTraining)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-2 pt-1 border-t border-brand-100">
            <dt>เงินเดือนทีม/ไตรมาส</dt>
            <dd className="tabular-nums">
              {mb((now[t] * pay * 3) / 1e6)}
              {diff ? ` → ${mb((want * pay * 3) / 1e6)}` : ''} ล้าน
            </dd>
          </div>
          {diff > 0 && (
            <div className="flex justify-between gap-2 text-amber-800">
              <dt>ค่าสรรหาและอบรม (ครั้งเดียว)</dt>
              <dd className="tabular-nums">{mb((diff * pay * OPS.hireCostMonths) / 1e6)} ล้าน</dd>
            </div>
          )}
          {diff < 0 && (
            <div className="flex justify-between gap-2 text-amber-800">
              <dt>ค่าชดเชยเลิกจ้าง (ครั้งเดียว)</dt>
              <dd className="tabular-nums">{mb((Math.max(0, -diff - training) * pay * OPS.severanceMonths) / 1e6)} ล้าน</dd>
            </div>
          )}
        </dl>
      </div>
    )
  }

  const garageLoad = fc.loads.repair
  const owned = INVESTMENT_IDS.filter((id) => o.owned[id] !== undefined)
  const temps = o.temps.filter((x) => x.until >= q)
  const c = fc.ops.costs
  const TEAM_TH: Record<string, string> = { contact: 'Call center', claims: 'ทีมสินไหม', repair: 'อู่ในเครือ' }
  const busiest = (['claims', 'contact', 'repair'] as const).reduce((a, k) => (fc.loads[k] > fc.loads[a] ? k : a), 'claims' as 'claims' | 'contact' | 'repair')
  const busiestLine = `ไตรมาสหน้าตามแผนนี้ ${TEAM_TH[busiest]} หนักสุด ภาระงาน ${Math.round(fc.loads[busiest] * 100)}%${fc.loads[busiest] > 1.05 ? ' เกินกำลังแล้ว' : ''}`
  // header art: the head of IT on the systems tab (smiles when a system just went live, worried when one slipped);
  // the team office on the people tab, or the training room while new people are being hired or trained
  const news = game.lastReport?.ops?.systems?.news ?? []
  const itMood = news.some((n) => n.kind === 'delayed' || n.kind === 'partial') ? 'shocked' : news.some((n) => n.kind === 'live') ? 'happy' : 'normal'
  const hiring = TEAMS.some((t) => (staff[t] ?? now[t]) > now[t]) || o.pending.length > 0
  const opsArt = hasSprite(hiring ? 'ops/ops-training' : 'ops/ops-claims-team') ? (hiring ? 'ops/ops-training' : 'ops/ops-claims-team') : BUILDINGS.claims.sprite
  return (
    <>
    <ManagerBubble
      key={`bubble-${tab}`}
      lines={tab === 'people' ? 'รับเพิ่มจ่ายเงินเดือนทันที ได้กำลังหลังอบรมไตรมาสถัดไป (ไม่เกิน 15% ของทีม) · ลดคนกำลังหายทันทีและจ่ายค่าชดเชย 3 เดือน' : 'คนแก้ปัญหาได้เร็ว ระบบช้ากว่าแต่ต้นทุนระยะยาวต่ำ · ลูกค้าและคู่ค้าค่อยๆ ย้ายมาใช้'}
      strong={tab === 'people' ? busiestLine : <>ทีม IT ใช้อยู่ <span data-it-slots>{buildingCount(game.sim.ops.systems ?? {}) + sysOrders.length}</span>/{OPS_JSON.itSlots} ระบบ · เสี่ยงล่าช้า 1 ไตรมาส {Math.round(OPS_JSON.systemRisk.delay * 100)}% หรือได้ผลแค่ {Math.round(OPS_JSON.systemRisk.partialFactor * 100)}% อีก {Math.round(OPS_JSON.systemRisk.partial * 100)}% · ค่าพัฒนาใช้งบกลยุทธ์</>}
    />
    <section
      data-stage="staff"
      className="absolute left-[calc(352px+max(0px,100%-1600px)*0.15)] right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[calc(100%-172px-150px)] glass rounded-[28px] overflow-x-hidden overflow-y-auto pointer-events-auto anim-rise"
    >
      <StageHeader
        art={tab === 'systems' ? 'systems/sys-claims-app' : opsArt}
        kicker="Operations · ทีมงานและระบบ"
        title={tab === 'people' ? 'คนและกำลังงาน' : 'ระบบและดิจิทัล'}
        subtitle={tab === 'people' ? 'จะรับหรือลดคนทีมไหน เท่าไหร่' : 'จะให้ทีม IT สร้างระบบไหนก่อน'}
        chips={
          <>
            <span className="glass rounded-full p-0.5 inline-flex gap-0.5" role="tablist">
              {(['people', 'systems'] as const).map((k) => (
                <button key={k} role="tab" data-tab={k} aria-selected={tab === k} onClick={() => setTab(k)} className={`h-7 px-3.5 rounded-full text-[13px] font-medium ${tab === k ? 'bg-brand-500 text-white' : 'text-navy-800 hover:bg-white/70'}`}>
                  {k === 'people' ? 'คน' : 'ระบบ'}
                </button>
              ))}
            </span>
            {tab === 'people' ? <HeaderChip>รับเพิ่มไม่เกิน 15%/ไตรมาส</HeaderChip> : <HeaderChip>ทำพร้อมกัน 2 ระบบ</HeaderChip>}
          </>
        }
        head={tab === 'systems' ? portraitKey('it', itMood) : portraitKey('claims', 'normal')}
      />
      {tab === 'systems' ? <SystemsPanel /> : <>
      <div className="grid grid-cols-3 gap-3 px-5 pt-3">
        {TEAMS.map(teamCard)}
        <div data-team="repair" className="rounded-[20px] bg-white/85 border border-brand-100 px-3.5 py-3 flex flex-col gap-1.5">
          <div>
            <div className="font-display font-bold text-[17px] text-navy-900 leading-tight">อู่ในเครือ</div>
            <div className="text-[11.5px] text-navy-700/70 leading-snug truncate">อู่คู่สัญญา ค่าซ่อมอยู่ในค่าสินไหม</div>
          </div>
          <div className="rounded-2xl bg-brand-50/80 px-3 py-1.5 text-center">
            <div className="font-display font-bold text-[22px] leading-none text-navy-900 tabular-nums">
              {o.garages} <span className="text-[14px] font-medium">อู่</span>
            </div>
            <div className="text-[11px] mt-0.5 text-navy-700/60">{OPS.garages.jobsPerGarageQuarter} งาน/อู่/ไตรมาส</div>
          </div>
          <dl className="text-[12px] leading-snug text-navy-800 space-y-0.5">
            <div className="flex justify-between gap-2">
              <dt className="whitespace-nowrap">งานซ่อม / รับได้</dt>
              <dd className="tabular-nums whitespace-nowrap">~{fmtUnits(fc.ops.demand.repair)} / {fmtUnits(fc.ops.capacity.repair)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>ภาระงาน Q หน้า</dt>
              <dd className={`tabular-nums font-semibold ${loadTone(garageLoad)}`}>{pct(garageLoad)}</dd>
            </div>
          </dl>
          <div className="text-[11.5px] leading-snug text-navy-700/70 mt-auto">เพิ่มกำลังอู่ได้ที่การ์ด "เครือข่ายอู่" หรือเมื่อมีเหตุการณ์อู่รับรถไม่ทัน</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 pt-3 pb-4">
        <div className="rounded-[20px] bg-white/85 border border-brand-100 px-4 py-2.5 text-[12.5px] text-navy-800" data-fixed-cost>
          <div className="flex justify-between items-baseline font-display font-semibold text-[14.5px] text-navy-900"><span>ต้นทุนคงที่ Q หน้า</span><span className="tabular-nums">{mb(c.fixed)} ล้าน</span></div>
          <div className="text-[12px] leading-snug mt-0.5">
            เงินเดือน {fc.ops.staff.claims + fc.ops.staff.contact + fc.ops.staff.training + fc.ops.staff.other} คน <span className="tabular-nums">{mb(c.salaries)}</span> · ค่าเช่า IT และอื่นๆ <span className="tabular-nums">{mb(c.otherFixed)}</span>
            {c.maintenance > 0 && <> · ดูแลการลงทุน <span className="tabular-nums">{mb(c.maintenance)}</span></>}
            {c.hiring + c.severance > 0 && <span className="text-amber-800"> · อบรม/ชดเชย <span className="tabular-nums">{mb(c.hiring + c.severance)}</span></span>} ล้าน
          </div>
          <div className="text-[11px] text-navy-700/60 mt-0.5 truncate">ต้นทุนผันแปรแยกต่างหาก: ค่าออกกรมธรรม์ {OPS.issuancePerPolicy} บาท/ฉบับ · ค่าสำรวจภัย {OPS.surveyPerClaim} บาท/เคลม</div>
        </div>
        <div className="rounded-[20px] bg-white/85 border border-brand-100 px-4 py-2.5 text-[12px] text-navy-800" data-boosts>
          <div className="font-display font-semibold text-[14.5px] text-navy-900 mb-0.5">การลงทุนและกำลังเสริม</div>
          {owned.length === 0 && temps.length === 0 && <div className="text-navy-700/60">ยังไม่มี</div>}
          {owned.map((id) => {
            const inv = OPS.investments[id]
            return (
              <div key={id} className="flex justify-between gap-2">
                <span>{inv.label}</span>
                <span className="tabular-nums text-emerald-700">+{pct(inv.capacity)} ถาวร · ดูแล {inv.maintenanceMB} ล้าน/ไตรมาส</span>
              </div>
            )
          })}
          {temps.map((t, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span>{sourceLabel(t.source)}</span>
              <span className={`tabular-nums ${t.value < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {t.value > 0 ? '+' : ''}
                {pct(t.value)} · เหลือ {t.until - q + 1} ไตรมาส
              </span>
            </div>
          ))}
        </div>
      </div>
      </>}
    </section>
    </>
  )
}
