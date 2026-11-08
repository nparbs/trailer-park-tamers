import Phaser from 'phaser';
import { getMap, type MapDef, type NpcDef, type TrainerDef } from '../data/maps';
import { item } from '../data/items';
import { type SpeciesId } from '../data/species';
import { makeDrifter, type Drifter } from '../game/creature';
import { Input } from '../game/input';
import { G, addItem, healParty, type Dir } from '../game/state';
import { net } from '../net/client';
import { autosave, saveGame } from '../net/sync';
import { OnlineLayer } from './online';
import { isChatOpen } from '../ui/chat';
import { INDOOR, OUTDOOR, tileIndex, type TileDef } from '../gfx/tiles';
import { music, sfx } from '../audio/sound';
import { UI, label, panel } from '../ui/ui';
import { pickFromParty, pickItem, profile, showSummary, streetDex } from '../ui/screens';
import { SCRIPTS } from './scripts';
import type { BattleResult } from '../game/battle';
import type { BattleData } from './Battle';
import { useItemOutside } from './items';

const TS = 16;
const WALK_MS = 210;
const RUN_MS = 115;
const SKATE_MS = 85;
const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const FRAME0: Record<Dir, number> = { down: 0, up: 3, left: 6, right: 6 };

export interface Walker {
  id: string;
  x: number;
  y: number;
  dir: Dir;
  spr: Phaser.GameObjects.Sprite;
  weeds: Phaser.GameObjects.Image;
  moving: boolean;
  step: number;
  def?: NpcDef;
  home?: { x: number; y: number };
  nextWander?: number;
}

export class Overworld extends Phaser.Scene {
  ui!: UI;
  map!: MapDef;
  legend!: TileDef[];
  player!: Walker;
  npcs: Walker[] = [];
  private busy = false;
  private lastBump = 0;
  private turnLock = 0;
  private pendingWarp = false;
  private nameTag: Phaser.GameObjects.GameObject[] = [];
  online!: OnlineLayer;
  private quitToTitle = false;
  skating = false;
  private board?: Phaser.GameObjects.Graphics;

  constructor() {
    super('Overworld');
  }

  create() {
    this.ui = new UI(this);
    this.npcs = [];
    this.busy = false;
    this.pendingWarp = false;
    this.online = new OnlineLayer(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.online.destroy());
    this.loadMap(G.map, G.x, G.y, G.facing);
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.events.on(Phaser.Scenes.Events.WAKE, () => Input.consume());
  }

  // ---------- map building ----------

  private loadMap(id: string, x: number, y: number, facing: Dir) {
    this.children.removeAll(true);
    this.npcs = [];
    this.ui = new UI(this);
    this.map = getMap(id);
    this.legend = this.map.indoor ? INDOOR : OUTDOOR;
    G.map = id;
    G.x = x;
    G.y = y;
    G.facing = facing;

    const idx = tileIndex(this.legend);
    const data = this.map.rows.map((r) => [...r].map((ch) => idx.get(ch) ?? 0));
    const tm = this.make.tilemap({ data, tileWidth: TS, tileHeight: TS });
    const ts = tm.addTilesetImage(this.map.indoor ? 'tiles-in' : 'tiles-out', this.map.indoor ? 'tiles-in' : 'tiles-out', TS, TS, 0, 0)!;
    tm.createLayer(0, ts, 0, 0)!.setDepth(0);

    const mw = this.map.rows[0].length * TS;
    const mh = this.map.rows.length * TS;
    const cam = this.cameras.main;
    cam.setBackgroundColor(this.map.indoor ? 0x101014 : 0x203018);
    // Small rooms are centred instead of clamped.
    const bw = Math.max(mw, 240);
    const bh = Math.max(mh, 160);
    cam.setBounds(-(bw - mw) / 2, -(bh - mh) / 2, bw, bh);
    cam.roundPixels = true;

    this.player = this.makeWalker('player', 'w_out' + (G.outfit ?? 0), x, y, facing);
    cam.startFollow(this.player.spr, true, 1, 1, 0, 0);
    cam.setFollowOffset(-8, -6);

    for (const n of this.map.npcs) {
      if (n.when && !n.when(G.flags)) continue;
      if (n.item && G.flags['got_' + n.id]) continue;
      const key = n.look === 'item' ? 'item' : 'w_' + n.look;
      const w = this.makeWalker(n.id, key, n.x, n.y, n.dir ?? 'down');
      w.def = n;
      w.home = { x: n.x, y: n.y };
      w.nextWander = this.time.now + 1000 + Math.random() * 3000;
      this.npcs.push(w);
    }
    music(this.map.music);
    if (!this.map.indoor) this.showMapName();
    this.online?.onMapLoaded();
    if (this.map.indoor) this.skating = false;
    this.board = undefined;
    this.drawBoard();
  }

