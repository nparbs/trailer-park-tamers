// Chiptune sound effects and music, synthesised with Web Audio. No audio files.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let muted = false;

try {
  muted = localStorage.getItem('tpt-muted') === '1';
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
    musicBus.gain.value = 0.32;
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

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, bus: GainNode, slideTo?: number) {
  const c = ctx!;
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
  const c = ctx!;
  if (!noiseBuf) {
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

// ---------- music ----------
// Each token is an eighth note: a pitch like E4, '.' for rest, '-' to hold the previous note.

interface Track {
  bpm: number;
  voices: { wave: OscillatorType; vol: number; notes: string }[];
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

export function music(name: string | null) {
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
        let hold = 1;
        while (v.tokens[(idx + hold) % v.tokens.length] === '-' && hold < 16) hold++;
        tone(freqOf(tok), nextT, step * hold * 0.92, v.wave, v.vol, bus);
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
