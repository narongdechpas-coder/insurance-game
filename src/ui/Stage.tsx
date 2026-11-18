import { useLayoutEffect, useState, type ReactNode } from 'react'

/** Fixed 1600×900 HUD canvas, scaled to fit the window (16:9 desktop-first). */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="stage pointer-events-none" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
      {children}
    </div>
  )
}
