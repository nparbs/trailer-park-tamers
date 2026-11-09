// Time of day comes from the player's own clock, like the second-gen handhelds.
// Add ?hour=22 to the page address to try a different time.

export type Phase = 'morning' | 'day' | 'evening' | 'night';

export function hourNow(): number {
  try {
    const q = new URLSearchParams(location.search).get('hour');
    if (q !== null && q !== '' && !Number.isNaN(Number(q))) return ((Number(q) % 24) + 24) % 24;
  } catch {
    /* not in a browser */
  }
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

/** Morning 5-7, day 7-17, evening 17-19, night 19-5. */
export function phaseAt(h: number): Phase {
  if (h >= 5 && h < 7) return 'morning';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'evening';
  return 'night';
}

export function phase(): Phase {
  return phaseAt(hourNow());
}

export function isNight(p: Phase = phase()) {
  return p === 'night';
}

/** Multiply tint for outdoor maps and battle backgrounds (white = none). */
export const PHASE_TINT: Record<Phase, number> = {
  morning: 0xf8e8d8,
  day: 0xffffff,
  evening: 0xf8c098,
  night: 0x6878b8,
};

/** Days since 1970 in local time, for once-a-day things. */
export function dayNumber() {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
