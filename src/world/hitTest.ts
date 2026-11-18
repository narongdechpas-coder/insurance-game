import { spriteUrl, type SpriteKey } from '../assets/registry'

/**
 * Pixel-accurate hover/click for sprites: transparent pixels never steal a click
 * from the building behind them. Alpha masks load lazily; until ready, the
 * bounding box counts as a hit.
 */
const masks = new Map<SpriteKey, { w: number; h: number; data: Uint8ClampedArray } | 'loading'>()

function load(key: SpriteKey) {
  masks.set(key, 'loading')
  const img = new Image()
  img.src = spriteUrl(key)
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.drawImage(img, 0, 0)
    masks.set(key, { w: c.width, h: c.height, data: g.getImageData(0, 0, c.width, c.height).data })
  }
}

/** fx, fy: position inside the sprite as 0..1 fractions. */
export function isOpaque(key: SpriteKey, fx: number, fy: number) {
  const m = masks.get(key)
  if (!m) {
    load(key)
    return true
  }
  if (m === 'loading') return true
  const x = Math.floor(fx * m.w)
  const y = Math.floor(fy * m.h)
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false
  return m.data[(y * m.w + x) * 4 + 3] > 40
}

export function preloadMasks(keys: SpriteKey[]) {
  keys.forEach((k) => masks.has(k) || load(k))
}
