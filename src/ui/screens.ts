// Full-screen menus shared by the overworld and battles: crew list, crew info,
// bag, shop, StreetDex, storage and the profile card.

import Phaser from 'phaser';
import { item, ITEMS, type ItemId } from '../data/items';
import { move, STATUS_NAME } from '../data/moves';
import { SPECIES, species, type SpeciesId } from '../data/species';
import { TYPE_INFO, type TypeId } from '../data/types';
import { displayName, expForLevel, maxHp, stats, type Drifter } from '../game/creature';
import { Input } from '../game/input';
import { G } from '../game/state';
import { net } from '../net/client';
import { sfx } from '../audio/sound';
import { wrap } from '../gfx/font';
import { cursor, H, label, panel, TEXT, UI, W } from './ui';

const DEPTH = 1100;

/** A full-screen layer that cleans up after itself. */
class Layer {
  objs: Phaser.GameObjects.GameObject[] = [];
  constructor(public scene: Phaser.Scene, bg = 0x5878a8) {
    const g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    g.fillStyle(bg).fillRect(0, 0, W, H);
    g.fillStyle(0x000000, 0.08);
    for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 8 : 0; x < W; x += 16) g.fillRect(x, y, 8, 8);
    this.objs.push(g);
  }
  add<T extends Phaser.GameObjects.GameObject>(o: T): T {
    (o as any).setDepth?.(DEPTH + 1 + ((o as any).depth > 1000 ? (o as any).depth - 1000 : 0));
    (o as any).setScrollFactor?.(0);
    this.objs.push(o);
    return o;
  }
  text(x: number, y: number, s: string, c = TEXT, shadow: number | null = 0xd0d0c8) {
    return this.add(label(this.scene, x, y, s, c, shadow));
  }
  panel(x: number, y: number, w: number, h: number, fill?: number) {
    return this.add(panel(this.scene, x, y, w, h, fill));
  }
  g() {
    return this.add(this.scene.add.graphics());
  }
  destroy() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
  }
}

export function hpColor(frac: number) {
  return frac > 0.5 ? 0x58d080 : frac > 0.2 ? 0xf8c030 : 0xf05048;
}

export function drawHpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, frac: number) {
  g.fillStyle(0x404048).fillRect(x, y, w + 18, 5);
  g.fillStyle(0xf8b040).fillRect(x + 1, y + 1, 14, 3);
  g.fillStyle(0x303030).fillRect(x + 16, y + 1, w, 3);
  g.fillStyle(hpColor(frac)).fillRect(x + 16, y + 1, Math.max(0, Math.round(w * frac)), 3);
}

function typeTag(l: Layer, x: number, y: number, t: TypeId) {
  const g = l.g();
  g.fillStyle(TYPE_INFO[t].color).fillRect(x, y, 50, 10);
  g.fillStyle(0x000000, 0.25).fillRect(x, y + 9, 50, 1);
  l.text(x + 25 - TYPE_INFO[t].name.length * 4, y + 1, TYPE_INFO[t].name, 0xf8f8f8, 0x404040);
}

// ---------------- crew list ----------------

export interface PartyOpts {
  title?: string;
  cancel?: boolean;
  /** Highlight entries that can't be picked (e.g. knocked out when switching in). */
  disabled?: (d: Drifter, i: number) => boolean;
  list?: Drifter[];
  /** Where the cursor starts. */
  initial?: number;
}

