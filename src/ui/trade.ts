// Trading screen: your crew on the left, theirs on the right. Pick one to offer,
// see what they offer, and both confirm.

import Phaser from 'phaser';
import { species } from '../data/species';
import { displayName, type Drifter } from '../game/creature';
import { Input } from '../game/input';
import { G, slot } from '../game/state';
import { net } from '../net/client';
import { sfx } from '../audio/sound';
import { cursor, H, label, panel, UI, W } from './ui';
import { showSummary } from './screens';

const DEPTH = 1100;

export type TradeResult = { done: true; state: unknown; got: Drifter } | { done: false; reason: string };

export async function tradeScreen(scene: Phaser.Scene, ui: UI, foeName: string, foeTeam: Drifter[]): Promise<TradeResult> {
  const objs: Phaser.GameObjects.GameObject[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    (o as any).setScrollFactor?.(0);
    (o as any).setDepth?.(DEPTH + ((o as any).depth >= 1000 ? (o as any).depth - 1000 : 1));
    objs.push(o);
    return o;
  };
  const bg = add(scene.add.graphics());
  bg.fillStyle(0x4c6c8c).fillRect(0, 0, W, H);
  bg.fillStyle(0x283848).fillRect(0, 0, W, 14);
  add(label(scene, 6, 3, `TRADE WITH ${foeName}`, 0xf8f8f8, 0x283848));
  add(panel(scene, 2, 16, 118, 100, 0xf8f8f8));
  add(panel(scene, 120, 16, 118, 100, 0xf0f0f8));
  add(label(scene, 12, 22, 'YOU', 0x806040));
  add(label(scene, 130, 22, foeName.slice(0, 12), 0x806040));
  const rowY = (i: number) => 34 + i * 13;
  G.party.forEach((d, i) => add(label(scene, 22, rowY(i), `${displayName(d).toUpperCase().slice(0, 9)}`)));
  G.party.forEach((d, i) => add(label(scene, 96, rowY(i), String(d.level).padStart(2), 0x606068)));
  foeTeam.forEach((d, i) => add(label(scene, 140, rowY(i), `${displayName(d).toUpperCase().slice(0, 9)}`)));
  foeTeam.forEach((d, i) => add(label(scene, 214, rowY(i), String(d.level).padStart(2), 0x606068)));
  const myMark = add(scene.add.graphics());
  const theirMark = add(scene.add.graphics());
  const cur = add(cursor(scene));
  add(panel(scene, 0, 118, W, 42));
  const msg1 = add(label(scene, 10, 128, ''));
  const msg2 = add(label(scene, 10, 142, ''));

  let i = 0;
  let mine: number | null = null;
  let theirs: number | null = null;
  let confirmed = false;
  let outcome: TradeResult | null = null;

  const render = () => {
    cur.setPosition(13, rowY(i) + 1);
    myMark.clear();
    theirMark.clear();
    if (mine !== null) myMark.fillStyle(0xf8d070, 0.6).fillRect(8, rowY(mine) - 2, 108, 12);
    if (theirs !== null) theirMark.fillStyle(0x70d0f8, 0.6).fillRect(126, rowY(theirs) - 2, 108, 12);
    const theirName = theirs !== null && foeTeam[theirs] ? species(foeTeam[theirs].sp).name.toUpperCase() : null;
    if (confirmed) {
      msg1.setText('Confirmed. Waiting for');
      msg2.setText(`${foeName}...`);
    } else if (mine !== null && theirName) {
      msg1.setText(`For ${theirName.slice(0, 15)}.`);
      msg2.setText('A: CONFIRM  B: CANCEL');
    } else {
      msg1.setText(mine === null ? 'Pick who to offer. B: quit' : 'Waiting for their offer...');
      msg2.setText(theirName ? `They offer ${theirName.slice(0, 13)}` : '');
    }
  };
  render();

  const offs = [
    net.on('tr_offered', (m) => {
      theirs = m.index;
      confirmed = false;
      sfx('select');
      render();
    }),
    net.on('tr_done', (m) => (outcome = { done: true, state: m.state, got: m.got })),
    net.on('tr_cancelled', (m) => (outcome = { done: false, reason: m.reason })),
    net.on('online', () => {
      if (net.status === 'offline') outcome = { done: false, reason: 'Lost the connection to the server.' };
    }),
  ];

  const res = await ui.loop<TradeResult>(() => {
    if (outcome) return outcome;
    if (confirmed) return undefined;
    const n = G.party.length;
    if (Input.repeat('down')) { i = (i + 1) % n; sfx('move'); render(); }
    if (Input.repeat('up')) { i = (i + n - 1) % n; sfx('move'); render(); }
    if (Input.pressed('select')) void showSummary(scene, ui, G.party[i]);
    if (Input.pressed('a')) {
      if (mine === i && theirs !== null) {
        if (G.party.length < 1) return undefined;
        confirmed = true;
        sfx('select');
        net.send(slot === 2 ? { t: 'tr_confirm', state: G, slot: 2 } : { t: 'tr_confirm', state: G });
      } else {
        mine = i;
        sfx('select');
        net.send({ t: 'tr_offer', index: i });
      }
      render();
    }
    if (Input.pressed('b')) {
      sfx('back');
      net.send({ t: 'tr_cancel' });
      return { done: false, reason: 'You called it off.' };
    }
    return undefined;
  });
  offs.forEach((o) => o());
  objs.forEach((o) => o.destroy());
  return res;
}