  private showMapName() {
    this.nameTag.forEach((o) => o.destroy());
    const w = this.map.name.length * 8 + 20;
    const g = panel(this, 4, -30, w, 22);
    const t = label(this, 14, -22, this.map.name);
    this.nameTag = [g, t];
    this.tweens.add({ targets: [g, t], y: '+=34', duration: 300, ease: 'Quad.out' });
    this.tweens.add({ targets: [g, t], y: '-=34', duration: 300, delay: 2200, ease: 'Quad.in', onComplete: () => { g.destroy(); t.destroy(); } });
  }

  private makeWalker(id: string, key: string, x: number, y: number, dir: Dir): Walker {
    const spr = this.add.sprite(x * TS, y * TS - 3, key, key === 'item' ? undefined : FRAME0[dir]).setOrigin(0, 0);
    if (key === 'item') spr.setY(y * TS);
    spr.setFlipX(dir === 'right');
    const weeds = this.add.image(x * TS, y * TS, 'weeds').setOrigin(0, 0).setVisible(false);
    const w: Walker = { id, x, y, dir, spr, weeds, moving: false, step: 0 };
    this.sortWalker(w);
    this.updateWeeds(w);
    return w;
  }

  private sortWalker(w: Walker) {
    w.spr.setDepth(10 + w.spr.y / 1000 + (w.id === 'player' ? 0.0001 : 0));
    w.weeds.setDepth(w.spr.depth + 0.00005);
  }

  private updateWeeds(w: Walker) {
    const t = this.tile(w.x, w.y);
    // Encounter ground is camp litter now, nothing to hide your legs in.
    w.weeds.setPosition(w.x * TS, w.y * TS).setVisible(false);
    void t;
  }

  // ---------- queries ----------

  tile(x: number, y: number): TileDef | undefined {
    const ch = this.map.rows[y]?.[x];
    if (ch === undefined) return undefined;
    return this.legend.find((t) => t.ch === ch);
  }

  npcAt(x: number, y: number) {
    return this.npcs.find((n) => (n.x === x && n.y === y) || (n.moving && n.x === x && n.y === y));
  }

  blocked(x: number, y: number, self?: Walker) {
    const t = this.tile(x, y);
    if (!t || t.solid) return true;
    if (this.npcs.some((n) => n !== self && n.x === x && n.y === y)) return true;
    if (self !== this.player && this.player.x === x && this.player.y === y) return true;
    return false;
  }

  warpAt(x: number, y: number) {
    return this.map.warps.find((w) => x >= w.x && x < w.x + (w.w ?? 1) && y >= w.y && y < w.y + (w.h ?? 1));
  }

  // ---------- walking ----------

  setFacing(w: Walker, dir: Dir) {
    w.dir = dir;
    if (w.spr.texture.key === 'item') return;
    w.spr.setFrame(FRAME0[dir]).setFlipX(dir === 'right');
  }