export async function pickFromParty(scene: Phaser.Scene, ui: UI, o: PartyOpts = {}): Promise<number> {
  const list = o.list ?? G.party;
  const l = new Layer(scene, 0x3c6c8c);
  const rowH = 23;
  const rows: { g: Phaser.GameObjects.Graphics; y: number }[] = [];
  list.forEach((d, i) => {
    const y = 4 + i * rowH;
    const g = l.g();
    rows.push({ g, y });
    const ico = l.add(scene.add.sprite(14, y + 10, 'w_sp:' + d.sp, 0));
    ico.setOrigin(0.5);
    l.text(28, y + 4, displayName(d).slice(0, 15), 0xf8f8f8, 0x404048);
    l.text(28, y + 13, 'Lv' + d.level, 0xf8f8f8, 0x404048);
    if (d.status) l.text(68, y + 13, STATUS_NAME[d.status], 0xf8d8d8, 0x904040);
    if (d.hp <= 0) l.text(68, y + 13, 'K.O.', 0xf8d8d8, 0x904040);
    const bar = l.g();
    drawHpBar(bar, 150, y + 5, 48, d.hp / maxHp(d));
    l.text(166, y + 12, `${String(d.hp).padStart(3)}/${String(maxHp(d)).padStart(3)}`, 0xf8f8f8, 0x404048);
    if (o.disabled?.(d, i)) {
      const dim = l.g();
      dim.fillStyle(0x000000, 0.3).fillRect(4, y, 232, rowH - 2);
    }
  });
  const msgP = l.panel(0, H - 18, W, 18);
  void msgP;
  l.text(8, H - 12, o.title ?? 'Choose a crew member.');
  let i = Math.max(0, Math.min(list.length - 1, o.initial ?? 0));
  const draw = () => {
    rows.forEach((r, k) => {
      r.g.clear();
      const sel = k === i;
      r.g.fillStyle(sel ? 0xf87848 : 0x283848).fillRoundedRect(4, r.y, 232, rowH - 2, 4);
      r.g.fillStyle(sel ? 0xf8a070 : 0x4c7c9c).fillRoundedRect(5, r.y + 1, 230, rowH - 4, 3);
    });
  };
  draw();
  if (!list.length) {
    await ui.loop(() => (Input.pressed('a') || Input.pressed('b') ? true : undefined));
    l.destroy();
    return -1;
  }
  const v = await ui.loop<number>(() => {
    if (Input.repeat('down')) { i = (i + 1) % list.length; sfx('move'); draw(); }
    if (Input.repeat('up')) { i = (i + list.length - 1) % list.length; sfx('move'); draw(); }
    if (Input.pressed('a')) { sfx('select'); return i; }
    if (Input.pressed('b') && o.cancel !== false) { sfx('back'); return -1; }
    return undefined;
  });
  l.destroy();
  return v;
}

// ---------------- crew info ----------------

export async function showSummary(scene: Phaser.Scene, ui: UI, d: Drifter) {
  const sp = species(d.sp);
  let page = 0;
  let l: Layer | null = null;
  const render = () => {
    l?.destroy();
    l = new Layer(scene, 0x6c8c5c);
    const g = l.g();
    g.fillStyle(0x283828).fillRect(0, 0, W, 14);
    l.text(6, 3, page === 0 ? 'CREW INFO' : 'STREETDEX NOTES', 0xf8f8f8, 0x405040);
    l.text(W - 70, 3, '< A/B >', 0xc8d8c8, null);
    l.panel(4, 16, 72, 72, 0xe8f0e0);
    l.add(scene.add.image(40, 52, 'pf_' + d.sp));
    l.text(84, 20, displayName(d).slice(0, 18), 0xf8f8f8, 0x405040);
    l.text(84, 30, 'Lv' + d.level, 0xf8f8f8, 0x405040);
    sp.types.forEach((t, k) => typeTag(l!, 130 + k * 54, 29, t as TypeId));
    if (page === 0) {
      const s = stats(d);
      l.panel(80, 42, 156, 46, 0xf8f8f0);
      l.text(90, 50, `HP ${d.hp}/${s.hp}`);
      l.text(90, 60, `ATK ${s.atk}`);
      l.text(160, 60, `DEF ${s.def}`);
      l.text(90, 70, `SPD ${s.spd}`);
      l.text(160, 70, d.status ? STATUS_NAME[d.status] : 'OK');
      const next = d.level >= 100 ? 0 : expForLevel(d.level + 1) - d.exp;
      l.panel(4, 90, W - 8, 66, 0xf8f8f0);
      d.moves.forEach((m, k) => {
        const mv = move(m.id);
        const y = 98 + k * 11;
        const gg = l!.g();
        gg.fillStyle(TYPE_INFO[mv.type].color).fillRect(12, y, 6, 7);
        l!.text(22, y, mv.name.toUpperCase().slice(0, 16));
        l!.text(164, y, `PP${String(m.pp).padStart(2)}/${mv.pp}`);
      });
      l.text(12, 143, `EXP TO NEXT LV: ${next}`, 0x606068);
    } else {
      l.panel(80, 42, 156, 46, 0xf8f8f0);
      l.text(90, 50, sp.name.toUpperCase().slice(0, 17));
      l.text(90, 62, `No.${String(Object.keys(SPECIES).indexOf(d.sp) + 1).padStart(3, '0')}`);
      l.text(90, 74, `BAGGED w/ ${d.caughtWith ?? 'LOVE'}`.slice(0, 18), 0x606068);
      l.panel(4, 90, W - 8, 66, 0xf8f8f0);
      wrap(sp.dex, 27).slice(0, 5).forEach((ln, k) => l!.text(12, 99 + k * 11, ln));
    }
  };
  render();
  await ui.loop(() => {
    if (Input.pressed('left') || Input.pressed('right') || Input.pressed('a')) {
      page = 1 - page;
      sfx('move');
      render();
    }
    if (Input.pressed('b')) { sfx('back'); return true; }
    return undefined;
  });
  (l as Layer | null)?.destroy();
}

