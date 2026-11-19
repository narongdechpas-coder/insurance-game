/**
 * Sound effects, synthesised with the Web Audio API (no audio files, no licences, works offline).
 * Every sound is a small recipe of oscillators and filtered noise, kept in one key (C major
 * pentatonic) so effects sit together. Recipes take any BaseAudioContext, so the same code can
 * render previews offline.
 */

export type SfxId =
  | 'tick' | 'select' | 'adjust' | 'open' | 'close' | 'denied'
  | 'confirm' | 'start' | 'month' | 'newspaper'
  | 'eventChance' | 'eventThreat' | 'eventRival' | 'flood'
  | 'systemLive' | 'systemDelayed' | 'rankUp' | 'rankDown' | 'renewal'
  | 'tip' | 'warning' | 'danger'
  | 'win' | 'finish' | 'bankrupt'

type Ctx = BaseAudioContext
const N = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568 }

/** One enveloped oscillator note. */
function note(c: Ctx, out: AudioNode, t: number, freq: number, dur: number, opt: { type?: OscillatorType; gain?: number; attack?: number; to?: number; lowpass?: number } = {}) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = opt.type ?? 'sine'
  o.frequency.setValueAtTime(freq, t)
  if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t + dur)
  const a = opt.attack ?? 0.005
  const peak = opt.gain ?? 0.3
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  let node: AudioNode = o
  if (opt.lowpass) {
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = opt.lowpass
    o.connect(f)
    node = f
  }
  node.connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.02)
}

let noiseBuf: AudioBuffer | null = null
function noise(c: Ctx, out: AudioNode, t: number, dur: number, opt: { type?: BiquadFilterType; freq?: number; to?: number; q?: number; gain?: number; attack?: number } = {}) {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    let seed = 7
    for (let i = 0; i < d.length; i++) {
      seed = (seed * 16807) % 2147483647
      d[i] = (seed / 2147483647) * 2 - 1
    }
  }
  const s = c.createBufferSource()
  s.buffer = noiseBuf
  const f = c.createBiquadFilter()
  f.type = opt.type ?? 'bandpass'
  f.frequency.setValueAtTime(opt.freq ?? 1200, t)
  if (opt.to) f.frequency.exponentialRampToValueAtTime(opt.to, t + dur)
  f.Q.value = opt.q ?? 0.8
  const g = c.createGain()
  const a = opt.attack ?? 0.01
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(opt.gain ?? 0.25, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(out)
  s.start(t, Math.random() * 0.5)
  s.stop(t + dur + 0.02)
}

const arp = (c: Ctx, out: AudioNode, t: number, notes: number[], gap: number, dur: number, opt: Parameters<typeof note>[5] = {}) =>
  notes.forEach((f, i) => note(c, out, t + i * gap, f, dur, opt))

