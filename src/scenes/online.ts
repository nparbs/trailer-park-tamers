// Other players in the overworld: their sprites, name tags, chat bubbles,
// and the menus for challenging or trading with them.

import Phaser from 'phaser';
import { FONT, wrap } from '../gfx/font';
import { G, loadFrom, markCaught, type Dir } from '../game/state';
import { displayName } from '../game/creature';
import { net } from '../net/client';
import { BattleInbox } from '../net/inbox';
import { autosave, saveGame } from '../net/sync';
import type { PlayerInfo, ServerMsg } from '../net/protocol';
import { sfx } from '../audio/sound';
import { chatLine } from '../ui/chat';
import { tradeScreen } from '../ui/trade';
import type { Overworld } from './Overworld';

const TS = 16;
const FRAME0: Record<Dir, number> = { down: 0, up: 3, left: 6, right: 6 };
const ASK_TTL = 25000;

interface Other {
  info: PlayerInfo;
  spr: Phaser.GameObjects.Sprite;
  tag: Phaser.GameObjects.BitmapText;
  bubble?: { g: Phaser.GameObjects.Container; until: number };
}

export class OnlineLayer {
  private others = new Map<string, Other>();
  private offs: (() => void)[] = [];
  private asks: { from: string; name: string; kind: 'battle' | 'trade'; at: number }[] = [];
  private myBubble?: { g: Phaser.GameObjects.Container; until: number };

  constructor(private ow: Overworld) {
    this.offs.push(
      net.on('players', (m) => {
        if (m.map !== G.map) return;
        this.clear();
        for (const p of m.list) this.upsert(p);
      }),
      net.on('join', (m) => this.upsert(m.p)),
      net.on('leave', (m) => this.remove(m.id)),
      net.on('moved', (m) => this.moved(m.id, m.x, m.y, m.dir)),
      net.on('pbusy', (m) => {
        const o = this.others.get(m.id);
        if (o) o.info.busy = m.busy;
      }),
      net.on('chat', (m) => this.bubble(m.id, m.text)),
      net.on('asked', (m) => {
        sfx('alert');
        this.asks.push({ from: m.from, name: m.name, kind: m.kind, at: Date.now() });
      }),
      net.on('welcome', () => this.onMapLoaded()),
    );
  }

  destroy() {
    this.offs.forEach((o) => o());
    this.clear();
  }

  /** Called whenever a map is built: everything on screen was just destroyed. */
  onMapLoaded() {
    this.others.clear();
    this.myBubble = undefined;
    const p = this.ow.player;
    if (p) net.send({ t: 'enter', map: G.map, x: p.x, y: p.y, dir: p.dir });
  }

  sendMove(x: number, y: number, dir: Dir) {
    net.send({ t: 'move', x, y, dir });
  }

  setBusy(busy: boolean) {
    net.send({ t: 'busy', busy });
  }

  private clear() {
    for (const o of this.others.values()) {
      o.spr.destroy();
      o.tag.destroy();
      o.bubble?.g.destroy();
    }
    this.others.clear();
  }

  private upsert(p: PlayerInfo) {
    if (p.id === net.id) return;
    const old = this.others.get(p.id);
    if (old) {
      old.info = p;
      old.spr.setTexture('w_out' + p.outfit, FRAME0[p.dir]);
      old.tag.setText(p.name);
      this.place(old, true);
      return;
    }
    const spr = this.ow.add.sprite(p.x * TS, p.y * TS - 3, 'w_out' + p.outfit, FRAME0[p.dir]).setOrigin(0, 0);
    spr.setFlipX(p.dir === 'right').setAlpha(0.95);
    const tag = this.ow.add.bitmapText(0, 0, FONT, p.name, 8).setOrigin(0.5, 1).setTint(0xf8f8f8).setDepth(60);
    if ((tag as any).setDropShadow) tag.setDropShadow(1, 1, 0x202028, 1);
    const o: Other = { info: p, spr, tag };
    this.others.set(p.id, o);
    this.place(o, true);
  }

  private place(o: Other, snap: boolean) {
    if (snap) o.spr.setPosition(o.info.x * TS, o.info.y * TS - 3);
    o.spr.setDepth(10 + o.spr.y / 1000);
  }

