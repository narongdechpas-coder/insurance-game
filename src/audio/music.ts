/**
 * Background music, generated with the Web Audio API (no files, no licences, works offline).
 * Each track is a chord loop played by a few soft synth voices, with small seeded variations
 * every bar so a long session does not sound like a 4-bar loop. Two extra layers react to the
 * game: a low tense pulse when capital is in trouble, and rain when a flood is threatening.
 */

export type TrackId = 'city' | 'boardroom' | 'market' | 'newspaper' | 'win' | 'lose'

type Ctx = BaseAudioContext
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

// chords as MIDI notes (root position voicings around middle C)
const CH: Record<string, number[]> = {
  Cmaj7: [48, 55, 59, 64], Am7: [45, 52, 55, 60], Fmaj7: [41, 53, 57, 64], G6: [43, 55, 59, 64],
  Em7: [40, 52, 55, 62], Dm7: [38, 53, 57, 60], E: [40, 52, 56, 59], Fadd9: [41, 53, 55, 60], Gsus: [43, 55, 60, 62],
  // bright pop triads (add9 colour) for the upbeat tracks
  C: [48, 60, 64, 67], G: [43, 59, 62, 67], Am: [45, 60, 64, 69], F: [41, 60, 65, 69], Dm: [38, 62, 65, 69], Em: [40, 59, 64, 67], Cadd9: [48, 62, 64, 67],
}
/** a short catchy hook: (beat offset, which chord tone 1..3), so it always fits the chord */
const HOOK: [number, number][] = [[0, 3], [0.5, 2], [1, 3], [1.5, 1], [2.5, 2], [3, 1]]
const PENTA = [60, 62, 64, 67, 69, 72, 74, 76]

interface Track {
  bpm: number
  chords: string[]
  /** which voices play: e-piano arpeggio, pad, bass, pluck pulse, soft drums, melody */
  ep?: boolean | 'offbeat'
  pad?: boolean
  bass?: 'half' | 'eighth' | 'whole' | 'groove'
  pluck?: boolean
  drums?: boolean | 'light'
  melody?: boolean | 'hook'
  level: number
  /** play the progression once and stop (endings) */
  once?: boolean
}

export const TRACKS: Record<TrackId, Track> = {
  // upbeat "let's get to work": bright I–V–vi–IV, light groove, a catchy hook
  city: { bpm: 108, chords: ['C', 'G', 'Am', 'F'], ep: 'offbeat', pad: true, bass: 'groove', drums: 'light', melody: 'hook', level: 1.3 },
  // focused and moving forward: driving pulse, no hook so it does not distract from reading
  boardroom: { bpm: 104, chords: ['F', 'G', 'Am', 'C'], pad: true, pluck: true, bass: 'eighth', drums: 'light', level: 1.4 },
  market: { bpm: 122, chords: ['C', 'G', 'Am', 'F'], ep: 'offbeat', pad: true, bass: 'eighth', drums: true, melody: 'hook', level: 1.1 },
  newspaper: { bpm: 92, chords: ['C', 'F', 'Am', 'G'], pad: true, ep: true, level: 1.8 },
  win: { bpm: 100, chords: ['F', 'G', 'Em', 'Am', 'F', 'G', 'Cadd9', 'Cadd9'], ep: 'offbeat', pad: true, bass: 'groove', drums: 'light', melody: 'hook', level: 1.4, once: true },
  lose: { bpm: 66, chords: ['Am7', 'Fmaj7', 'Dm7', 'E', 'Am7', 'Fmaj7', 'Dm7', 'Am7'], ep: true, pad: true, bass: 'whole', level: 1.7, once: true },
}

/** deterministic small random for variations */
function rand(seed: number) {
  let s = seed % 2147483647 || 1
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

function voice(c: Ctx, out: AudioNode, t: number, freq: number, dur: number, o: { type?: OscillatorType; gain: number; attack?: number; release?: number; lowpass?: number; detune?: number; to?: number }) {
  const osc = c.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur)
  if (o.detune) osc.detune.value = o.detune
  const g = c.createGain()
  const a = o.attack ?? 0.01
  const r = o.release ?? dur
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.gain, t + a)
  g.gain.setValueAtTime(o.gain, t + Math.max(a, dur - r))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  let n: AudioNode = osc
  if (o.lowpass) {
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = o.lowpass
    osc.connect(f)
    n = f
  }
  n.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