// ---------------- bag ----------------

export async function pickItem(scene: Phaser.Scene, ui: UI, title = 'BAG'): Promise<ItemId | null> {
  const ids = (Object.keys(ITEMS) as ItemId[]).filter((k) => (G.bag[k] ?? 0) > 0);
  const l = new Layer(scene, 0xc89058);
  const g = l.g();
  g.fillStyle(0x6c4824).fillRect(0, 0, W, 14);
  l.text(6, 3, title, 0xf8f8f8, 0x6c4824);
  l.text(W - 70, 3, `$${G.money}`, 0xf8e8a0, null);
  l.panel(4, 16, W - 8, 96, 0xf8f0e0);
  const desc = l.panel(4, 114, W - 8, 44, 0xf8f8f8);
  void desc;
  const descLines = [l.text(12, 124, ''), l.text(12, 136, '')];
  const cur = l.add(cursor(scene));
  const visible = 7;
  let i = 0;
  let top = 0;
  const lines: Phaser.GameObjects.BitmapText[] = [];
  for (let k = 0; k < visible; k++) lines.push(l.text(22, 24 + k * 12, ''));
  const all = [...ids, null];
  const render = () => {
    if (i < top) top = i;
    if (i >= top + visible) top = i - visible + 1;
    for (let k = 0; k < visible; k++) {
      const id = all[top + k];
      if (top + k >= all.length) lines[k].setText('');
      else if (id === null) lines[k].setText('CLOSE BAG');
      else lines[k].setText(`${item(id).name.toUpperCase().padEnd(17)} x${String(G.bag[id]).padStart(2)}`);
    }
    cur.setPosition(13, 25 + (i - top) * 12);
    const id = all[i];
    const dl = id ? wrap(item(id).desc, 27) : ['Close the bag.'];
    descLines[0].setText(dl[0] ?? '');
    descLines[1].setText(dl[1] ?? '');
  };
  render();
  const v = await ui.loop<ItemId | null>(() => {
    if (Input.repeat('down')) { i = (i + 1) % all.length; sfx('move'); render(); }
    if (Input.repeat('up')) { i = (i + all.length - 1) % all.length; sfx('move'); render(); }
    if (Input.pressed('a')) { sfx('select'); return all[i] ?? null; }
    if (Input.pressed('b')) { sfx('back'); return null; }
    return undefined;
  });
  l.destroy();
  return v;
}

// ---------------- shop ----------------

