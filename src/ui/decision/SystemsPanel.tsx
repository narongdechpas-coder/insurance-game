import { Bot, Camera, Repeat, Smartphone, Store, Wrench, type LucideIcon } from 'lucide-react'
import { hasSprite, spriteUrl } from '../../assets/registry'
import OPS_JSON from '../../game/data/operations.json'
import { OPS, startUnits } from '../../game/sim/ops'
import { P } from '../../game/sim/params'
import { buildingCount, nextVersion, SYSTEM_IDS, SYSTEMS, type SysEffects, type SystemId } from '../../game/sim/systems'
import { useGameStore } from '../../store/useGameStore'

const ICON: Record<string, LucideIcon> = { bot: Bot, camera: Camera, repeat: Repeat, store: Store, smartphone: Smartphone, wrench: Wrench }
const ART: Record<SystemId, string> = {
  chatbot: 'systems/sys-chatbot',
  claimsApp: 'systems/sys-claims-app',
  autoRenew: 'systems/sys-auto-renew',
  dealerPortal: 'systems/sys-dealer-portal',
  agentApp: 'systems/sys-agent-app',
  garageOnline: 'systems/sys-garage-online',
}
const CH_TH: Record<string, string> = { dealer: 'Dealer', agent: 'Agent', direct: 'Direct' }
const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`
const mb = (v: number) => (v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('th-TH'))

/** What a version does at full use, in plain words. */
function effectLines(e: SysEffects, channel?: string): string[] {
  const out: string[] = []
  if (e.calls) out.push(`สายเข้า −${pct(e.calls)}`)
  if (e.claimsWork) out.push(`งานทีมสินไหม −${pct(e.claimsWork)}`)
  if (e.survey) out.push(`ค่าสำรวจภัย −${pct(e.survey)}`)
  if (e.issuance) out.push(`ค่าออกกรมธรรม์ −${pct(e.issuance)}`)
  if (e.issuanceChannel && channel) out.push(`ค่าออกกรมธรรม์ช่อง ${CH_TH[channel]} −${pct(e.issuanceChannel)}`)
  if (e.pull && channel) out.push(`${CH_TH[channel]} ดันยอดให้เรา (เท่ากับขึ้นค่าคอม ~${Math.round(e.pull / 0.2)} จุด โดยไม่เสียค่าคอม)`)
  if (e.renewal) out.push(`ต่ออายุ +${Math.round(e.renewal * 100)} จุด`)
  if (e.repair) out.push(`กำลังอู่ +${pct(e.repair)}`)
  if (e.lr) out.push(`Loss Ratio −${(Math.abs(e.lr) * 100).toFixed(1)} จุด`)
  if (e.service) out.push(`Service Quality +${e.service}`)
  return out
}

/**
 * Systems tab of the team screen (phase 3a): build, launch, adoption and version 2.
 * Each card shows what the next version does at full use, what it costs, how long it takes,
 * and what the same work would cost in people.
 */
export function SystemsPanel() {
  const game = useGameStore((s) => s.game)
  const orders = useGameStore((s) => s.sysOrders)
  const toggle = useGameStore((s) => s.toggleSysOrder)
  const sys = game.sim.ops.systems ?? {}
  const busy = buildingCount(sys)
  const freeSlots = OPS_JSON.itSlots - busy - orders.length
  // last quarter's volumes, or the starting book before the first quarter
  const su = startUnits(game.sim.baseDemand.policies * P.marketGwp0)
  const last = game.lastReport?.ops ?? {
    demand: { contact: su.calls, claims: su.claims, repair: su.repairs },
    costs: { survey: (su.claims * OPS.surveyPerClaim) / 1e6, issuance: ((su.inForce / 4) * OPS.issuancePerPolicy) / 1e6 },
  }
  const mix = game.sim.mix
  const pay = (OPS.salaryPerPersonMonth * 3) / 1e6

  /** the same work done by people (rough, from last quarter's volumes) */
  const peopleEquivalent = (e: SysEffects) => {
    const parts: string[] = []
    if (e.calls) {
      const n = (Math.abs(e.calls) * last.demand.contact) / (OPS.teams.contact.perPersonMonth * 3)
      parts.push(`≈ call center ${Math.round(n)} คน (${mb(n * pay)} ล้าน/ไตรมาส)`)
    }
    if (e.claimsWork) {
      const n = (Math.abs(e.claimsWork) * last.demand.claims) / (OPS.teams.claims.perPersonMonth * 3)
      parts.push(`≈ ทีมสินไหม ${Math.round(n)} คน (${mb(n * pay)} ล้าน/ไตรมาส)`)
    }
    if (e.survey) parts.push(`ค่าสำรวจภัยลด ≈ ${mb(Math.abs(e.survey) * last.costs.survey)} ล้าน/ไตรมาส`)
    if (e.issuance) parts.push(`ค่าออกกรมธรรม์ลด ≈ ${mb(Math.abs(e.issuance) * last.costs.issuance)} ล้าน/ไตรมาส`)
    return parts.join(' · ')
  }

  return (
    <div className="px-5 pt-3 pb-5" data-systems>
      <div className="flex items-center justify-between text-[12.5px] text-navy-800 mb-2">
        <span>
          ทีม IT ใช้อยู่ <b data-it-slots>{busy + orders.length}</b>/{OPS_JSON.itSlots} · เสี่ยงล่าช้า 1 ไตรมาส {pct(OPS_JSON.systemRisk.delay)} · ได้ผลแค่ {pct(OPS_JSON.systemRisk.partialFactor)} อีก {pct(OPS_JSON.systemRisk.partial)}
        </span>
        <span className="text-navy-700/60">ค่าพัฒนาจ่ายตามไตรมาสที่พัฒนา ใช้งบกลยุทธ์</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SYSTEM_IDS.map((id) => {
          const spec = SYSTEMS[id]
          const st = sys[id]
          const v = nextVersion(st)
          const ordered = orders.includes(id)
          const next = v ? spec[v === 1 ? 'v1' : 'v2'] : null
          const cur = st?.live ? spec[st.live === 1 ? 'v1' : 'v2'] : null
          const Icon = ICON[spec.icon] ?? Bot
          const art = hasSprite(ART[id]) ? ART[id] : null
          const adoption = !st?.live
            ? null
            : typeof st.adoption === 'number'
              ? `คู่ค้าใช้ ${pct(st.adoption)}`
              : `ลูกค้าใช้ ${pct(['dealer', 'agent', 'direct'].reduce((a, c) => a + mix[c as 'dealer'] * (st.adoption as Record<string, number>)[c], 0))}`
          const status = st?.building
            ? `กำลังพัฒนารุ่น ${st.building.version} · ${st.building.left > 0 ? `พัฒนาอีก ${st.building.left} ไตรมาส` : st.building.slipped ? 'ล่าช้า 1 ไตรมาส · เปิดใช้ไตรมาสนี้' : 'เสร็จแล้ว เปิดใช้ไตรมาสนี้ (เสี่ยงล่าช้า 25%)'}`
            : st?.live
              ? `ใช้งานรุ่น ${st.live} · ${adoption}${st.factor < 1 ? ` · ได้ผล ${pct(st.factor)}` : ''}`
              : 'ยังไม่มี'
          return (
            <div key={id} data-system={id} className={`rounded-[18px] border-2 p-3 flex flex-col gap-1.5 bg-white/85 ${ordered ? 'border-gold-500' : 'border-transparent'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`shrink-0 grid place-items-center rounded-xl text-brand-600 overflow-hidden ${art ? 'size-[72px]' : 'size-11 bg-gradient-to-b from-brand-50 to-brand-100'}`}>
                  {art ? <img src={spriteUrl(art as never)} alt="" data-system-art={id} className="max-w-[72px] max-h-[72px] object-contain drop-shadow-[0_6px_8px_rgba(20,50,110,0.25)]" /> : <Icon size={22} />}
                </span>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[15px] leading-tight text-navy-900">{spec.label}</div>
                  <div className="text-[11.5px] text-navy-700/65">{spec.side === 'customer' ? 'ฝั่งลูกค้า · ลดงาน' : 'ฝั่งคู่ค้า · ลดต้นทุน + คู่ค้าดันยอด'}</div>
                </div>
              </div>
              <div data-system-status={id} className={`text-[12px] font-medium ${st?.live ? 'text-emerald-700' : st?.building ? 'text-amber-800' : 'text-navy-700/60'}`}>
                {status}
              </div>
              {cur && st?.live && <div className="text-[11.5px] text-navy-700/75 leading-snug">ตอนนี้: {effectLines(cur.effects, spec.channel).join(' · ')} (เต็มผลเมื่อทุกคนใช้)</div>}
              {next && (
                <div className="rounded-xl bg-brand-50/80 px-2.5 py-1.5 text-[11.5px] leading-snug text-navy-800">
                  <div className="font-semibold text-brand-700">{v === 2 ? 'รุ่น 2: ' : ''}{next.label}</div>
                  <div>{effectLines(next.effects, spec.channel).join(' · ')}</div>
                  <div className="text-navy-700/70 mt-0.5">
                    พัฒนา {next.dev} ไตรมาส · ค่าพัฒนา {next.cost} ล้าน · ค่าดูแล {next.maint} ล้าน/ไตรมาส
                  </div>
                  {peopleEquivalent(next.effects) && <div className="text-emerald-800 mt-0.5">{peopleEquivalent(next.effects)}</div>}
                </div>
              )}
              {next && (
                <button
                  data-system-order={id}
                  disabled={!ordered && freeSlots <= 0}
                  onClick={() => toggle(id)}
                  className={`mt-auto h-9 rounded-full text-[13px] font-medium transition-colors disabled:opacity-40 ${ordered ? 'bg-gold-500 text-navy-900' : 'bg-brand-500 text-white hover:brightness-110'}`}
                >
                  {ordered ? 'สั่งแล้ว (กดเพื่อยกเลิก)' : !ordered && freeSlots <= 0 ? 'ทีม IT เต็ม' : v === 2 ? 'อัปเกรดเป็นรุ่น 2' : 'สั่งพัฒนา'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