let noise: AudioBuffer | null = null
function hiss(c: Ctx, out: AudioNode, t: number, dur: number, gain: number, type: BiquadFilterType, freq: number) {
  if (!noise || noise.sampleRate !== c.sampleRate) {
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = noise.getChannelData(0)
    const r = rand(99)
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1
  }
  const s = c.createBufferSource()
  s.buffer = noise
  s.loop = true
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.01, dur / 4))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(out)
  s.start(t)
  s.stop(t + dur + 0.05)
}

/** Schedule one bar of a track starting at t. */
export function scheduleBar(c: Ctx, out: AudioNode, id: TrackId, bar: number, t: number) {
  const tr = TRACKS[id]
  const beat = 60 / tr.bpm
  const len = beat * 4
  const ch = CH[tr.chords[bar % tr.chords.length]]
  const r = rand(bar * 131 + id.length * 7 + 1)
  // every 8 bars the arrangement thins out for a bar or two, so the loop breathes
  const section = Math.floor(bar / 8) % 4
  const sparse = section === 3 && bar % 8 < 2
  if (tr.pad) for (const n of ch.slice(1)) for (const d of [-6, 6]) voice(c, out, t, hz(n), len * 1.02, { type: 'triangle', gain: 0.022, attack: len * 0.35, release: len * 0.4, lowpass: 1500, detune: d })
  if (tr.ep === 'offbeat' && !sparse) {
    // bright chord stabs on the off-beats: the "upbeat" feel
    for (let i = 0; i < 4; i++)
      for (const n of ch.slice(1)) voice(c, out, t + (i + 0.5) * beat, hz(n + 12), beat * 0.3, { gain: 0.026, attack: 0.003, release: beat * 0.25 })
  } else if (tr.ep && !sparse) {
    const pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    for (let i = 0; i < 8; i++) {
      if (r() < 0.12) continue // a few rests keep it human
      const n = ch[1 + (pattern[(i + bar) % 8] % 3)] + 12
      voice(c, out, t + i * beat * 0.5, hz(n), beat * 0.9, { gain: 0.05, attack: 0.004, release: beat * 0.8 })
      voice(c, out, t + i * beat * 0.5, hz(n) * 2, beat * 0.35, { gain: 0.012, attack: 0.002 })
    }
  }
  if (tr.pluck) for (let i = 0; i < 8; i++) voice(c, out, t + i * beat * 0.5, hz(ch[0] + 24), beat * 0.25, { type: 'triangle', gain: i % 2 ? 0.02 : 0.035, attack: 0.003, lowpass: 1800 })
  if (tr.bass === 'groove') {
    // a bouncy syncopated line: root, root, fifth, octave
    const line: [number, number][] = [[0, 0], [0.75, 0], [1.5, 7], [2, 0], [2.75, 12], [3.5, 7]]
    for (const [h, iv] of line) voice(c, out, t + h * beat, hz(ch[0] + iv), beat * 0.55, { type: 'triangle', gain: 0.12, attack: 0.005, release: beat * 0.3, lowpass: 700 })
  } else if (tr.bass) {
    const hits = tr.bass === 'whole' ? [0] : tr.bass === 'half' ? [0, 2] : [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
    for (const h of hits) voice(c, out, t + h * beat, hz(ch[0]), (tr.bass === 'eighth' ? 0.45 : tr.bass === 'half' ? 1.9 : 3.8) * beat, { gain: 0.11, attack: 0.01, release: beat * 0.5, lowpass: 500 })
  }
  if (tr.drums && !sparse) {
    const light = tr.drums === 'light'
    for (let b = 0; b < 4; b++) {
      if (!light || b % 2 === 0) voice(c, out, t + b * beat, 95, 0.18, { gain: light ? 0.11 : 0.14, attack: 0.002, release: 0.16, to: 50 }) // kick
      if (b % 2 === 1) hiss(c, out, t + b * beat, 0.09, light ? 0.05 : 0.07, 'bandpass', 1800) // snap / clap on 2 and 4
      hiss(c, out, t + (b + 0.5) * beat, 0.04, light ? 0.015 : 0.025, 'highpass', 7000) // off-beat hat
      if (light) hiss(c, out, t + (b + 0.25) * beat, 0.03, 0.008, 'highpass', 8000) // shaker
    }
  }
  if (tr.melody === 'hook' && !sparse && bar % 4 !== 3) {
    // the hook over the first chords, nudged a little each time so it stays fresh
    const up = bar % 8 >= 4 ? 12 : 0 // second half of each 8 bars answers an octave up
    for (const [h, k] of HOOK) {
      if (r() < 0.08) continue
      voice(c, out, t + h * beat, hz(ch[k] + 12 + (up && k === 1 ? 12 : 0)), beat * 0.45, { type: 'triangle', gain: 0.05, attack: 0.006, release: beat * 0.35 })
    }
  } else if (tr.melody && bar % 2 === 1 && !sparse) {
    // a short pentatonic phrase every other bar, different each time
    const steps = 3 + Math.floor(r() * 3)
    let k = Math.floor(r() * PENTA.length)
    for (let i = 0; i < steps; i++) {
      k = Math.max(0, Math.min(PENTA.length - 1, k + (r() < 0.5 ? -1 : 1)))
      voice(c, out, t + (1 + i * 0.75) * beat, hz(PENTA[k] + 12), beat * 1.2, { type: 'triangle', gain: 0.035, attack: 0.02, release: beat })
    }
  }
  return len
}

/** A low, tense pulse for capital trouble (one bar). */
export function scheduleTension(c: Ctx, out: AudioNode, t: number, bpm: number) {
  const beat = 60 / bpm
  for (let i = 0; i < 8; i++) voice(c, out, t + i * beat * 0.5, hz(33), beat * 0.4, { type: 'sawtooth', gain: 0.04, attack: 0.01, lowpass: 220 })
}

/** Soft rain for a bar. */
export function scheduleRain(c: Ctx, out: AudioNode, t: number, len: number) {
  hiss(c, out, t, len * 1.05, 0.03, 'highpass', 4500)
}

/* ---------------- live player ---------------- */

interface Live {
  id: TrackId
  gain: GainNode
  bar: number
  next: number
  done: boolean
}

export class MusicPlayer {
  private c: AudioContext
  private master: GainNode
  private current: Live | null = null
  private timer: number | undefined
  private tension = 0
  private rain = false
  private tensionGain: GainNode
  private rainGain: GainNode

  constructor(c: AudioContext) {
    this.c = c
    this.master = c.createGain()
    this.master.gain.value = 0
    this.master.connect(c.destination)
    this.tensionGain = c.createGain()
    this.tensionGain.gain.value = 0
    this.tensionGain.connect(this.master)
    this.rainGain = c.createGain()
    this.rainGain.gain.value = 0
    this.rainGain.connect(this.master)
    this.timer = window.setInterval(() => this.tick(), 100)
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(v, this.c.currentTime, 0.2)
  }

  setLayers(tension: number, rain: boolean) {
    this.tension = tension
    this.rain = rain
    this.tensionGain.gain.setTargetAtTime(tension, this.c.currentTime, 1)
    this.rainGain.gain.setTargetAtTime(rain ? 1 : 0, this.c.currentTime, 1)
  }

  /** Cross-fade to another track (no-op if it is already playing). */
  play(id: TrackId | null) {
    if (this.current?.id === id && !this.current.done) return
    const now = this.c.currentTime
    if (this.current) {
      const g = this.current.gain
      g.gain.setTargetAtTime(0.0001, now, 0.4)
      setTimeout(() => g.disconnect(), 3000)
      this.current = null
    }
    if (!id) return
    const gain = this.c.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.setTargetAtTime(TRACKS[id].level, now, 0.6)
    gain.connect(this.master)
    this.current = { id, gain, bar: 0, next: now + 0.1, done: false }
    this.tick()
  }

  private tick() {
    const cur = this.current
    if (!cur || cur.done) return
    const tr = TRACKS[cur.id]
    while (cur.next < this.c.currentTime + 0.6) {
      if (tr.once && cur.bar >= tr.chords.length) {
        cur.done = true
        return
      }
      const len = scheduleBar(this.c, cur.gain, cur.id, cur.bar, cur.next)
      if (this.tension > 0.01 && (cur.id === 'city' || cur.id === 'boardroom')) scheduleTension(this.c, this.tensionGain, cur.next, tr.bpm)
      if (this.rain && (cur.id === 'city' || cur.id === 'boardroom')) scheduleRain(this.c, this.rainGain, cur.next, len)
      cur.next += len
      cur.bar++
    }
  }

  dispose() {
    clearInterval(this.timer)
    this.master.disconnect()
  }
}