export async function shop(scene: Phaser.Scene, ui: UI, stock: ItemId[]) {
  for (;;) {
    const l = new Layer(scene, 0x5878b8);
    const g = l.g();
    g.fillStyle(0x283868).fillRect(0, 0, W, 14);
    l.text(6, 3, 'GAS-N-GO', 0xf8f8f8, 0x283868);
    const money = l.text(W - 80, 3, `$${G.money}`, 0xf8e8a0, null);
    l.panel(4, 16, W - 8, 96, 0xf8f8f8);
    l.panel(4, 114, W - 8, 44, 0xf8f8f8);
    const d0 = l.text(12, 124, '');
    const d1 = l.text(12, 136, '');
    const cur = l.add(cursor(scene));
    const all: (ItemId | null)[] = [...stock, null];
    all.forEach((id, k) => {
      l.text(22, 24 + k * 12, id ? item(id).name.toUpperCase() : 'DONE');
      if (id) l.text(170, 24 + k * 12, `$${item(id).price}`.padStart(6));
    });
    let i = 0;
    const render = () => {
      cur.setPosition(13, 25 + i * 12);
      const id = all[i];
      const dl = id ? wrap(item(id).desc, 27) : ['Leave the store.'];
      d0.setText(dl[0] ?? '');
      d1.setText(dl[1] ?? '');
      money.setText(`$${G.money}`);
    };
    render();
    const pick = await ui.loop<ItemId | null>(() => {
      if (Input.repeat('down')) { i = (i + 1) % all.length; sfx('move'); render(); }
      if (Input.repeat('up')) { i = (i + all.length - 1) % all.length; sfx('move'); render(); }
      if (Input.pressed('a')) { sfx('select'); return all[i] ?? null; }
      if (Input.pressed('b')) { sfx('back'); return null; }
      return undefined;
    });
    if (!pick) {
      l.destroy();
      return;
    }
    // Quantity.
    const def = item(pick);
    const max = Math.max(0, Math.min(99, Math.floor(G.money / def.price)));
    if (max === 0) {
      d0.setText("You can't afford that.");
      d1.setText('');
      await ui.loop(() => (Input.pressed('a') || Input.pressed('b') ? true : undefined));
      l.destroy();
      continue;
    }
    let n = 1;
    const qp = l.panel(130, 84, 106, 28);
    void qp;
    const qt = l.text(140, 94, '');
    const rq = () => qt.setText(`x${String(n).padStart(2)}  $${n * def.price}`);
    rq();
    const ok = await ui.loop<boolean>(() => {
      if (Input.repeat('up')) { n = n >= max ? 1 : n + 1; sfx('move'); rq(); }
      if (Input.repeat('down')) { n = n <= 1 ? max : n - 1; sfx('move'); rq(); }
      if (Input.repeat('right')) { n = Math.min(max, n + 10); sfx('move'); rq(); }
      if (Input.repeat('left')) { n = Math.max(1, n - 10); sfx('move'); rq(); }
      if (Input.pressed('a')) return true;
      if (Input.pressed('b')) { sfx('back'); return false; }
      return undefined;
    });
    if (ok) {
      G.money -= n * def.price;
      G.bag[pick] = (G.bag[pick] ?? 0) + n;
      sfx('buy');
      d0.setText(`Here's ${n} ${def.name.toUpperCase()}.`);
      d1.setText(n >= 10 && def.kind === 'catch' ? 'No questions asked.' : 'Thank you, come again!');
      money.setText(`$${G.money}`);
      await ui.loop(() => (Input.pressed('a') || Input.pressed('b') ? true : undefined));
    }
    l.destroy();
  }
}

// ---------------- StreetDex ----------------

