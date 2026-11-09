// Per-device preferences. They live in this browser, not in the save, so a
// phone and a laptop can play the same game with different settings.

export type TextSpeed = 'slow' | 'mid' | 'fast';

export interface Settings {
  text: TextSpeed;
  /** Move animations in battle. Off skips the particle effects and lunges. */
  anims: boolean;
}

const KEY = 'tpt-settings';

function load(): Settings {
  const s: Settings = { text: 'mid', anims: true };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (raw.text === 'slow' || raw.text === 'mid' || raw.text === 'fast') s.text = raw.text;
    if (typeof raw.anims === 'boolean') s.anims = raw.anims;
  } catch {
    /* storage blocked or junk: defaults */
  }
  return s;
}

export const settings: Settings = load();

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Characters typed per 60 fps frame, normally and while A or B is held. */
export const TEXT_RATE: Record<TextSpeed, [number, number]> = {
  slow: [0.8, 4],
  mid: [1.5, 5],
  fast: [4, 10],
};
