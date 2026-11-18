import { brandUrl, SPRITES, spriteUrl, type SpriteKey } from './registry'

/**
 * Loads every game image (and the UI font) before the player can start, so the
 * city never pops in. Reports progress 0..1. Failed files count as done: one
 * missing sprite should not block the game.
 */
export function preloadAssets(onProgress: (p: number) => void): Promise<void> {
  const urls = [brandUrl('logo.webp'), ...(Object.keys(SPRITES) as SpriteKey[]).map(spriteUrl)]
  const total = urls.length + 1 // +1 for fonts
  let done = 0
  const tick = () => onProgress(++done / total)

  const images = urls.map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = img.onerror = () => {
          tick()
          resolve()
        }
        img.src = src
      }),
  )
  const fonts = (document.fonts?.ready ?? Promise.resolve()).then(tick, tick)
  return Promise.all([...images, fonts]).then(() => undefined)
}
