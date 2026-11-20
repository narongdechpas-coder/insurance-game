import { useEffect, useRef } from 'react'

/**
 * Rain over the city while a flood is hitting: short drops at three depths (far ones small,
 * slow and faint; near ones long, fast and bright), a light wind slant, gusts, and small
 * splashes where drops land. Canvas, so it stays cheap; fewer drops with reduced motion.
 */
type Drop = { x: number; y: number; len: number; speed: number; alpha: number; width: number; layer: number; land: number }
type Splash = { x: number; y: number; r: number; life: number }

const LAYERS = [
  { share: 0.5, len: [7, 12], speed: [520, 680], alpha: [0.3, 0.45], width: 1 },
  { share: 0.33, len: [12, 20], speed: [760, 980], alpha: [0.45, 0.62], width: 1.3 },
  { share: 0.17, len: [20, 32], speed: [1050, 1350], alpha: [0.6, 0.8], width: 1.8 },
]
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

export function RainFx() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let drops: Drop[] = []
    const splashes: Splash[] = []
    const make = (top: boolean): Drop => {
      const roll = Math.random()
      const layer = roll < LAYERS[0].share ? 0 : roll < LAYERS[0].share + LAYERS[1].share ? 1 : 2
      const L = LAYERS[layer]
      return {
        x: rnd(-0.1 * w, 1.05 * w),
        y: top ? rnd(-h * 0.2, 0) : rnd(-h * 0.2, h),
        len: rnd(L.len[0], L.len[1]),
        speed: rnd(L.speed[0], L.speed[1]),
        alpha: rnd(L.alpha[0], L.alpha[1]),
        width: L.width,
        layer,
        // near drops land lower on screen (closer to the viewer), far ones higher up the city
        land: h * (layer === 2 ? rnd(0.82, 1.02) : layer === 1 ? rnd(0.6, 1.02) : rnd(0.45, 1.02)),
      }
    }
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth
      h = window.innerHeight
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(((w * h) / (1600 * 900)) * (reduced ? 180 : 760))
      drops = Array.from({ length: n }, () => make(false))
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    let last = performance.now()
    let t = 0
    const tick = (now: number) => {
      // the first rAF timestamp can be earlier than the mount time: never step backwards
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      t += dt
      // wind: a steady slant with slow gusts
      const wind = 0.2 + 0.07 * Math.sin(t * 0.7) + 0.04 * Math.sin(t * 2.3)
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      for (const d of drops) {
        d.y += d.speed * dt
        d.x += d.speed * wind * dt
        if (d.y > d.land) {
          if (d.layer > 0 && splashes.length < 90 && Math.random() < (reduced ? 0.15 : 0.5)) splashes.push({ x: d.x, y: d.land, r: 0, life: 1 })
          Object.assign(d, make(true))
          continue
        }
        const dx = d.len * wind
        const g = ctx.createLinearGradient(d.x - dx, d.y - d.len, d.x, d.y)
        g.addColorStop(0, 'rgba(220,235,255,0)')
        g.addColorStop(1, `rgba(225,238,255,${d.alpha})`)
        ctx.strokeStyle = g
        ctx.lineWidth = d.width
        ctx.beginPath()
        ctx.moveTo(d.x - dx, d.y - d.len)
        ctx.lineTo(d.x, d.y)
        ctx.stroke()
      }
      // splashes: a small flattened ring that grows and fades
      ctx.lineWidth = 1
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]
        s.life -= dt * 3.2
        s.r += dt * 26
        if (s.life <= 0) {
          splashes.splice(i, 1)
          continue
        }
        ctx.strokeStyle = `rgba(225,238,255,${0.35 * s.life})`
        ctx.beginPath()
        ctx.ellipse(s.x, s.y, Math.max(0.1, s.r), Math.max(0.1, s.r * 0.32), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} data-fx="rain" className="fixed inset-0 w-full h-full pointer-events-none rain-in" />
}
