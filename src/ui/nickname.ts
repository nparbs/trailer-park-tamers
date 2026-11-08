// Nicknames: a plain browser prompt, so phones get their own keyboard.

import { species } from '../data/species';
import type { Drifter } from '../game/creature';
import { Input } from '../game/input';
import { cleanName, MAX_NAME } from '../net/protocol';

/**
 * Ask for a nickname. Blank (or the species name) clears it; cancelling keeps the old one.
 * Returns true if the name changed.
 */
export function askNickname(d: Drifter): boolean {
  Input.releaseAll();
  const sp = species(d.sp).name;
  const typed = window.prompt(`Nickname for ${sp.toUpperCase()}? (up to ${MAX_NAME} letters, blank for none)`, d.nick ?? '');
  Input.releaseAll();
  if (typed === null) return false;
  const name = cleanName(typed);
  const before = d.nick;
  if (!name || name === sp.toUpperCase()) delete d.nick;
  else d.nick = name;
  return d.nick !== before;
}
