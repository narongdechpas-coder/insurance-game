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
    // Android tablets can report the new size a moment after 'resize' (system bars, address bar,
    // rotation), so fit again shortly after; and the page itself must never scroll or pan
    let t = 0
    const refit = () => {
      fit()
      clearTimeout(t)
      t = window.setTimeout(fit, 350)
    }
    const unscroll = () => {
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0)
      const root = document.getElementById('root')
      if (root && (root.scrollTop || root.scrollLeft)) root.scrollTo(0, 0)
    }
    fit()
    window.addEventListener('resize', refit)
    window.addEventListener('orientationchange', refit)
    window.visualViewport?.addEventListener('resize', refit)
    window.addEventListener('scroll', unscroll, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', refit)
      window.removeEventListener('orientationchange', refit)
      window.visualViewport?.removeEventListener('resize', refit)
      window.removeEventListener('scroll', unscroll, true)
    }
  }, [])
  return (
    <div className="stage pointer-events-none" style={{ width: box.w, height: box.h, transform: `translate(-50%, -50%) scale(${box.scale})` }}>
      {children}
    </div>
  )
}