/** The recipes. Each returns its length in seconds (for offline previews). */
export const SFX: Record<SfxId, (c: Ctx, out: AudioNode, t: number) => number> = {
  // B. tapping and choosing
  tick: (c, o, t) => (note(c, o, t, 1800, 0.035, { gain: 0.16 }), noise(c, o, t, 0.02, { freq: 4000, gain: 0.05 }), 0.06),
  select: (c, o, t) => (arp(c, o, t, [N.E5, N.A5], 0.055, 0.12, { type: 'triangle', gain: 0.16 }), 0.2),
  adjust: (c, o, t) => (note(c, o, t, 1250, 0.03, { type: 'square', gain: 0.12, lowpass: 2600 }), 0.05),
  open: (c, o, t) => (noise(c, o, t, 0.26, { freq: 500, to: 2600, q: 1.2, gain: 0.45, attack: 0.08 }), 0.3),
  close: (c, o, t) => (noise(c, o, t, 0.22, { freq: 2400, to: 450, q: 1.2, gain: 0.4, attack: 0.04 }), 0.26),
  denied: (c, o, t) => (note(c, o, t, 150, 0.16, { gain: 0.28, to: 110 }), note(c, o, t + 0.09, 140, 0.14, { gain: 0.18, to: 100 }), 0.28),

  // C. moments of the game
  confirm: (c, o, t) => {
    noise(c, o, t, 0.09, { type: 'lowpass', freq: 380, gain: 0.5, attack: 0.003 }) // the stamp
    note(c, o, t, 90, 0.12, { gain: 0.35, to: 55 })
    arp(c, o, t + 0.12, [N.C5, N.E5, N.G5, N.C6], 0.07, 0.5, { type: 'triangle', gain: 0.14 })
    return 0.9
  },
  start: (c, o, t) => (note(c, o, t, N.A5, 1.4, { gain: 0.18 }), note(c, o, t, N.A5 * 2.01, 0.9, { gain: 0.06 }), note(c, o, t, N.A5 * 2.76, 0.5, { gain: 0.03 }), 1.5),
  month: (c, o, t) => (note(c, o, t, 1050, 0.05, { type: 'triangle', gain: 0.2 }), noise(c, o, t, 0.03, { freq: 2500, q: 4, gain: 0.04 }), 0.08),
  newspaper: (c, o, t) => {
    for (let i = 0; i < 4; i++) noise(c, o, t + i * 0.045, 0.06, { type: 'highpass', freq: 3000, gain: 0.025 })
    arp(c, o, t + 0.22, [N.G5, N.C6], 0.09, 0.4, { type: 'triangle', gain: 0.14 })
    return 0.8
  },
  eventChance: (c, o, t) => (arp(c, o, t, [N.C5, N.E5, N.G5, N.C6], 0.06, 0.35, { type: 'triangle', gain: 0.13 }), 0.6),
  eventThreat: (c, o, t) => (arp(c, o, t, [N.A4, N.F4], 0.16, 0.45, { type: 'triangle', gain: 0.2 }), note(c, o, t, 110, 0.6, { gain: 0.12 }), 0.75),
  eventRival: (c, o, t) => (arp(c, o, t, [N.E5, N.G5, N.E5, N.A5], 0.08, 0.14, { type: 'square', gain: 0.13, lowpass: 2200 }), 0.5),
  flood: (c, o, t) => {
    noise(c, o, t, 1.6, { type: 'lowpass', freq: 220, gain: 1.4, attack: 0.25 }) // distant thunder
    noise(c, o, t + 0.1, 2.2, { type: 'highpass', freq: 4500, gain: 0.09, attack: 0.6 }) // rain
    return 2.4
  },
  systemLive: (c, o, t) => (arp(c, o, t, [N.G5, N.C6, N.E6, N.G6], 0.045, 0.16, { type: 'square', gain: 0.1, lowpass: 3500 }), note(c, o, t + 0.2, N.C6, 0.5, { gain: 0.16 }), 0.75),
  systemDelayed: (c, o, t) => (note(c, o, t, N.G5, 0.3, { type: 'square', gain: 0.13, lowpass: 2500, to: N.D5 }), 0.35),
  rankUp: (c, o, t) => (note(c, o, t, N.C5, 0.35, { type: 'triangle', gain: 0.15, to: N.G5 }), note(c, o, t + 0.3, N.C6, 0.4, { gain: 0.1 }), 0.75),
  rankDown: (c, o, t) => (note(c, o, t, N.G4, 0.45, { type: 'triangle', gain: 0.15, to: N.C4 }), 0.5),
  renewal: (c, o, t) => (arp(c, o, t, [N.E6, N.C6], 0.12, 0.6, { gain: 0.16 }), 0.85),

  // D. the advisor
  tip: (c, o, t) => (note(c, o, t, N.A5, 0.5, { gain: 0.1 }), note(c, o, t, N.A5 * 2, 0.25, { gain: 0.03 }), 0.55),
  warning: (c, o, t) => (arp(c, o, t, [N.E5, N.C5], 0.14, 0.28, { type: 'triangle', gain: 0.17 }), 0.5),
  danger: (c, o, t) => (arp(c, o, t, [N.A4, N.F4, N.D4], 0.18, 0.32, { type: 'triangle', gain: 0.22 }), 0.75),

  // E. the end
  win: (c, o, t) => {
    arp(c, o, t, [N.C5, N.E5, N.G5], 0.12, 0.3, { type: 'sawtooth', gain: 0.16, lowpass: 2200 })
    ;[N.C5, N.E5, N.G5, N.C6].forEach((f) => note(c, o, t + 0.4, f, 1.3, { type: 'sawtooth', gain: 0.11, lowpass: 2600, attack: 0.03 }))
    for (let i = 0; i < 6; i++) noise(c, o, t + 0.6 + i * 0.13, 0.12, { type: 'highpass', freq: 3500, gain: 0.04 }) // sparkles
    return 2
  },
  finish: (c, o, t) => ([N.F4, N.A4, N.C5, N.E5].forEach((f) => note(c, o, t, f, 1.6, { type: 'triangle', gain: 0.1, attack: 0.15 })), 1.7),
  bankrupt: (c, o, t) => (arp(c, o, t, [N.C5, N.A4, N.F4, N.D4], 0.3, 0.9, { type: 'triangle', gain: 0.2, attack: 0.05 }), 2),
}

/* ---------------- live playback ---------------- */

let ctx: AudioContext | null = null
let sfxGain: GainNode | null = null
let volume = 0.7
let enabled = true

const unlockListeners: (() => void)[] = []

/** Run `cb` once audio is unlocked (now, if it already is). */
export function onAudioUnlock(cb: () => void) {
  if (ctx) cb()
  else unlockListeners.push(cb)
}

/** The shared audio context (null until the first tap). */
export const audioContext = () => ctx

/** Browsers start audio only after a tap: create the context on the first gesture. */
export function unlockAudio() {
  if (ctx || typeof window === 'undefined' || !('AudioContext' in window)) return
  try {
    ctx = new AudioContext()
    sfxGain = ctx.createGain()
    sfxGain.gain.value = enabled ? volume : 0
    sfxGain.connect(ctx.destination)
    for (const cb of unlockListeners.splice(0)) cb()
  } catch {
    ctx = null
  }
}

export function setSfxVolume(v: number, on: boolean) {
  volume = v
  enabled = on
  if (sfxGain) sfxGain.gain.value = on ? v : 0
}

const lastPlayed: Partial<Record<SfxId, number>> = {}

/** Play a sound now (quietly ignored before the first tap, when muted, or if repeated within 60 ms). */
export function play(id: SfxId) {
  if (!enabled || volume <= 0) return
  unlockAudio()
  if (!ctx || !sfxGain) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  if ((lastPlayed[id] ?? -1) > now - 0.06) return
  lastPlayed[id] = now
  try {
    SFX[id](ctx, sfxGain, now + 0.005)
  } catch {
    /* a missing audio feature must never break the game */
  }
}
