import { RIVAL_ART, spriteUrl } from '../../assets/registry'
import { responseOf, scenariosFor } from '../../game/decisions/scenarios'
import type { RivalReport } from '../../game/sim/types'
import type { GameState } from '../../game/types'
import { mb, pct, signed } from './format'
import { Glossed } from '../glossary/Term'

const PERSONA: Record<string, string> = {
  aggressive: 'สายบุกราคา',
  premium: 'สายบริการพรีเมียม',
  digital: 'สายดิจิทัล',
  conservative: 'สายระมัดระวัง',
}

function Delta({ label, a, b, fmt, higherIsBetter = true }: { label: string; a: number; b: number; fmt: (v: number) => string; higherIsBetter?: boolean }) {
  const d = b - a
  const flat = Math.abs(d) < Math.abs(a) * 0.0005 + 1e-9
  const good = flat ? null : d > 0 === higherIsBetter
  return (
    <div className="rounded-xl bg-navy-900/[0.035] px-2.5 py-1.5">
      <div className="text-[11.5px] text-navy-700/65"><Glossed text={label} /></div>
      <div className="font-semibold text-[15px] text-navy-900 tabular-nums">{fmt(b)}</div>
      <div className={`text-[11.5px] tabular-nums ${good === null ? 'text-navy-700/45' : good ? 'text-good' : 'text-alert'}`}>{flat ? 'ทรงตัว' : signed(d, fmt)}</div>
    </div>
  )
}

/** What each rival chose this quarter, how events treated it, and the result. */
export function RivalsPanel({ game }: { game: GameState }) {
  const r = game.lastReport!
  const me: RivalReport = {
    id: 'player',
    move: '',
    eventActions: scenariosFor(Object.keys(r.responses)).map((sc) => responseOf(r.responses, sc.eventId)?.label).filter(Boolean) as string[],
    impacts: r.eventImpacts,
    before: { share: r.before.marketShare, capital: r.before.capitalMB, combinedRatio: r.before.combinedRatio, satisfaction: r.before.satisfaction },
    after: { share: r.after.marketShare, capital: r.after.capitalMB, combinedRatio: r.after.combinedRatio, satisfaction: r.after.satisfaction },
  }
  const cards = [...r.rivals.map((x) => ({ x, c: game.competitors.find((c) => c.id === x.id)! })), { x: me, c: null }]
  return (
    <div className="grid grid-cols-5 gap-3 items-stretch" data-panel="rivals">
      {cards.map(({ x, c }) => (
        <article key={x.id} data-rival={x.id} className={`rounded-2xl border px-4 py-3 flex flex-col ${c ? 'bg-white border-navy-900/5' : 'bg-brand-50 border-brand-200'}`}>
          <div className="h-[96px] -mx-1 mb-1 rounded-xl grid place-items-center overflow-hidden" style={{ background: `linear-gradient(180deg, ${c?.color ?? '#2f7bff'}22, ${c?.color ?? '#2f7bff'}06)` }}>
            <img src={spriteUrl(c ? RIVAL_ART[c.id] : 'buildings/hq')} alt="" className="h-[92px] object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: c?.color ?? '#2f7bff' }} />
            <span className="font-display font-semibold text-[16px] text-navy-900 truncate">{c ? c.name : game.config.companyName}</span>
          </div>
          <div className="text-[12px] text-navy-700/60">{c ? PERSONA[c.personality] : 'บริษัทของเรา'}</div>
          <div className="mt-2 text-[12px] font-medium text-navy-700/70" data-label="decision">ตัดสินใจ</div>
          <div className="text-[13.5px] text-navy-900 leading-snug">{c ? x.move.replace(c.name + ' ', '') : 'ตามแผนที่ยืนยันในห้องตัดสินใจ'}</div>
          {x.eventActions.length > 0 && (
            <>
              <div className="mt-2 text-[12px] font-medium text-navy-700/70">รับมือเหตุการณ์</div>
              <ul className="text-[13px] text-navy-900 leading-snug space-y-0.5">
                {x.eventActions.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-2 text-[12px] font-medium text-navy-700/70">ผลกระทบจากเหตุการณ์</div>
          {x.impacts.length ? (
            <ul className="text-[13px] leading-snug space-y-0.5">
              {x.impacts.map((m) => (
                <li key={m.label} className="flex justify-between gap-2">
                  <span className="text-navy-800">{m.label}</span>
                  <b className={m.amount < 0 ? 'text-alert' : 'text-good'}>{mb(m.amount)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[13px] text-navy-700/55">ไม่ได้รับผลกระทบเป็นตัวเงิน</div>
          )}
          <div className="mt-auto pt-3 grid grid-cols-2 gap-1.5">
            <Delta label="ส่วนแบ่ง" a={x.before.share} b={x.after.share} fmt={(v) => pct(v)} />
            <Delta label="Combined Ratio" a={x.before.combinedRatio} b={x.after.combinedRatio} fmt={(v) => pct(v)} higherIsBetter={false} />
            <Delta label="เงินทุน (ล้าน)" a={x.before.capital} b={x.after.capital} fmt={(v) => mb(v)} />
            <Delta label="ความพอใจ" a={x.before.satisfaction} b={x.after.satisfaction} fmt={(v) => v.toFixed(2)} />
          </div>
        </article>
      ))}
    </div>
  )
}