  /** Step one tile. Resolves when the step finishes. */
  stepWalker(w: Walker, dir: Dir, ms = WALK_MS): Promise<void> {
    this.setFacing(w, dir);
    const [dx, dy] = DV[dir];
    w.x += dx;
    w.y += dy;
    w.moving = true;
    w.step = (w.step + 1) % 2;
    w.spr.setFrame(FRAME0[dir] + 1 + w.step).setFlipX(dir === 'right');
    w.weeds.setVisible(false);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: w.spr,
        x: w.x * TS,
        y: w.y * TS - 3,
        duration: ms,
        onUpdate: () => this.sortWalker(w),
        onComplete: () => {
          w.moving = false;
          w.spr.setFrame(FRAME0[dir]).setFlipX(dir === 'right');
          this.sortWalker(w);
          this.updateWeeds(w);
          resolve();
        },
      });
      // Mid-step frame change for a smoother walk.
      this.time.delayedCall(ms * 0.55, () => {
        if (w.moving) w.spr.setFrame(FRAME0[dir]).setFlipX(dir === 'right');
      });
    });
  }

  async walk(w: Walker, dir: Dir, steps: number, ms = WALK_MS) {
    for (let i = 0; i < steps; i++) await this.stepWalker(w, dir, ms);
  }

  removeNpc(id: string) {
    const n = this.npcs.find((x) => x.id === id);
    if (!n) return;
    n.spr.destroy();
    n.weeds.destroy();
    this.npcs = this.npcs.filter((x) => x !== n);
  }

  npc(id: string) {
    return this.npcs.find((n) => n.id === id);
  }

  // ---------- frame loop ----------

  update(_t: number, dt: number) {
    G.playMs += dt;
    this.online.tick();
    if (this.board && this.player) this.board.setPosition(this.player.spr.x, this.player.spr.y + 2).setDepth(this.player.spr.depth - 0.00001);
    if (isChatOpen()) return;
    if (this.ui.busy) {
      this.ui.update();
      return;
    }
    if (this.busy || this.player.moving || this.pendingWarp) return;
    if (this.online.pump()) return;

    if (Input.pressed('start')) {
      void this.run(() => this.startMenu()).then(() => {
        if (!this.quitToTitle) return;
        this.quitToTitle = false;
        net.send({ t: 'leave' });
        music(null);
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Title'));
      });
      return;
    }
    if (Input.pressed('a')) {
      this.run(() => this.interact());
      return;
    }
    if (Input.pressed('select') && G.bag.SKATEBOARD) {
      this.toggleSkate();
      return;
    }

    const dir = Input.dir() as Dir | null;
    if (dir) {
      if (dir !== this.player.dir && Input.heldFor(dir) < 90 && this.time.now > this.turnLock) {
        this.setFacing(this.player, dir);
        G.facing = dir;
        this.online.sendMove(this.player.x, this.player.y, dir);
        this.turnLock = this.time.now + 90;
        return;
      }
      if (this.time.now < this.turnLock) return;
      this.tryMove(dir);
    }

    this.wanderNpcs();
  }

  private wanderNpcs() {
    const now = this.time.now;
    for (const n of this.npcs) {
      if (!n.def?.wander || n.moving || (n.nextWander ?? 0) > now) continue;
      n.nextWander = now + 1500 + Math.random() * 3000;
      const dirs: Dir[] = ['up', 'down', 'left', 'right'];
      const d = dirs[Math.floor(Math.random() * 4)];
      if (Math.random() < 0.5) {
        this.setFacing(n, d);
        continue;
      }
      const [dx, dy] = DV[d];
      const nx = n.x + dx;
      const ny = n.y + dy;
      if (Math.abs(nx - n.home!.x) > 2 || Math.abs(ny - n.home!.y) > 2) continue;
      if (this.blocked(nx, ny, n) || this.warpAt(nx, ny)) continue;
      void this.stepWalker(n, d, 260);
    }
  }

  private tryMove(dir: Dir) {
    const p = this.player;
    const [dx, dy] = DV[dir];
    const nx = p.x + dx;
    const ny = p.y + dy;
    const here = this.warpAt(p.x, p.y);
    if (this.blocked(nx, ny, p)) {
      // Doormats and map edges: walking "out" of a warp tile uses it.
      if (here && !this.tile(nx, ny)) {
        this.doWarp(here, dir);
        return;
      }
      setFacingIfNeeded(this, p, dir);
      if (this.time.now - this.lastBump > 350) {
        sfx('bump');
        this.lastBump = this.time.now;
      }
      return;
    }
    G.facing = dir;
    this.online.sendMove(nx, ny, dir);
    const run = Input.held('b');
    const ms = this.skating ? SKATE_MS : run ? RUN_MS : WALK_MS;
    void this.stepWalker(p, dir, ms).then(() => this.afterStep(dir));
  }

  private async afterStep(dir: Dir) {
    const p = this.player;
    G.x = p.x;
    G.y = p.y;
    const warp = this.warpAt(p.x, p.y);
    if (warp) {
      this.doWarp(warp, dir);
      return;
    }
    const trig = this.map.triggers?.find((t) => p.x >= t.x && p.x < t.x + (t.w ?? 1) && p.y >= t.y && p.y < t.y + (t.h ?? 1) && (!t.when || t.when(G.flags)));
    if (trig) {
      await this.run(() => SCRIPTS[trig.script](this));
      return;
    }
    if (await this.checkTrainers()) return;
    const t = this.tile(p.x, p.y);
    if (t?.enc) this.maybeEncounter();
  }

  private doWarp(w: { to: string; tx: number; ty: number; x: number; y: number; face?: Dir }, dir: Dir) {
    const p = this.player;
    const tx = w.tx + (p.x - w.x);
    const ty = w.ty + (p.y - w.y);
    const target = getMap(w.to);
    const isDoor = target.indoor !== this.map.indoor || this.map.indoor;
    this.pendingWarp = true;
    if (isDoor) sfx('door');
    this.cameras.main.fadeOut(isDoor ? 180 : 140, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.loadMap(w.to, Math.max(0, tx), Math.max(0, ty), w.face ?? dir);
      this.pendingWarp = false;
      autosave();
      this.cameras.main.fadeIn(180, 0, 0, 0);
      Input.consume();
    });
  }

  warpTo(map: string, x: number, y: number, face: Dir = 'down') {
    return new Promise<void>((resolve) => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.loadMap(map, x, y, face);
        this.cameras.main.fadeIn(250, 0, 0, 0);
        resolve();
      });
    });
  }

  /** Run a script with player control blocked, then close any open dialog. */
  async run(fn: () => Promise<void> | void) {
    if (this.busy) return;
    this.busy = true;
    this.online.setBusy(true);
    try {
      await fn();
    } finally {
      this.ui.close();
      this.busy = false;
      this.online.setBusy(false);
      Input.consume();
    }
  }

  // ---------- interaction ----------

  private async interact() {
    const p = this.player;
    const [dx, dy] = DV[p.dir];
    let tx = p.x + dx;
    let ty = p.y + dy;
    const other = this.online.playerAt(tx, ty);
    if (other && !this.npcAt(tx, ty)) {
      await this.online.playerMenu(other);
      return;
    }
    let n = this.npcAt(tx, ty);
    // Talk across counters.
    const t = this.tile(tx, ty);
    if (!n && t && this.map.indoor && 'zP$'.includes(t.ch)) {
      tx += dx;
      ty += dy;
      n = this.npcAt(tx, ty);
    }
    if (n?.def) {
      await this.talkTo(n);
      return;
    }
    const sign = this.map.signs?.find((s) => s.x === p.x + dx && s.y === p.y + dy);
    if (sign) {
      if (sign.script) await SCRIPTS[sign.script](this);
      else await this.ui.say(sign.text);
    }
  }

  private async talkTo(n: Walker) {
    const d = n.def!;
    if (d.item) {
      const it = item(d.item);
      sfx('levelup');
      addItem(d.item);
      G.flags['got_' + d.id] = true;
      this.removeNpc(d.id);
      await this.ui.say(`${G.name} found a ${it.name.toUpperCase()}!`);
      return;
    }
    if (n.spr.texture.key !== 'item') this.setFacing(n, opposite(this.player.dir));
    if (d.trainer && !G.flags['tr_' + d.id]) {
      await this.trainerBattle(n, d.trainer);
      return;
    }
    if (d.trainer) {
      await this.ui.say(d.trainer.after);
      return;
    }
    if (d.script) {
      await SCRIPTS[d.script](this, n);
      return;
    }
    const lines = Array.isArray(d.talk) ? d.talk : [d.talk ?? '...'];
    await this.ui.talk(...lines);
  }

  // ---------- trainers ----------

  private async checkTrainers(): Promise<boolean> {
    const p = this.player;
    for (const n of this.npcs) {
      const tr = n.def?.trainer;
      if (!tr || !tr.sight || G.flags['tr_' + n.id]) continue;
      const [dx, dy] = DV[n.dir];
      for (let s = 1; s <= tr.sight; s++) {
        const x = n.x + dx * s;
        const y = n.y + dy * s;
        if (x === p.x && y === p.y) {
          await this.run(async () => {
            await this.spotted(n, s - 1);
            await this.trainerBattle(n, tr);
          });
          return true;
        }
        const t = this.tile(x, y);
        if (!t || t.solid || this.npcAt(x, y)) break;
      }
    }
    return false;
  }

  private async spotted(n: Walker, dist: number) {
    sfx('alert');
    const a = this.add.image(n.spr.x + 3, n.spr.y - 12, 'alert').setOrigin(0, 0).setDepth(50);
    await this.ui.wait(700);
    a.destroy();
    if (dist > 0) await this.walk(n, n.dir, dist, 230);
    this.setFacing(this.player, opposite(n.dir));
  }

  async trainerBattle(n: Walker, tr: TrainerDef) {
    await this.ui.talk(...tr.intro);
    this.ui.close();
    const team = tr.team.map(([sp, lv]) => makeDrifter(sp, lv));
    const result = await this.battle({ enemy: team, wild: false, trainer: tr, trainerLook: n.def!.look });
    if (result === 'win') {
      G.flags['tr_' + n.id] = true;
      if (tr.boss) await SCRIPTS['after_' + n.id]?.(this, n);
    }
  }

  // ---------- encounters & battles ----------

  private maybeEncounter() {
    const p = this.player;
    let enc = this.map.enc;
    const e2 = this.map.enc2;
    if (e2) {
      const [x0, y0, x1, y1] = e2.area;
      if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) enc = e2.enc;
    }
    if (!enc || !G.party.some((d) => d.hp > 0)) return;
    if (Math.random() >= enc.rate) return;
    const total = enc.table.reduce((a, r) => a + r[3], 0);
    let roll = Math.random() * total;
    let pick = enc.table[0];
    for (const r of enc.table) {
      roll -= r[3];
      if (roll <= 0) {
        pick = r;
        break;
      }
    }
    const lv = pick[1] + Math.floor(Math.random() * (pick[2] - pick[1] + 1));
    const foe = makeDrifter(pick[0] as SpeciesId, lv);
    void this.run(async () => {
      await this.battle({ enemy: [foe], wild: true });
    });
  }

  /** Hand over to the battle scene and wait for the result. */
  battle(data: Omit<BattleData, 'bg' | 'onEnd'>): Promise<BattleResult> {
    return new Promise((resolve) => {
      sfx('encounter');
      music(data.net ? 'pvp' : data.trainer?.boss ? 'boss' : data.trainer ? 'trainer' : 'battle');
      const cam = this.cameras.main;
      cam.flash(120, 255, 255, 255);
      this.time.delayedCall(160, () => cam.flash(120, 255, 255, 255));
      this.time.delayedCall(340, () => {
        cam.fadeOut(260, 0, 0, 0);
        cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.launch('Battle', {
            ...data,
            bg: this.map.bg,
            onEnd: async (r: BattleResult) => {
              this.scene.wake();
              cam.fadeIn(250, 0, 0, 0);
              music(this.map.music);
              Input.consume();
              if (r === 'lose' && !data.noBlackout) await this.blackout();
              if (!data.net) autosave();
              resolve(r);
            },
          } satisfies BattleData);
          this.scene.sleep();
        });
      });
    });
  }

  private async blackout() {
    const lost = Math.floor(G.money / 2);
    G.money -= lost;
    await this.ui.say(`${G.name} has no crew left standing!`);
    await this.ui.say(`${G.name} dropped $${lost} running away...`);
    await this.ui.say('...and blacked out!');
    this.ui.close();
    healParty();
    const r = G.respawn;
    await this.warpTo(r.map, r.x, r.y, 'up');
    if (r.map === 'home') await this.ui.say('MOM: You look like garbage, hon. Go lie down a minute. ...There. All better.');
    else await this.ui.say('SISTER AGNES: Found you face down in the gutter again. Your crew is patched up. Go with God, and go away.');
  }

  // ---------- start menu ----------

  private async startMenu() {
    sfx('select');
    const opts: string[] = [];
    if (G.flags.dex) opts.push('STREETDEX');
    if (G.party.length) opts.push('CREW');
    opts.push('BAG', G.name, 'SAVE', 'EXIT');
    let last = 0;
    for (;;) {
      const i = await this.ui.choose(opts, { y: 2, cancel: true, initial: last });
      if (i < 0) return;
      last = i;
      const o = opts[i];
      if (o === 'EXIT') {
        const c = await this.ui.ask('Go back to the title screen?', ['SAVE & QUIT', 'QUIT', 'CANCEL']);
        if (c === 2) continue;
        if (c === 0) {
          saveGame();
          sfx('save');
        }
        this.ui.close();
        this.quitToTitle = true;
        return;
      }
      if (o === 'STREETDEX') await streetDex(this, this.ui);
      else if (o === 'CREW') await this.crewMenu();
      else if (o === 'BAG') await this.bagMenu();
      else if (o === G.name) await profile(this, this.ui);
      else if (o === 'SAVE') {
        const yes = await this.ui.ask('Save your progress?');
        if (yes === 0) {
          const ok = saveGame();
          sfx('save');
          await this.ui.say(!ok ? "Couldn't save. Is storage blocked in this browser?" : net.isOnline ? `${G.name} saved the game to the server.` : `${G.name} saved the game in this browser.`);
        }
        this.ui.close();
        return;
      }
    }
  }

  private async crewMenu() {
    for (;;) {
      const i = await pickFromParty(this, this.ui, { title: 'Choose a crew member.' });
      if (i < 0) return;
      const d = G.party[i];
      const c = await this.ui.choose(['INFO', 'SWAP', 'CANCEL'], { cancel: true });
      if (c === 0) await showSummary(this, this.ui, d);
      else if (c === 1) {
        const j = await pickFromParty(this, this.ui, { title: 'Swap with who?' });
        if (j >= 0 && j !== i) [G.party[i], G.party[j]] = [G.party[j], G.party[i]];
      }
    }
  }

  private async bagMenu() {
    for (;;) {
      const id = await pickItem(this, this.ui);
      if (!id) return;
      await useItemOutside(this, id);
      this.ui.close();
    }
  }

  // ---------- skateboard ----------

  toggleSkate() {
    if (this.map.indoor) {
      this.skating = false;
      void this.run(() => this.ui.say("No skating indoors. Sister Agnes made that a rule after the incident."));
      return;
    }
    this.skating = !this.skating;
    sfx(this.skating ? 'select' : 'back');
    this.drawBoard();
  }

  /** A little board under the player's feet while skating. */
  drawBoard() {
    this.board?.destroy();
    this.board = undefined;
    if (!this.skating || !this.player) return;
    const g = this.add.graphics();
    g.fillStyle(0x202020).fillRect(1, 13, 14, 2);
    g.fillStyle(0xe8c040).fillRect(2, 12, 12, 2);
    g.fillStyle(0xd04040).fillRect(4, 12, 2, 1).fillRect(10, 12, 2, 1);
    this.board = g;
  }

  // ---------- helpers for scripts ----------

  giveDrifter(sp: SpeciesId, level: number): Drifter {
    const d = makeDrifter(sp, level);
    d.caughtWith = 'DALE';
    return d;
  }
}

function opposite(d: Dir): Dir {
  return d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
}

function setFacingIfNeeded(s: Overworld, w: Walker, d: Dir) {
  if (w.dir !== d) s.setFacing(w, d);
}

export { opposite };
