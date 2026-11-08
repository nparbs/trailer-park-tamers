// Saving: to the server when online (with a local backup), otherwise to this browser only.

import { G, save as saveLocal, slot } from '../game/state';
import { net } from './client';

let lastAuto = 0;

export function saveGame(): boolean {
  const local = saveLocal();
  if (net.isOnline) {
    net.send(slot === 2 ? { t: 'save', state: G, slot: 2 } : { t: 'save', state: G });
    // Keep the copy CONTINUE uses in step with what the server now has.
    const copy = JSON.parse(JSON.stringify(G));
    if (slot === 2) net.serverSave2 = copy;
    else net.serverSave = copy;
    return true;
  }
  return local;
}

/** Quiet save after battles and map changes, at most every 15 seconds. */
export function autosave(force = false) {
  if (!G.flags.starter) return;
  const now = Date.now();
  if (!force && now - lastAuto < 15000) return;
  lastAuto = now;
  saveGame();
}
