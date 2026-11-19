import { Minus, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { portraitKey } from '../../assets/portraits'
import { spriteUrl } from '../../assets/registry'
import { CARD_BY_ID } from '../../game/decisions/cards'
import { EVENT_BY_ID } from '../../game/data/events'
import { forecastQuarter, fmtUnits, staffOf } from '../../game/forecast'
import { boostAt, INVESTMENT_IDS, OPS, TEAMS, type Team } from '../../game/sim/ops'
import type { DecisionId } from '../../game/decisions/types'
import { useGameStore } from '../../store/useGameStore'

const TEAM_UI: Record<Team, { loc: string; who: string }> = {
  claims: { loc: 'claims', who: 'พิจารณาและอนุมัติเคลม (งานสำรวจจ้างบริษัทภายนอกต่อเคลม)' },
  contact: { loc: 'customers', who: 'รับสายลูกค้า แจ้งเคลม สอบถาม และลูกค้าใหม่' },
}
const mb = (v: number) => (Math.abs(v) < 100 ? v.toFixed(1) : Math.round(v).toLocaleString('th-TH'))
const pct = (v: number) => `${Math.round(v * 100)}%`
const loadTone = (v: number) => (v > 1.05 ? 'text-red-700' : v > 0.97 ? 'text-amber-700' : 'text-emerald-700')
const sourceLabel = (src: string) => CARD_BY_ID[src as DecisionId]?.title ?? EVENT_BY_ID[src]?.title ?? src

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
  const now = useMemo(() => staffOf(game), [game])
  const fc = useMemo(() => forecastQuarter(game, plan, responses, channels, segSteps, staff), [game, plan, responses, channels, segSteps, staff])
  const q = game.quarter.index
  const o = game.sim.ops
  const pay = OPS.salaryPerPersonMonth

  const teamCard = (t: Team) => {
    const cfg = OPS.teams[t]
    const want = staff[t] ?? now[t]
    const diff = want - now[t]
    const training = o.pending.filter((p) => p.team === t).reduce((a, p) => a + p.n, 0)
    const boost = boostAt(o, q + 1)[t]
    const afterTraining = want * cfg.perPersonMonth * 3 * (1 + boost)
    const demand = fc.ops.demand[t]
    const head = portraitKey(TEAM_UI[t].loc as never, fc.loads[t] > 1.05 ? 'shocked' : 'normal')
    return (
      <div key={t} data-team={t} className="rounded-[20px] bg-white/85 border border-brand-100 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {head && <img src={spriteUrl(head)} alt="" data-portrait={head} className="h-[56px] w-[52px] object-contain object-bottom" />}
          <div className="min-w-0">
            <div className="font-display font-bold text-[18px] text-navy-900 leading-tight">{cfg.label}</div>
            <div className="text-[12px] text-navy-700/70 leading-snug">{TEAM_UI[t].who}</div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-brand-50/80 px-3 py-2">
          <button aria-label={`ลด ${cfg.label}`} data-staff-minus={t} onClick={() => setStaff(t, want - cfg.step)} className="grid place-items-center size-10 rounded-full bg-white text-navy-800 shadow-sm hover:brightness-95">
            <Minus size={18} />
          </button>
          <div className="text-center">
            <div className="font-display font-bold text-[26px] leading-none text-navy-900 tabular-nums" data-staff-count={t}>
              {want} <span className="text-[14px] font-medium">คน</span>
            </div>
            <div data-staff-note={t} className={`text-[12px] mt-0.5 ${diff ? 'text-brand-600 font-medium' : 'text-navy-700/60'}`}>
              {diff > 0 ? `รับเพิ่ม ${diff}` : diff < 0 ? `ลด ${-diff}` : training ? `อบรมอยู่ ${training}` : 'เท่าเดิม'} · ทีละ {cfg.step}
            </div>
          </div>
          <button aria-label={`เพิ่ม ${cfg.label}`} data-staff-plus={t} onClick={() => setStaff(t, want + cfg.step)} className="grid place-items-center size-10 rounded-full bg-white text-navy-800 shadow-sm hover:brightness-95">
            <Plus size={18} />
          </button>
        </div>
        <dl className="text-[12.5px] leading-snug text-navy-800 space-y-0.5">
          <div className="flex justify-between gap-2">
            <dt>งานต่อคน</dt>
            <dd className="tabular-nums">
              {cfg.perPersonMonth.toLocaleString('th-TH')} {cfg.unit}/เดือน
            </dd>
          </div>
          <div className="pt-1 text-[11.5px] font-medium text-brand-600">ไตรมาสหน้า (ตามแผนนี้)</div>
          <div className="flex justify-between gap-2">
            <dt>งานเข้า</dt>
            <dd className="tabular-nums">~{fmtUnits(demand)} {cfg.unit}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>รับได้</dt>
            <dd className="tabular-nums">{fmtUnits(fc.ops.capacity[t])} {cfg.unit}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>ภาระงาน</dt>
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
  return (
    <section
      data-stage="staff"
      className="absolute left-[calc(352px+max(0px,100%-1600px)*0.15)] right-[calc(432px+max(0px,100%-1600px)*0.15)] top-[172px] max-h-[612px] glass rounded-[28px] overflow-x-hidden overflow-y-auto pointer-events-auto anim-rise"
    >
      <header className="px-7 pt-5 pb-3 bg-gradient-to-br from-brand-100 via-white to-brand-50">
        <div className="text-[13px] text-brand-600 font-medium">Operations · ทีมงาน</div>
        <h2 className="font-display font-bold text-[28px] leading-tight text-navy-900">คนและกำลังงาน</h2>
        <p className="text-[13.5px] text-navy-700/80 mt-0.5">
          จำนวนคนค้างไว้ทุกไตรมาสจนกว่าจะเปลี่ยน · รับเพิ่มจ่ายเงินเดือนทันที ได้กำลังหลังอบรมไตรมาสถัดไป · ลดคนกำลังหายทันทีและจ่ายค่าชดเชย · ตัวเลขเป็นค่าสมมติของเกม
        </p>
      </header>
      <div className="grid grid-cols-3 gap-3 px-5 pt-4">
        {TEAMS.map(teamCard)}
        <div data-team="repair" className="rounded-[20px] bg-white/85 border border-brand-100 p-4 flex flex-col gap-2">
          <div className="font-display font-bold text-[18px] text-navy-900 leading-tight">อู่ในเครือ</div>
          <div className="text-[12px] text-navy-700/70 leading-snug">อู่คู่สัญญา ไม่ใช่พนักงานของเรา ค่าซ่อมอยู่ในค่าสินไหม</div>
          <div className="rounded-2xl bg-brand-50/80 px-3 py-2 text-center">
            <div className="font-display font-bold text-[26px] leading-none text-navy-900 tabular-nums">
              {o.garages} <span className="text-[14px] font-medium">อู่</span>
            </div>
            <div className="text-[12px] mt-0.5 text-navy-700/60">{OPS.garages.jobsPerGarageQuarter} งาน/อู่/ไตรมาส</div>
          </div>
          <dl className="text-[12.5px] leading-snug text-navy-800 space-y-0.5">
            <div className="pt-1 text-[11.5px] font-medium text-brand-600">ไตรมาสหน้า (ตามแผนนี้)</div>
            <div className="flex justify-between gap-2">
              <dt>งานซ่อมเข้า</dt>
              <dd className="tabular-nums">~{fmtUnits(fc.ops.demand.repair)} งาน</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>รับได้</dt>
              <dd className="tabular-nums">{fmtUnits(fc.ops.capacity.repair)} งาน</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>ภาระงาน</dt>
              <dd className={`tabular-nums font-semibold ${loadTone(garageLoad)}`}>{pct(garageLoad)}</dd>
            </div>
          </dl>
          <div className="text-[12px] text-navy-700/70 mt-auto">เพิ่มกำลังอู่ได้ที่การ์ด "เครือข่ายอู่" หรือเมื่อมีเหตุการณ์อู่รับรถไม่ทัน</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <div className="rounded-[20px] bg-white/85 border border-brand-100 px-4 py-3 text-[12.5px] text-navy-800" data-fixed-cost>
          <div className="font-display font-semibold text-[15px] text-navy-900 mb-1">ต้นทุนคงที่ไตรมาสหน้า (ตามแผนนี้)</div>
          <div className="flex justify-between"><span>เงินเดือนทุกฝ่าย ({fc.ops.staff.claims + fc.ops.staff.contact + fc.ops.staff.training + fc.ops.staff.other} คน)</span><span className="tabular-nums">{mb(c.salaries)} ล้าน</span></div>
          <div className="flex justify-between"><span>ค่าเช่า ระบบ IT และค่าอื่น</span><span className="tabular-nums">{mb(c.otherFixed)} ล้าน</span></div>
          {c.maintenance > 0 && <div className="flex justify-between"><span>ค่าดูแลการลงทุน/อู่ที่เพิ่ม</span><span className="tabular-nums">{mb(c.maintenance)} ล้าน</span></div>}
          {c.hiring + c.severance > 0 && <div className="flex justify-between text-amber-800"><span>ค่าอบรม/ชดเชย (ครั้งเดียว)</span><span className="tabular-nums">{mb(c.hiring + c.severance)} ล้าน</span></div>}
          <div className="flex justify-between font-semibold border-t border-brand-100 mt-1 pt-1"><span>รวม</span><span className="tabular-nums">{mb(c.fixed)} ล้าน</span></div>
          <div className="text-[11.5px] text-navy-700/60 mt-1">ต้นทุนผันแปรแยกต่างหาก: ค่าออกกรมธรรม์ {OPS.issuancePerPolicy} บาท/ฉบับ · ค่าสำรวจภัย {OPS.surveyPerClaim} บาท/เคลม</div>
        </div>
        <div className="rounded-[20px] bg-white/85 border border-brand-100 px-4 py-3 text-[12.5px] text-navy-800" data-boosts>
          <div className="font-display font-semibold text-[15px] text-navy-900 mb-1">การลงทุนและกำลังเสริม</div>
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
    </section>
  )
}
