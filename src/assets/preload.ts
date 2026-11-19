import { brandUrl, SPRITES, spriteUrl, type SpriteKey } from './registry'

/**
 * Loads every game image (and the UI font) before the player can start, so the
 * city never pops in. Reports progress 0..1. Failed files count as done: one
 * missing sprite should not block the game.
 */
/** keeps the loaded images alive, so the browser keeps them decoded instead of re-decoding (blank flash) on first use */
const KEEP: HTMLImageElement[] = []

export function preloadAssets(onProgress: (p: number) => void): Promise<void> {
  const textures = [...['asphalt', 'grass', 'paving', 'water'].map((t) => `${import.meta.env.BASE_URL}assets/textures/${t}.jpg`), `${import.meta.env.BASE_URL}assets/brand/far-bank.webp`]
  const urls = [brandUrl('logo.webp'), ...(Object.keys(SPRITES) as SpriteKey[]).map(spriteUrl), ...textures]
  const total = urls.length + 1 // +1 for fonts
  let done = 0
  const tick = () => onProgress(++done / total)

  const images = urls.map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.src = src
        KEEP.push(img)
        // decode() waits until the pixels are ready to paint, not just downloaded
        const done = () => {
          tick()
          resolve()
        }
        ;(img.decode ? img.decode() : new Promise((r, j) => ((img.onload = r), (img.onerror = j)))).then(done, done)
      }),
  )
  const fonts = (document.fonts?.ready ?? Promise.resolve()).then(tick, tick)
  return Promise.all([...images, fonts]).then(() => undefined)
}
