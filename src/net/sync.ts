// Saving: to the server when online (with a local backup), otherwise to this browser only.

import { G, save as saveLocal } from '../game/state';
import { net } from './client';

let lastAuto = 0;

export function saveGame(): boolean {
  const local = saveLocal();
  if (net.isOnline) {
    net.send({ t: 'save', state: G });
    // Keep the copy CONTINUE uses in step with what the server now has.
    net.serverSave = JSON.parse(JSON.stringify(G));
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
