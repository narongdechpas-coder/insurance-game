import { RotateCw } from 'lucide-react'
import { brandUrl } from '../assets/registry'

/**
 * The game is laid out for a landscape 16:9 screen. On a touch device held upright the
 * whole HUD would shrink to half size, so ask for a turn instead (shown by CSS only).
 */
export function RotateHint() {
  return (
    <div className="rotate-hint fixed inset-0 z-[100] place-items-center bg-navy-950 text-white text-center px-8" role="alert">
      <div>
        <img src={brandUrl('logo.webp')} alt="Insure Universe" className="w-[260px] mx-auto mb-6" draggable={false} />
        <RotateCw size={56} className="mx-auto text-gold-400 rotate-hint-icon" />
        <div className="mt-4 font-display font-bold text-[24px]">หมุนแท็บเล็ตเป็นแนวนอน</div>
        <div className="mt-1 text-[16px] text-white/75">เกมนี้ออกแบบให้เล่นบนจอแนวนอน</div>
      </div>
    </div>
  )
}