export async function streetDex(scene: Phaser.Scene, ui: UI) {
  const ids = Object.keys(SPECIES) as SpeciesId[];
  const l = new Layer(scene, 0xb84848);
  const g = l.g();
  g.fillStyle(0x602020).fillRect(0, 0, W, 14);
  l.text(6, 3, 'STREETDEX', 0xf8f8f8, 0x602020);
  l.text(120, 3, `SEEN ${G.seen.length}  OWN ${G.caught.length}`, 0xf8d8d8, null);
  l.panel(4, 16, 148, 140, 0xf8f8f8);
  l.panel(154, 16, 82, 82, 0xf8f0f0);
  const pic = l.add(scene.add.image(195, 57, 'pf_' + ids[0]));
  const visible = 11;
  const lines: Phaser.GameObjects.BitmapText[] = [];
  for (let k = 0; k < visible; k++) lines.push(l.text(22, 24 + k * 12, ''));
  const cur = l.add(cursor(scene));
  let i = 0;
  let top = 0;
  const render = () => {
    if (i < top) top = i;
    if (i >= top + visible) top = i - visible + 1;
    for (let k = 0; k < visible; k++) {
      const id = ids[top + k];
      if (!id) { lines[k].setText(''); continue; }
      const seen = G.seen.includes(id);
      const own = G.caught.includes(id);
      lines[k].setText(`${String(top + k + 1).padStart(3, '0')}${own ? '*' : ' '}${seen ? species(id).name.toUpperCase().slice(0, 11) : '----------'}`);
    }
    cur.setPosition(13, 25 + (i - top) * 12);
    const id = ids[i];
    const seen = G.seen.includes(id);
    pic.setTexture('pf_' + id).setTintFill(seen ? 0xffffff : 0x404048);
    if (seen) pic.clearTint();
  };
  render();
  l.text(158, 108, '*=OWNED', 0xf8e8e8, 0x602020);
  l.text(158, 120, 'A:NOTES', 0xf8e8e8, 0x602020);
  await ui.loop(() => {
    if (Input.repeat('down')) { i = (i + 1) % ids.length; sfx('move'); render(); }
    if (Input.repeat('up')) { i = (i + ids.length - 1) % ids.length; sfx('move'); render(); }
    if (Input.pressed('a') && G.seen.includes(ids[i])) {
      sfx('select');
      const id = ids[i];
      const box = new Layer(scene, 0xb84848);
      box.panel(4, 4, W - 8, H - 8, 0xf8f8f8);
      box.add(scene.add.image(44, 48, 'pf_' + id));
      box.text(84, 16, species(id).name.toUpperCase());
      species(id).types.forEach((t, k) => typeTag(box, 84 + k * 54, 30, t as TypeId));
      const own = G.caught.includes(id);
      wrap(own ? species(id).dex : 'Bag one to learn more about them.', 27).slice(0, 6).forEach((ln, k) => box.text(12, 88 + k * 11, ln));
      void ui.loop(() => (Input.pressed('a') || Input.pressed('b') ? true : undefined)).then(() => box.destroy());
      return undefined;
    }
    if (Input.pressed('b')) { sfx('back'); return true; }
    return undefined;
  });
  l.destroy();
}

// ---------------- profile ----------------

export async function profile(scene: Phaser.Scene, ui: UI) {
  const l = new Layer(scene, 0x488868);
  l.panel(8, 12, W - 16, H - 24, 0xf0f8f0);
  l.text(20, 24, 'STREET ID CARD');
  l.add(scene.add.image(196, 60, 'tf_out' + (G.outfit ?? 0))).setScale(1);
  l.text(20, 44, `NAME   ${G.name}`);
  l.text(20, 58, `MONEY  $${G.money}`);
  l.text(20, 72, `DEX    ${G.caught.length}`);
  const mins = Math.floor(G.playMs / 60000);
  l.text(20, 86, `TIME   ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`);
  l.text(20, 106, 'STREET CRED:');
  l.text(20, 120, G.badges.length ? G.badges.join(', ') : 'NONE YET', 0x806040);
  if (net.isOnline) l.text(20, 136, `CODE ${net.prettyCode}`, 0x606068);
  else l.text(20, 136, 'OFFLINE: saves stay here', 0x606068);
  await ui.loop(() => (Input.pressed('a') || Input.pressed('b') ? true : undefined));
  l.destroy();
}

// ---------------- storage ----------------

export async function storage(scene: Phaser.Scene, ui: UI) {
  for (;;) {
    await ui.say('STORAGE UNIT #13. What do you want to do?', 1);
    const c = await ui.choose(['WITHDRAW', 'DEPOSIT', 'HANG UP'], { cancel: true });
    if (c === 0) {
      if (!G.storage.length) { await ui.say('The unit is empty. It smells like old mattresses.'); continue; }
      if (G.party.length >= 6) { await ui.say('Your crew is full!'); continue; }
      ui.close();
      const k = await pickFromParty(scene, ui, { list: G.storage, title: 'Take who?' });
      if (k >= 0) {
        const [d] = G.storage.splice(k, 1);
        G.party.push(d);
        await ui.say(`${displayName(d)} rejoined your crew.`);
      }
    } else if (c === 1) {
      if (G.party.length <= 1) { await ui.say("You can't leave yourself without a crew!"); continue; }
      ui.close();
      const k = await pickFromParty(scene, ui, { title: 'Store who?' });
      if (k >= 0) {
        const [d] = G.party.splice(k, 1);
        G.storage.push(d);
        await ui.say(`${displayName(d)} went into storage.`);
      }
    } else break;
  }
}

export { DEPTH as SCREEN_DEPTH };
