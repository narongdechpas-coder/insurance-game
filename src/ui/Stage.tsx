import { useLayoutEffect, useState, type ReactNode } from 'react'

/**
 * HUD canvas designed at 1600×900 and scaled to fit the window. On windows wider (or
 * taller) than 16:9 the canvas grows in that direction instead of leaving empty bands,
 * so panels anchored to the left/right edges sit at the real window edges.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [box, setBox] = useState({ scale: 1, w: 1600, h: 900 })
  useLayoutEffect(() => {
    const fit = () => {
      const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900)
      setBox({ scale, w: window.innerWidth / scale, h: window.innerHeight / scale })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="stage pointer-events-none" style={{ width: box.w, height: box.h, transform: `translate(-50%, -50%) scale(${box.scale})` }}>
      {children}
    </div>
  )
}
