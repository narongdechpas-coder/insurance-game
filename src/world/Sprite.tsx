import type { CSSProperties } from 'react'
import { SPRITES, spriteUrl, type SpriteKey } from '../assets/registry'
import { project } from './projection'

export interface SpriteProps {
  sprite: SpriteKey
  /** ground position of the sprite's base centre (grid units) */
  u: number
  v: number
  scale?: number
  /** base-centre inside the image, as fraction of width/height */
  anchor?: [number, number]
  flip?: boolean
  className?: string
  style?: CSSProperties
  z?: number
}

/** A world sprite: placed by ground position, depth-sorted by screen y. */
export function Sprite({ sprite, u, v, scale = 1, anchor = [0.5, 0.78], flip, className, style, z }: SpriteProps) {
  const m = SPRITES[sprite]
  const p = project(u, v)
  const w = m.w * scale
  const h = m.h * scale
  return (
    <img
      src={spriteUrl(sprite)}
      alt=""
      draggable={false}
      className={`absolute pointer-events-none ${className ?? ''}`}
      style={{
        left: p.x - w * (flip ? 1 - anchor[0] : anchor[0]),
        top: p.y - h * anchor[1],
        width: w,
        height: h,
        zIndex: z ?? Math.round(p.y),
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
    />
  )
}
