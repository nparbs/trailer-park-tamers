// Chiptune sound effects and music, synthesised with Web Audio. No audio files.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let muted = false;
let musicOff = false;
const MUSIC_VOL = 0.32;

try {
  muted = localStorage.getItem('tpt-muted') === '1';
  musicOff = localStorage.getItem('tpt-music-off') === '1';
} catch {
  /* storage blocked */
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = musicOff ? 0 : MUSIC_VOL;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.5;
    sfxBus.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Browsers only allow audio after a user gesture; call this from input handlers. */
export function unlockAudio() {
  ac();
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem('tpt-muted', muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function isMuted() {
  return muted;
}

/** Music only: sound effects keep playing. Remembered in this browser. */
export function toggleMusic() {
  musicOff = !musicOff;
  try {
    localStorage.setItem('tpt-music-off', musicOff ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (musicBus && ctx) musicBus.gain.setTargetAtTime(musicOff ? 0 : MUSIC_VOL, ctx.currentTime, 0.05);
  return musicOff;
}

export function isMusicOff() {
  return musicOff;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, bus: GainNode, slideTo?: number) {
  // Use the bus's own context so the same synth can render offline for the promo video.
  const c = bus.context;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.setValueAtTime(vol, start + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(bus);
  o.start(start);
  o.stop(start + dur + 0.02);
}

let noiseBuf: AudioBuffer | null = null;
function noise(start: number, dur: number, vol: number, bus: GainNode, hp = 800) {
  const c = bus.context;
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  s.connect(f).connect(g).connect(bus);
  s.start(start);
  s.stop(start + dur);
}

const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freqOf(n: string) {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  const semis = NOTE[m[1]] + (parseInt(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12);
}

export type Sfx =
  | 'blip' | 'select' | 'move' | 'back' | 'bump' | 'door' | 'hit' | 'superhit' | 'weakhit' | 'faint' | 'shake'
  | 'caught' | 'levelup' | 'heal' | 'encounter' | 'exp' | 'throw' | 'statup' | 'statdown' | 'alert' | 'save' | 'buy';

export function sfx(name: Sfx) {
  const c = ac();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.005;
  const b = sfxBus;
  switch (name) {
    case 'blip': tone(1400, t, 0.018, 'square', 0.05, b); break;
    case 'select': tone(1200, t, 0.04, 'square', 0.12, b); tone(1800, t + 0.04, 0.05, 'square', 0.12, b); break;
    case 'move': tone(900, t, 0.03, 'square', 0.08, b); break;
    case 'back': tone(800, t, 0.04, 'square', 0.1, b); tone(500, t + 0.04, 0.05, 'square', 0.1, b); break;
    case 'bump': tone(110, t, 0.08, 'square', 0.15, b, 70); break;
    case 'door': noise(t, 0.12, 0.2, b, 300); tone(220, t, 0.1, 'triangle', 0.3, b, 110); break;
    case 'hit': noise(t, 0.14, 0.4, b, 400); tone(160, t, 0.12, 'square', 0.15, b, 60); break;
    case 'superhit': noise(t, 0.24, 0.5, b, 200); tone(240, t, 0.22, 'sawtooth', 0.18, b, 50); break;
    case 'weakhit': noise(t, 0.08, 0.25, b, 1500); break;
    case 'faint': tone(600, t, 0.5, 'square', 0.15, b, 80); break;
    case 'shake': tone(300, t, 0.05, 'square', 0.12, b); noise(t, 0.06, 0.15, b, 2000); break;
    case 'throw': tone(400, t, 0.25, 'triangle', 0.25, b, 1200); break;
    case 'caught': ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freqOf(n), t + i * 0.1, 0.12, 'square', 0.12, b)); break;
    case 'levelup': ['G4', 'B4', 'D5', 'G5', 'D5', 'G5'].forEach((n, i) => tone(freqOf(n), t + i * 0.08, 0.1, 'square', 0.12, b)); break;
    case 'heal': ['C5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freqOf(n), t + i * 0.12, 0.14, 'triangle', 0.3, b)); break;
    case 'encounter': for (let i = 0; i < 8; i++) tone(300 + i * 90, t + i * 0.04, 0.05, 'square', 0.1, b); break;
    case 'exp': tone(1600, t, 0.02, 'square', 0.04, b); break;
    case 'statup': for (let i = 0; i < 5; i++) tone(500 + i * 150, t + i * 0.05, 0.06, 'square', 0.08, b); break;
    case 'statdown': for (let i = 0; i < 5; i++) tone(1100 - i * 150, t + i * 0.05, 0.06, 'square', 0.08, b); break;
    case 'alert': tone(1500, t, 0.08, 'square', 0.15, b); tone(1500, t + 0.1, 0.12, 'square', 0.15, b); break;
    case 'save': ['E5', 'G5', 'C6'].forEach((n, i) => tone(freqOf(n), t + i * 0.1, 0.12, 'triangle', 0.3, b)); break;
    case 'buy': tone(1800, t, 0.05, 'square', 0.1, b); tone(2400, t + 0.06, 0.12, 'square', 0.1, b); break;
  }
}

/**
 * A hurt moan for a drifter that's running low: a buzzy voice pushed through two
 * vowel filters ("uhhh" sliding toward "ohhh"). 'crit' is lower, longer and wheezier.
 * seed picks the voice so each drifter always sounds like the same guy.
 */
export function moan(level: 'low' | 'crit', seed = 0) {
  const c = ac();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.01;
  const crit = level === 'crit';
  const base = 95 + (Math.abs(seed) % 7) * 12; // 95..167 Hz
  const f0 = crit ? base * 0.85 : base;
  const dur = crit ? 1.0 : 0.7;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(crit ? 0.5 : 0.45, t + 0.08);
  out.gain.setValueAtTime(crit ? 0.5 : 0.45, t + dur * 0.55);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(sfxBus);

  // Voice source: two slightly detuned saws, wobbling and sagging in pitch.
  const src = c.createGain();
  src.gain.value = 0.5;
  const lfo = c.createOscillator();
  const lfoAmt = c.createGain();
  lfo.frequency.value = crit ? 7 : 5.5;
  lfoAmt.gain.value = f0 * 0.04;
  lfo.connect(lfoAmt);
  for (const detune of [-8, 8]) {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.detune.value = detune;
    o.frequency.setValueAtTime(f0 * 1.12, t);
    o.frequency.linearRampToValueAtTime(f0, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(f0 * (crit ? 0.6 : 0.75), t + dur);
    lfoAmt.connect(o.frequency);
    o.connect(src);
    o.start(t);
    o.stop(t + dur);
  }
  lfo.start(t);
  lfo.stop(t + dur);

  // Two formants, gliding from "uh" toward "oh".
  for (const [a, b, q, g] of [[640, 480, 6, 1], [1150, 820, 8, 0.6]] as const) {
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = q;
    f.frequency.setValueAtTime(a, t);
    f.frequency.linearRampToValueAtTime(b, t + dur * 0.8);
    const fg = c.createGain();
    fg.gain.value = g;
    src.connect(f).connect(fg).connect(out);
  }
  // Breath, louder when they're nearly out.
  noise(t, dur * 0.9, crit ? 0.12 : 0.05, out, 1800);
}

// ---------- music ----------
// Each token is an eighth note: a pitch like E4, '.' for rest, '-' to hold the previous note.

interface Track {
  bpm: number;
  /** 'kick', 'snare' and 'hat' voices play drums: any token other than '.' or '-' is a hit. */
  voices: { wave: OscillatorType | 'kick' | 'snare' | 'hat'; vol: number; notes: string }[];
}

const TRACKS: Record<string, Track> = {
  title: {
    bpm: 112,
    voices: [
      { wave: 'square', vol: 0.09, notes: 'E4 - G4 A4 B4 - A4 G4 E4 - D4 E4 G4 - - . E4 - G4 A4 B4 - D5 B4 A4 - G4 A4 E4 - - . C5 - B4 A4 G4 - A4 B4 E4 - D4 E4 G4 - A4 - B4 - A4 G4 E4 - D4 - E4 - - - - - . .' },
      { wave: 'triangle', vol: 0.22, notes: 'E2 . E3 . E2 . E3 . C2 . C3 . D2 . D3 . E2 . E3 . E2 . E3 . C2 . C3 . D2 . D3 . A2 . A3 . A2 . A3 . E2 . E3 . E2 . E3 . C2 . C3 . D2 . D3 . E2 . E3 . E2 . B2 .' },
    ],
  },
  town: {
    bpm: 120,
    voices: [
      { wave: 'square', vol: 0.08, notes: 'G4 - B4 - D5 - B4 C5 D5 - - - B4 - G4 - A4 - C5 - B4 - A4 G4 A4 - - - - - . . G4 - B4 - D5 - E5 D5 C5 - B4 - A4 - G4 - A4 - B4 - A4 - F#4 - G4 - - - - - . .' },
      { wave: 'triangle', vol: 0.2, notes: 'G2 . D3 . G2 . D3 . G2 . D3 . G2 . B2 . D2 . A2 . D2 . A2 . D2 . A2 . D2 . F#2 . G2 . D3 . G2 . D3 . C3 . G2 . C3 . G2 . D2 . A2 . D2 . A2 . G2 . D3 . G2 . . .' },
    ],
  },
  route: {
    bpm: 132,
    voices: [
      { wave: 'square', vol: 0.08, notes: 'A4 - C5 - E5 - D5 C5 B4 - G4 - A4 - - - A4 - C5 - E5 - G5 E5 D5 - - - . . . . F5 - E5 - D5 - C5 - B4 - G4 - E4 - G4 A4 B4 - C5 - B4 - A4 - G#4 - A4 - - - . .' },
      { wave: 'triangle', vol: 0.2, notes: 'A2 A2 E3 A2 A2 A2 E3 A2 G2 G2 D3 G2 G2 G2 D3 G2 A2 A2 E3 A2 A2 A2 E3 A2 G2 G2 D3 G2 E2 E2 B2 E2 F2 F2 C3 F2 F2 F2 C3 F2 E2 E2 B2 E2 E2 E2 B2 E2 F2 F2 C3 F2 E2 E2 B2 E2 A2 A2 E3 A2 A2 . . .' },
    ],
  },
  battle: {
    bpm: 168,
    voices: [
      { wave: 'square', vol: 0.08, notes: 'E5 D#5 E5 . B4 . G4 . A4 B4 C5 . B4 . G4 . E5 D#5 E5 . B4 . G4 . A4 G4 F#4 . E4 . . . G4 A4 B4 . G4 A4 B4 . C5 B4 A4 . G4 . F#4 . G4 A4 B4 . E5 . D5 . C5 B4 A4 . B4 . . .' },
      { wave: 'triangle', vol: 0.22, notes: 'E2 E3 E2 E3 E2 E3 E2 E3 A2 A3 A2 A3 A2 A3 A2 A3 E2 E3 E2 E3 E2 E3 E2 E3 C3 C3 B2 B2 E2 E3 E2 E3 G2 G3 G2 G3 G2 G3 G2 G3 A2 A3 A2 A3 D2 D3 D2 D3 E2 E3 E2 E3 C3 C3 C3 C3 B2 B2 B2 B2 B2 B3 B2 B3' },
      { wave: 'square', vol: 0.03, notes: 'B4 . . . G4 . . . C5 . . . E4 . . . B4 . . . G4 . . . E4 . D#4 . G4 . . . D5 . . . D5 . . . E5 . . . A4 . . . B4 . . . G#4 . . . A4 . . . D#4 . . .' },
    ],
  },
  boss: {
    bpm: 176,
    voices: [
      { wave: 'square', vol: 0.08, notes: 'D5 . D5 C5 D5 . F5 . E5 . C5 . A4 . . . D5 . D5 C5 D5 . A5 . G5 . F5 . E5 . . . F5 . E5 . D5 . C5 . A#4 . A4 . G4 . A4 . A#4 . C5 . D5 . E5 . F5 . E5 . C#5 . . .' },
      { wave: 'triangle', vol: 0.24, notes: 'D2 D3 D2 D3 D2 D3 D2 D3 C2 C3 C2 C3 C2 C3 C2 C3 A#1 A#2 A#1 A#2 A#1 A#2 A#1 A#2 A1 A2 A1 A2 A1 A2 A1 A2 G1 G2 G1 G2 G1 G2 G1 G2 A#1 A#2 A#1 A#2 C2 C3 C2 C3 A1 A2 A1 A2 A1 A2 A1 A2 A1 A2 A1 A2 C#2 C#3 E2 E3' },
    ],
  },
  // 120 BPM in sixteenths (128 steps = 16 s), matching the intro's timeline.
  intro: {
    bpm: 240,
    voices: [
      { wave: 'triangle', vol: 0.24, notes: 'A1 - - - - - - - - - - - - - - - A1 . A2 . A1 . A2 . E1 . E2 . E1 . E2 . F1 . F2 . F1 . F2 . G1 . G2 . G1 . G2 . A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 G1 G2 G1 G2 E1 - - - E1 - - - E1 - - - E2 - E2 - A1 . . . A1 . . A1 . . A1 . . . E2 E2 A1 . A2 . C2 . D2 . E2 . G2 . A2 . . . F1 . F2 . G1 . G2 . A1 - - - - - - -' },
      { wave: 'square', vol: 0.06, notes: '. . . . . . . . . . . . . . . . A4 . . C5 . . E5 . D5 . C5 . A4 . . . G4 . . A4 . . C5 . B4 . A4 . G4 - - - A4 . C5 . E5 . A5 . G5 . E5 . D5 . C5 . . . . . E5 . E5 . E5 . . . G5 - - - . . . . E5 . . E5 . . E5 . . A5 - - E5 - - - D5 - - - C5 - - - E5 - - - A5 - - - - - - - - - - - - - - -' },
      { wave: 'kick', vol: 0.45, notes: '. . . . . . . . . . . . . . . . x . . . x . . . x . . . x . . . x . . . x . . . x . . . x . . . x . x . x . x . x . x . x . x . . . . . x . . . x . . . x . . . x . . . x . . x . . x . . x . . x . . . x . . . x . . . x . . . x . . . x . . . x . . . . . . .' },
      { wave: 'snare', vol: 0.14, notes: '. . . . . . . . . . . . . . . . . . . . x . . . . . . . x . . . . . . . x . . . . . . . x . . . . . . . . . . . x x x x x x x x . . . . x . . . . . . . . . . . . . . . . . . . . . . . . x . . x . . . x . . . . . . . x . . . . . . . x . . . . . . . . . . .' },
      { wave: 'hat', vol: 0.04, notes: '. . . . . . . . . . . . . . . . . . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . x . x . x . x . x . x . x . x . x . x . x . x . x . . . . .' },
    ],
  },
  park2: {
    bpm: 96,
    voices: [
      { wave: 'triangle', vol: 0.2, notes: 'G3 . D4 . G3 . D4 . C4 . G3 . C4 . G3 . D3 . A3 . D3 . A3 . G3 . D4 . B3 . D4 .' },
      { wave: 'square', vol: 0.06, notes: 'B4 - - D5 - B4 A4 G4 - - - . E4 G4 A4 - G4 - E4 D4 - - - . G4 A4 B4 D5 B4 A4 G4 - - -' },
      { wave: 'hat', vol: 0.05, notes: '. x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x' },
    ],
  },
  park: {
    bpm: 112,
    voices: [
      { wave: 'square', vol: 0.07, notes: 'D4 F#4 A4 - F#4 A4 B4 A4 F#4 - D4 - E4 - - . D4 F#4 A4 - B4 D5 B4 A4 F#4 - E4 - D4 - - .' },
      { wave: 'triangle', vol: 0.2, notes: 'D3 . A3 . D3 . A3 . G2 . D3 . A2 . E3 . D3 . A3 . G2 . D3 . A2 . E3 . D3 . . .' },
      { wave: 'kick', vol: 0.4, notes: 'x . . . x . . . x . . . x . . . x . . . x . . . x . . . x . . .' },
    ],
  },
  route2: {
    bpm: 126,
    voices: [
      { wave: 'square', vol: 0.07, notes: 'E4 - G4 - A4 - B4 - D5 - B4 A4 G4 - E4 - D4 - E4 - G4 - A4 - G4 - E4 - D4 - - - E4 - G4 - A4 - B4 - E5 - D5 B4 A4 - G4 - A4 - B4 - A4 G4 E4 - D4 - E4 - - - - -' },
      { wave: 'triangle', vol: 0.2, notes: 'E2 . B2 . E2 . B2 . C3 . G2 . C3 . G2 . D3 . A2 . D3 . A2 . E2 . B2 . E2 . B2 .' },
      { wave: 'hat', vol: 0.04, notes: 'x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x .' },
    ],
  },
  camp: {
    bpm: 84,
    voices: [
      { wave: 'triangle', vol: 0.22, notes: 'A2 . . . E3 . . . F2 . . . C3 . . . D2 . . . A2 . . . E2 . . . G#2 . . .' },
      { wave: 'square', vol: 0.05, notes: 'C5 - B4 - A4 - - - . . E4 - F4 - E4 - D4 - - - . . C4 - D4 - E4 - - - - - B3 - - - - - - - . . . .' },
      { wave: 'hat', vol: 0.03, notes: '. . x . . . x . . . x . . . x . . . x . . . x . . . x . . . x .' },
    ],
  },
  town2: {
    bpm: 104,
    voices: [
      { wave: 'square', vol: 0.07, notes: 'C5 - A4 - G4 - E4 - G4 A4 C5 - D5 - C5 - A4 - G4 - E4 - D4 - E4 - G4 - - - . . C5 - D5 - E5 - D5 C5 A4 - G4 - A4 - C5 - D5 - C5 - A4 - G4 - E4 - D4 - C4 - - - - -' },
      { wave: 'triangle', vol: 0.2, notes: 'F2 . C3 . F2 . C3 . C3 . G2 . C3 . G2 . A2 . E3 . A2 . E3 . G2 . D3 . G2 . D3 .' },
      { wave: 'kick', vol: 0.35, notes: 'x . . . . . x . x . . . . . . . x . . . . . x . x . . . . . . .' },
      { wave: 'snare', vol: 0.12, notes: '. . . . x . . . . . . . x . . . . . . . x . . . . . . . x . . .' },
    ],
  },
  corner: {
    bpm: 140,
    voices: [
      { wave: 'kick', vol: 0.5, notes: 'x . . . . . . x . . x . . . . . x . . . . . . . . . x . . . . .' },
      { wave: 'hat', vol: 0.05, notes: 'x x x x x x x x x x x x x x x x x x x x x x x x x . x x x x x x' },
      { wave: 'snare', vol: 0.15, notes: '. . . . . . . . x . . . . . . . . . . . . . . . x . . . . . . .' },
      { wave: 'triangle', vol: 0.24, notes: 'C2 - - - - - - - - - D#2 - - - - - G1 - - - - - - - - - A#1 - - - - -' },
      { wave: 'square', vol: 0.04, notes: 'G4 . . D#5 . . D5 . C5 . . . A#4 . . . G4 . . D#5 . . D5 . F5 . . . D#5 . D5 .' },
    ],
  },
  trap: {
    bpm: 144,
    voices: [
      { wave: 'kick', vol: 0.5, notes: 'x . . . . . . . . . x . . . . . x . . x . . . . . . . . x . . .' },
      { wave: 'hat', vol: 0.05, notes: 'x . x . x . x x x . x . x . x . x . x . x x x x x . x . x . x .' },
      { wave: 'snare', vol: 0.15, notes: '. . . . . . . . x . . . . . . . . . . . . . . . x . . . . . . .' },
      { wave: 'square', vol: 0.05, notes: 'A4 . . C5 . . E5 . . . D5 . C5 . B4 . A4 . . C5 . . F5 . . . E5 . D5 . . .' },
      { wave: 'triangle', vol: 0.22, notes: 'A1 - - - - - - - - - - - - - - - F1 - - - - - - - - - E1 - - - - -' },
    ],
  },
  lab: {
    bpm: 132,
    voices: [
      { wave: 'square', vol: 0.05, notes: 'E5 . D#5 . E5 . B4 . C5 . B4 . A4 . . . E5 . D#5 . E5 . B4 . D5 . C5 . B4 . . .' },
      { wave: 'triangle', vol: 0.2, notes: 'E2 E2 E3 E2 E2 E2 E3 E2 A1 A1 A2 A1 A1 A1 A2 A1 E2 E2 E3 E2 E2 E2 E3 E2 B1 B1 B2 B1 B1 B1 B2 B1' },
      { wave: 'hat', vol: 0.04, notes: 'x . x x x . x x x . x x x . x x x . x x x . x x x . x x x . x x' },
    ],
  },
  grow: {
    bpm: 72,
    voices: [
      { wave: 'triangle', vol: 0.22, notes: 'D3 . . . A2 . . . B2 . . . F#2 . . . G2 . . . D2 . . . G2 . . . A2 . . .' },
      { wave: 'square', vol: 0.04, notes: 'F#4 - - - A4 - - - D5 - - - C#5 - - - B4 - - - A4 - - - G4 - - - A4 - - -' },
      { wave: 'kick', vol: 0.3, notes: 'x . . . . . . . x . . x . . . . x . . . . . . . x . . x . . . .' },
      { wave: 'snare', vol: 0.08, notes: '. . . . x . . . . . . . x . . . . . . . x . . . . . . . x . . .' },
    ],
  },
  soup: {
    bpm: 92,
    voices: [
      { wave: 'triangle', vol: 0.2, notes: 'C4 E4 G4 C5 B4 G4 E4 D4 C4 E4 G4 A4 G4 - - . F4 A4 C5 F5 E5 C5 A4 G4 E4 G4 C5 B4 C5 - - .' },
      { wave: 'square', vol: 0.03, notes: 'C3 . . . G2 . . . A2 . . . E2 . . . F2 . . . C3 . . . G2 . . . C3 . . .' },
    ],
  },
  shop: {
    bpm: 128,
    voices: [
      { wave: 'square', vol: 0.06, notes: 'E5 C5 G4 C5 E5 - G5 - F5 D5 A4 D5 F5 - A5 - G5 E5 C5 E5 G5 - C6 - B5 - G5 - D5 - - .' },
      { wave: 'triangle', vol: 0.2, notes: 'C3 . G2 . C3 . G2 . D3 . A2 . D3 . A2 . E3 . C3 . E3 . C3 . G2 . D3 . G2 . . .' },
      { wave: 'hat', vol: 0.03, notes: '. x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x' },
    ],
  },
  // The Bottoms: slow, low, a little sour. E minor with a flat second.
  bottoms: {
    bpm: 88,
    voices: [
      { wave: 'triangle', vol: 0.26, notes: 'E2 . E2 E3 . E2 G2 . E2 . E2 E3 . F2 G2 F2 E2 . E2 E3 . E2 G2 . A2 . A2 G2 . F2 E2 D2 C2 . C2 C3 . C2 E2 . C2 . C2 C3 . D2 E2 D2 B1 . B1 B2 . B1 D#2 . B1 . B1 B2 . C2 D2 D#2' },
      { wave: 'square', vol: 0.05, notes: '. . . . B4 - G4 - . . . . A4 G4 F4 - . . . . B4 - G4 - . . E5 - D5 - B4 - . . . . G4 - E4 - . . . . F4 E4 C4 - . . . . F#4 - D#4 - . . B4 - A4 - F#4 -' },
      { wave: 'kick', vol: 0.4, notes: 'x . . . . . x . . . x . . . . . x . . . . . x . . . x . . . . .' },
      { wave: 'snare', vol: 0.12, notes: '. . . . x . . . . . . . x . . . . . . . x . . . . . . . x . . x' },
      { wave: 'hat', vol: 0.03, notes: 'x . x . x . x x x . x . x . x . x . x . x . x x x . x . x . x .' },
    ],
  },
  trainer: {
    bpm: 172,
    voices: [
      { wave: 'square', vol: 0.08, notes: 'A4 . A4 . C5 . A4 . D5 . C5 . A4 . G4 . A4 . A4 . C5 . A4 . E5 . D5 . C5 . . . F5 . E5 . D5 . C5 . D5 . C5 . A#4 . A4 . G4 . A4 . C5 . E5 . A5 . G#5 . . .' },
      { wave: 'triangle', vol: 0.22, notes: 'A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 G1 G2 G1 G2 A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 E1 E2 E1 E2 D2 D3 D2 D3 D2 D3 D2 D3 A#1 A#2 A#1 A#2 C2 C3 C2 C3 A1 A2 A1 A2 C2 C3 E2 E3 E1 E2 E1 E2 E1 E2 G#1 G#2' },
      { wave: 'kick', vol: 0.3, notes: 'x . . . x . . . x . . . x . . . x . . . x . . . x . . . x . . .' },
      { wave: 'snare', vol: 0.1, notes: '. . x . . . x . . . x . . . x . . . x . . . x . . . x . . . x .' },
    ],
  },
  pvp: {
    bpm: 180,
    voices: [
      { wave: 'square', vol: 0.08, notes: 'E5 . E5 . G5 . E5 . D5 . C5 . D5 . B4 . C5 . C5 . E5 . C5 . B4 . A4 . B4 . G#4 . A4 . C5 . E5 . A5 . G5 . F5 . E5 . D5 . C5 . D5 . E5 . . . . . . .' },
      { wave: 'triangle', vol: 0.22, notes: 'E2 E3 E2 E3 E2 E3 E2 E3 A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 F1 F2 F1 F2 E1 E2 E1 E2 E1 E2 E1 E2' },
      { wave: 'kick', vol: 0.35, notes: 'x . . x . . x . x . . x . . x . x . . x . . x . x . . x . . x .' },
      { wave: 'hat', vol: 0.04, notes: '. x . x . x . x . x . x . x . x . x . x . x . x . x . x . x . x' },
    ],
  },
  inside: {
    bpm: 100,
    voices: [
      { wave: 'triangle', vol: 0.18, notes: 'C4 E4 G4 E4 F4 A4 C5 A4 G4 B4 D5 B4 C5 - - . C4 E4 G4 E4 F4 A4 C5 A4 G4 F4 E4 D4 C4 - - .' },
      { wave: 'square', vol: 0.04, notes: 'C3 . . . F2 . . . G2 . . . C3 . . . C3 . . . F2 . . . G2 . . . C3 . . .' },
    ],
  },
  victory: {
    bpm: 140,
    voices: [
      { wave: 'square', vol: 0.09, notes: 'G4 G4 G4 - D5 - - . C5 B4 A4 - G4 - - . E4 F#4 G4 - A4 - B4 - G4 - - - - - . .' },
      { wave: 'triangle', vol: 0.22, notes: 'G2 . D3 . G2 . D3 . C3 . G2 . E2 . G2 . C3 . A2 . D3 . D2 . G2 . D3 . G2 . . .' },
    ],
  },
};

let current: string | null = null;
let timer: number | null = null;

function drum(kind: 'kick' | 'snare' | 'hat', t: number, vol: number, bus: GainNode) {
  if (kind === 'kick') tone(150, t, 0.12, 'sine', vol, bus, 45);
  else if (kind === 'snare') noise(t, 0.12, vol, bus, 1200);
  else noise(t, 0.03, vol, bus, 7000);
}

/** Play a track, or one picked at random from a list (keeping the current one if it's in the list). */
export function music(choice: string | string[] | null) {
  let name: string | null;
  if (Array.isArray(choice)) {
    if (current && choice.includes(current)) return;
    name = choice[Math.floor(Math.random() * choice.length)] ?? null;
  } else name = choice;
  if (name === current) return;
  current = name;
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  if (!name) return;
  const c = ac();
  if (!c || !musicBus) return;
  const tr = TRACKS[name];
  if (!tr) return;
  const step = 60 / tr.bpm / 2;
  const voices = tr.voices.map((v) => ({ ...v, tokens: v.notes.trim().split(/\s+/) }));
  const len = Math.max(...voices.map((v) => v.tokens.length));
  let nextT = c.currentTime + 0.08;
  let idx = 0;
  const bus = musicBus;
  const tick = () => {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.2) {
      for (const v of voices) {
        const tok = v.tokens[idx % v.tokens.length];
        if (tok === '.' || tok === '-' || !tok) continue;
        if (v.wave === 'kick' || v.wave === 'snare' || v.wave === 'hat') {
          drum(v.wave, nextT, v.vol, bus);
          continue;
        }
        let hold = 1;
        while (v.tokens[(idx + hold) % v.tokens.length] === '-' && hold < 16) hold++;
        tone(freqOf(tok), nextT, step * hold * 0.92, v.wave as OscillatorType, v.vol, bus);
      }
      idx = (idx + 1) % len;
      nextT += step;
    }
  };
  tick();
  timer = window.setInterval(tick, 40);
}

/** Restart the current track (for when audio was locked at boot). */
export function resumeMusic() {
  const name = current;
  current = null;
  music(name);
}

/**
 * Render a music track offline and return it as a 16-bit stereo WAV (base64).
 * Used by scripts/promo.mjs to give the promo video the same soundtrack as the game.
 */
export async function renderTrackWav(name: string, seconds: number): Promise<string> {
  const tr = TRACKS[name];
  if (!tr) throw new Error('No track ' + name);
  const rate = 44100;
  const oc = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate);
  const bus = oc.createGain();
  bus.gain.value = 0.5;
  bus.connect(oc.destination);
  const step = 60 / tr.bpm / 2;
  const voices = tr.voices.map((v) => ({ ...v, tokens: v.notes.trim().split(/\s+/) }));
  for (let idx = 0, t = 0.02; t < seconds; idx++, t += step) {
    for (const v of voices) {
      const tok = v.tokens[idx % v.tokens.length];
      if (tok === '.' || tok === '-' || !tok) continue;
      if (v.wave === 'kick' || v.wave === 'snare' || v.wave === 'hat') {
        drum(v.wave, t, v.vol, bus as GainNode);
        continue;
      }
      let hold = 1;
      while (v.tokens[(idx + hold) % v.tokens.length] === '-' && hold < 16) hold++;
      tone(freqOf(tok), t, Math.min(step * hold * 0.92, seconds - t), v.wave as OscillatorType, v.vol, bus as GainNode);
    }
  }
  const buf = await oc.startRendering();
  const n = buf.length;
  const out = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o: number, s: string) => [...s].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true);
  w(36, 'data'); out.setUint32(40, n * 4, true);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  for (let i = 0; i < n; i++) {
    out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  let bin = '';
  const bytes = new Uint8Array(out.buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