  private remove(id: string) {
    const o = this.others.get(id);
    if (!o) return;
    o.spr.destroy();
    o.tag.destroy();
    o.bubble?.g.destroy();
    this.others.delete(id);
  }

  private moved(id: string, x: number, y: number, dir: Dir) {
    const o = this.others.get(id);
    if (!o) return;
    const dx = x - o.info.x;
    const dy = y - o.info.y;
    o.info.x = x;
    o.info.y = y;
    o.info.dir = dir;
    o.spr.setFlipX(dir === 'right');
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      o.spr.setFrame(FRAME0[dir] + 1 + ((x + y) % 2));
      this.ow.tweens.killTweensOf(o.spr);
      this.ow.tweens.add({
        targets: o.spr,
        x: x * TS,
        y: y * TS - 3,
        duration: 200,
        onUpdate: () => this.place(o, false),
        onComplete: () => o.spr.setFrame(FRAME0[dir]),
      });
    } else {
      o.spr.setFrame(FRAME0[dir]);
      this.place(o, true);
    }
  }

  private bubble(id: string, text: string) {
    const isMe = id === net.id;
    const host = isMe ? this.ow.player?.spr : this.others.get(id)?.spr;
    if (!host) return;
    const lines = wrap(text, 14).slice(0, 3);
    const w = Math.max(...lines.map((l) => l.length)) * 8 + 8;
    const h = lines.length * 9 + 5;
    const g = this.ow.add.graphics();
    g.fillStyle(0x283048).fillRoundedRect(-1, -1, w + 2, h + 2, 4);
    g.fillStyle(0xf8f8f8).fillRoundedRect(0, 0, w, h, 3);
    g.fillStyle(0xf8f8f8).fillTriangle(w / 2 - 3, h, w / 2 + 3, h, w / 2, h + 4);
    const t = this.ow.add.bitmapText(4, 3, FONT, lines.join('\n'), 8).setTint(0x404048).setLineSpacing(1);
    const c = this.ow.add.container(0, 0, [g, t]).setDepth(70);
    (c as any).bw = w;
    (c as any).bh = h;
    const b = { g: c, until: this.ow.time.now + 4500 };
    if (isMe) {
      this.myBubble?.g.destroy();
      this.myBubble = b;
    } else {
      const o = this.others.get(id)!;
      o.bubble?.g.destroy();
      o.bubble = b;
    }
    this.tick();
  }

  /** Keep tags and bubbles over heads. Runs every frame. */
  tick() {
    const now = this.ow.time.now;
    const follow = (b: { g: Phaser.GameObjects.Container; until: number } | undefined, spr: Phaser.GameObjects.Sprite, lift: number) => {
      if (!b) return b;
      if (now > b.until) {
        b.g.destroy();
        return undefined;
      }
      b.g.setPosition(Math.round(spr.x + 8 - (b.g as any).bw / 2), Math.round(spr.y - (b.g as any).bh - 6 - lift));
      return b;
    };
    for (const o of this.others.values()) {
      o.tag.setPosition(Math.round(o.spr.x + 8), Math.round(o.spr.y - 1));
      o.tag.setAlpha(o.info.busy ? 0.5 : 1);
      o.bubble = follow(o.bubble, o.spr, 8);
    }
    if (this.ow.player) this.myBubble = follow(this.myBubble, this.ow.player.spr, 0);
  }

  playerAt(x: number, y: number): PlayerInfo | null {
    for (const o of this.others.values()) if (o.info.x === x && o.info.y === y) return o.info;
    return null;
  }

  /** Handle a waiting challenge or trade request. Returns true if one was started. */
  pump(): boolean {
    while (this.asks.length) {
      const a = this.asks.shift()!;
      if (Date.now() - a.at > ASK_TTL) continue;
      void this.ow.run(() => this.answer(a));
      return true;
    }
    return false;
  }

  // ---------- asking ----------

  async playerMenu(p: PlayerInfo) {
    const ui = this.ow.ui;
    if (!net.isOnline) return;
    if (p.busy) {
      await ui.say(`${p.name} is busy right now.`);
      return;
    }
    await ui.say(`It's ${p.name}.`, 1);
    const c = await ui.choose(['BATTLE', 'TRADE', 'CANCEL'], { cancel: true });
    if (c === 0) await this.askBattle(p);
    else if (c === 1) await this.askTrade(p);
  }

  private async askBattle(p: PlayerInfo) {
    const ui = this.ow.ui;
    if (!G.party.length) return void (await ui.say("You don't have a crew to fight with!"));
    const inbox = new BattleInbox();
    net.send({ t: 'ask', to: p.id, kind: 'battle', team: G.party });
    ui.show(`Waiting for ${p.name} to answer...`);
    const r = await net.waitFor(['b_start', 'declined'], 32000);
    await this.handleBattleReply(r, p.name, inbox);
  }

  private async askTrade(p: PlayerInfo) {
    const ui = this.ow.ui;
    if (!G.party.length) return void (await ui.say("You don't have anyone to trade!"));
    autosave(true);
    net.send({ t: 'ask', to: p.id, kind: 'trade' });
    ui.show(`Waiting for ${p.name} to answer...`);
    const r = await net.waitFor(['tr_start', 'declined'], 32000);
    await this.handleTradeReply(r, p.name);
  }

  private async answer(a: { from: string; name: string; kind: 'battle' | 'trade' }) {
    const ui = this.ow.ui;
    const what = a.kind === 'battle' ? 'wants to fight!' : 'wants to trade!';
    const yes = (await ui.ask(`${a.name} ${what} Are you in?`)) === 0;
    if (!yes || !G.party.length) {
      net.send({ t: 'answer', to: a.from, kind: a.kind, accept: false });
      if (yes) await ui.say("You don't have a crew yet!");
      return;
    }
    if (a.kind === 'battle') {
      const inbox = new BattleInbox();
      net.send({ t: 'answer', to: a.from, kind: 'battle', accept: true, team: G.party });
      ui.show('Getting ready...');
      const r = await net.waitFor(['b_start', 'declined'], 8000);
      await this.handleBattleReply(r, a.name, inbox);
    } else {
      autosave(true);
      net.send({ t: 'answer', to: a.from, kind: 'trade', accept: true });
      ui.show('Getting ready...');
      const r = await net.waitFor(['tr_start', 'declined'], 8000);
      await this.handleTradeReply(r, a.name);
    }
  }

  private async handleBattleReply(r: ServerMsg | null, name: string, inbox: BattleInbox) {
    const ui = this.ow.ui;
    if (!r || r.t !== 'b_start') {
      inbox.close();
      await ui.say(r?.t === 'declined' ? r.reason ?? `${name} said no.` : `${name} didn't answer.`);
      return;
    }
    ui.close();
    const result = await this.ow.battle({
      enemy: r.foe.team,
      wild: false,
      trainer: { cls: '', name: r.foe.name, team: [], sight: 0, intro: [], lose: '', after: '', reward: 0 },
      noBlackout: true,
      net: { inbox, foeName: r.foe.name, foeOutfit: r.foe.outfit, myTeam: r.you },
    });
    chatLine(result === 'win' ? `You beat ${r.foe.name}!` : `${r.foe.name} won that one.`);
  }

  private async handleTradeReply(r: ServerMsg | null, name: string) {
    const ui = this.ow.ui;
    if (!r || r.t !== 'tr_start') {
      await ui.say(r?.t === 'declined' ? r.reason ?? `${name} said no.` : `${name} didn't answer.`);
      return;
    }
    ui.close();
    const res = await tradeScreen(this.ow, this.ow.ui, r.foe.name, r.foe.team);
    if (res.done) {
      const keep = { map: G.map, x: G.x, y: G.y, facing: G.facing };
      loadFrom(res.state);
      Object.assign(G, keep);
      markCaught(res.got.sp);
      saveGame();
      sfx('caught');
      await ui.say(`${displayName(res.got).toUpperCase()} joined your crew from ${name}!`);
    } else {
      await ui.say(res.reason || 'The trade was called off.');
    }
  }
}
