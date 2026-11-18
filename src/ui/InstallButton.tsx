import { Download, Share, SquarePlus, X } from 'lucide-react'
import { useState } from 'react'
import { useInstall } from '../pwa'

/** "Install as app": the browser's own dialog where there is one, step-by-step help on iPhone/iPad. */
export function InstallButton({ className = '' }: { className?: string }) {
  const { mode, install } = useInstall()
  const [help, setHelp] = useState(false)
  if (!mode) return null
  return (
    // the caller positions the outer box (absolute on the cover, in flow in settings); the help card anchors to the inner one
    <div className={`pointer-events-auto ${className}`}>
      <div className="relative inline-block">
      <button
        data-action="install"
        onClick={() => (mode === 'prompt' ? install() : setHelp((v) => !v))}
        className="h-12 px-5 rounded-full glass-dark text-white flex items-center gap-2 font-display font-semibold text-[16px] hover:brightness-125"
      >
        <Download size={19} /> ติดตั้งเป็นแอป
      </button>
      {help && (
        <div data-install-help className="absolute right-0 top-14 w-[330px] glass rounded-[20px] px-5 py-4 anim-rise text-navy-900">
          <button onClick={() => setHelp(false)} aria-label="ปิด" className="absolute top-3 right-3 grid place-items-center size-7 rounded-full bg-navy-900/5">
            <X size={15} />
          </button>
          <div className="font-display font-bold text-[17px]">เพิ่มลงหน้าจอโฮม</div>
          <ol className="mt-2 space-y-2 text-[14px]">
            <li className="flex items-center gap-2">
              1. แตะปุ่มแชร์ <Share size={17} className="text-brand-600" /> ของ Safari
            </li>
            <li className="flex items-center gap-2">
              2. เลือก “เพิ่มไปยังหน้าจอโฮม” <SquarePlus size={17} className="text-brand-600" />
            </li>
            <li>3. แตะ “เพิ่ม” แล้วเปิดเกมจากไอคอนบนหน้าจอโฮม</li>
          </ol>
        </div>
      )}
      </div>
    </div>
  )
}
