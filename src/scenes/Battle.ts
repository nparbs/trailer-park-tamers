import Phaser from 'phaser';
import { item } from '../data/items';
import type { TrainerDef } from '../data/maps';
import { move, STATUS_NAME, type MoveId, type Status } from '../data/moves';
import { species } from '../data/species';
import { Battle, type Action, type BattleEvent, type BattleResult, type Side } from '../game/battle';
import { addExp, canEvolve, displayName, evolve, expForLevel, learnMove, maxHp, replaceMove, type Drifter } from '../game/creature';
import { Input } from '../game/input';
import { G, markSeen, recruit } from '../game/state';
import { music, sfx } from '../audio/sound';
import { FONT } from '../gfx/font';
import { darken } from '../gfx/pixels';
import { TYPE_INFO } from '../data/types';
import { UI, label, panel } from '../ui/ui';
import { drawHpBar, pickFromParty, pickItem, showSummary } from '../ui/screens';

export interface BattleData {
  enemy: Drifter[];
  wild: boolean;
  trainer?: TrainerDef;
  trainerLook?: string;
  noBlackout?: boolean;
  bg: 'park' | 'street' | 'indoor';
  onEnd: (r: BattleResult) => void;
}

const EX = 176; // enemy sprite centre x
const EY = 72; // enemy sprite feet y
const PX = 62;
const PY = 128;

interface InfoBox {
  objs: Phaser.GameObjects.GameObject[];
  name: Phaser.GameObjects.BitmapText;
  lv: Phaser.GameObjects.BitmapText;
  status: Phaser.GameObjects.BitmapText;
  hpText?: Phaser.GameObjects.BitmapText;
  bar: Phaser.GameObjects.Graphics;
  exp?: Phaser.GameObjects.Graphics;
  shownHp: number;
  max: number;
}

export class BattleScene extends Phaser.Scene {
  private ui!: UI;
  private data_!: BattleData;
  private b!: Battle;
  private enemySpr!: Phaser.GameObjects.Image;
  private playerSpr!: Phaser.GameObjects.Image;
  private boxes!: Record<Side, InfoBox>;
  private lastAction = 0;
  private lastMove = 0;
  private leveled = new Set<number>();
  private lastThrow = 'SACK';

  constructor() {
    super('Battle');
  }

  init(d: BattleData) {
    this.data_ = d;
    this.leveled = new Set();
    this.lastAction = 0;
    this.lastMove = 0;
  }

  create() {
    const d = this.data_;
    this.ui = new UI(this);
    this.cameras.main.setBackgroundColor(0x000000);
    this.add.image(0, 0, 'bg_' + d.bg).setOrigin(0, 0);
    this.b = new Battle({ player: G.party, enemy: d.enemy, wild: d.wild, trainerName: d.trainer?.name, bag: G.bag });
    this.enemySpr = this.add.image(EX, EY, 'pf_' + d.enemy[0].sp).setOrigin(0.5, 1).setDepth(5);
    this.playerSpr = this.add.image(PX, PY, 'tb_player').setOrigin(0.5, 1).setDepth(6);
    this.boxes = { enemy: this.makeBox('enemy'), player: this.makeBox('player') };
    this.setBoxVisible('enemy', false);
    this.setBoxVisible('player', false);
    this.ui.show('');
    this.cameras.main.fadeIn(200, 0, 0, 0);
    void this.main();
  }

  update() {
    this.ui.update();
  }

  // ---------- info boxes ----------

  private makeBox(side: Side): InfoBox {
    const enemy = side === 'enemy';
    const { x, y } = this.boxPos(side);
    const w = 112;
    const h = enemy ? 30 : 40;
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x404040).fillRoundedRect(x, y, w, h, 5);
    g.fillStyle(0xf8f8d8).fillRoundedRect(x + 1, y + 1, w - 2, h - 2, 4);
    g.fillStyle(0xd8d8b0).fillRect(x + 4, y + h - 4, w - 8, 1);
    const name = this.add.bitmapText(x + 7, y + 5, FONT, '', 8).setTint(0x404048).setDepth(21);
    const lv = this.add.bitmapText(x + 7, y + 16, FONT, '', 8).setTint(0x404048).setDepth(21);
    const status = this.add.bitmapText(enemy ? x + w - 38 : x + 7, enemy ? y + 5 : y + 26, FONT, '', 8).setTint(0xc04040).setDepth(21);
    const bar = this.add.graphics().setDepth(21);
    const box: InfoBox = { objs: [g, name, lv, status, bar], name, lv, status, bar, shownHp: 0, max: 1 };
    if (!enemy) {
      box.hpText = this.add.bitmapText(x + w - 62, y + 26, FONT, '', 8).setTint(0x404048).setDepth(21);
      box.exp = this.add.graphics().setDepth(21);
      box.objs.push(box.hpText, box.exp);
    }
    return box;
  }

  private boxPos(side: Side) {
    return side === 'enemy' ? { x: 6, y: 8 } : { x: 124, y: 70 };
  }

  private setBoxVisible(side: Side, v: boolean) {
    for (const o of this.boxes[side].objs) (o as any).setVisible(v);
  }

  private refreshBox(side: Side, d: Drifter, hp = d.hp) {
    const box = this.boxes[side];
    box.name.setText(displayName(d).toUpperCase().slice(0, side === 'enemy' && d.status ? 8 : 12));
    box.lv.setText('Lv' + d.level);
    box.max = maxHp(d);
    box.shownHp = hp;
    this.drawBar(side);
    this.setStatus(side, d.status);
    if (side === 'player') this.drawExp(d);
  }

  private drawBar(side: Side) {
    const box = this.boxes[side];
    const { x, y } = this.boxPos(side);
    box.bar.clear();
    const frac = Math.max(0, box.shownHp / box.max);
    drawHpBar(box.bar, x + 40, y + 17, 50, frac);
    box.hpText?.setText(`${String(Math.round(box.shownHp)).padStart(3)}/${String(box.max).padStart(3)}`);
  }

  private drawExp(d: Drifter) {
    const box = this.boxes.player;
    if (!box.exp) return;
    const { x, y } = this.boxPos('player');
    const lo = expForLevel(d.level);
    const hi = expForLevel(d.level + 1);
    const frac = Math.max(0, Math.min(1, (d.exp - lo) / (hi - lo)));
    box.exp.clear();
    box.exp.fillStyle(0x404040).fillRect(x + 30, y + 35, 76, 3);
    box.exp.fillStyle(0x48a8f8).fillRect(x + 31, y + 36, Math.round(74 * frac), 1);
  }

  private setStatus(side: Side, s: Status | null) {
    const box = this.boxes[side];
    box.status.setText(s ? STATUS_NAME[s] : '');
    if (side === 'enemy') box.name.setText(displayName(this.b.foe).toUpperCase().slice(0, s ? 8 : 12));
  }

  private tweenHp(side: Side, to: number, max: number) {
    const box = this.boxes[side];
    box.max = max;
    const from = box.shownHp;
    if (from === to) return Promise.resolve();
    const dur = Math.min(900, 200 + Math.abs(from - to) * 25);
    return new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from,
        to,
        duration: dur,
        onUpdate: (tw) => {
          box.shownHp = tw.getValue() ?? to;
          this.drawBar(side);
        },
        onComplete: () => {
          box.shownHp = to;
          this.drawBar(side);
          resolve();
        },
      });
    });
  }

  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((resolve) => this.tweens.add({ ...cfg, onComplete: () => resolve() }));
  }

  private say(text: string, auto = 1100) {
    return this.ui.say(text, auto);
  }

  // ---------- flow ----------

  private async main() {
    const d = this.data_;
    const b = this.b;
    const foe = b.foe;
    markSeen(foe.sp);

    // Intro.
    if (d.wild) {
      this.enemySpr.setX(-40);
      this.playerSpr.setX(300);
      await Promise.all([
        this.tween({ targets: this.enemySpr, x: EX, duration: 700, ease: 'Quad.out' }),
        this.tween({ targets: this.playerSpr, x: PX, duration: 700, ease: 'Quad.out' }),
      ]);
      this.refreshBox('enemy', foe);
      this.setBoxVisible('enemy', true);
      await this.say(`A wild ${displayName(foe).toUpperCase()} jumped out!`);
    } else {
      const tr = d.trainer!;
      this.enemySpr.setTexture('tf_' + (d.trainerLook ?? 'thug')).setX(-40);
      this.playerSpr.setX(300);
      await Promise.all([
        this.tween({ targets: this.enemySpr, x: EX, duration: 700, ease: 'Quad.out' }),
        this.tween({ targets: this.playerSpr, x: PX, duration: 700, ease: 'Quad.out' }),
      ]);
      await this.say(`${tr.cls} ${tr.name} wants to fight!`);
      await this.tween({ targets: this.enemySpr, x: 300, duration: 400, ease: 'Quad.in' });
      await this.say(`${tr.name} sent out ${displayName(foe).toUpperCase()}!`);
      await this.sendOut('enemy', foe);
    }
    await this.tween({ targets: this.playerSpr, x: -60, duration: 400, ease: 'Quad.in' });
    await this.say(`Go! ${displayName(b.me).toUpperCase()}!`);
    await this.sendOut('player', b.me);

    // Turns.
    while (!b.over) {
      if (b.needSwitch) {
        const idx = await this.pickReplacement();
        await this.play(b.forceSwitch(idx));
        continue;
      }
      const action = await this.chooseAction();
      this.ui.show('');
      await this.play(b.runTurn(action));
    }
    await this.finish(b.over);
  }

  private async sendOut(side: Side, d: Drifter) {
    const spr = side === 'enemy' ? this.enemySpr : this.playerSpr;
    spr.setTexture((side === 'enemy' ? 'pf_' : 'pb_') + d.sp);
    spr.setPosition(side === 'enemy' ? EX : PX, side === 'enemy' ? EY : PY).setAlpha(1).setScale(0).setTintFill(0xffffff);
    sfx('throw');
    await this.tween({ targets: spr, scale: 1, duration: 260, ease: 'Back.out' });
    spr.clearTint();
    this.refreshBox(side, d);
    this.setBoxVisible(side, true);
  }

  private async chooseAction(): Promise<Action> {
    const b = this.b;
    for (;;) {
      this.ui.show(`What now,
${displayName(b.me).toUpperCase()}?`, 16);
      const c = await this.ui.choose(['FIGHT', 'BAG', 'CREW', 'RUN'], { x: 134, y: 112, w: 106, cols: 2, colW: 44, initial: this.lastAction });
      this.lastAction = Math.max(0, c);
      if (c === 0) {
        const m = await this.chooseMove();
        if (m >= 0) return { kind: 'move', slot: m };
      } else if (c === 1) {
        const a = await this.chooseItem();
        if (a) return a;
      } else if (c === 2) {
        const a = await this.chooseCrew();
        if (a) return a;
      } else if (c === 3) {
        return { kind: 'run' };
      }
    }
  }

  private async chooseMove(): Promise<number> {
    const me = this.b.me;
    if (me.moves.every((m) => m.pp <= 0)) {
      await this.say(`${displayName(me).toUpperCase()} is out of moves!`);
      return 0;
    }
    this.ui.show('');
    const info = panel(this, 150, 98, 90, 62);
    const pp = label(this, 160, 108, '');
    const ty = label(this, 160, 128, '');
    const tyName = label(this, 160, 140, '');
    const names = me.moves.map((m) => move(m.id).name.toUpperCase());
    for (;;) {
      const i = await this.ui.choose(names, {
        x: 0, y: 98, w: 150, rowH: 12, cancel: true, initial: Math.min(this.lastMove, names.length - 1),
        onMove: (k) => {
          const m = me.moves[k];
          const def = move(m.id);
          pp.setText(`PP ${String(m.pp).padStart(2)}/${def.pp}`);
          ty.setText('TYPE/');
          tyName.setText(TYPE_INFO[def.type].name).setTint(darken(TYPE_INFO[def.type].color, 0.75));
        },
      });
      if (i < 0) break;
      if (me.moves[i].pp <= 0) {
        await this.say("There's no PP left for that move!");
        continue;
      }
      this.lastMove = i;
      info.destroy(); pp.destroy(); ty.destroy(); tyName.destroy();
      return i;
    }
    info.destroy(); pp.destroy(); ty.destroy(); tyName.destroy();
    return -1;
  }

  private async chooseItem(): Promise<Action | null> {
    const id = await pickItem(this, this.ui);
    if (!id) return null;
    const def = item(id);
    if (def.kind === 'catch') {
      if (G.party.length >= 6 && G.storage.length >= 60) {
        await this.say('Your storage unit is packed to the ceiling!');
        return null;
      }
      return { kind: 'item', item: id };
    }
    const t = await pickFromParty(this, this.ui, { title: `Use ${def.name.toUpperCase()} on who?` });
    if (t < 0) return null;
    const d = G.party[t];
    if (def.kind === 'revive' ? d.hp > 0 : d.hp <= 0 || (def.kind === 'heal' && d.hp >= maxHp(d)) || (def.kind === 'cure' && !d.status)) {
      await this.say("It won't have any effect.");
      return null;
    }
    return { kind: 'item', item: id, target: t };
  }

  private async chooseCrew(): Promise<Action | null> {
    for (;;) {
      const i = await pickFromParty(this, this.ui, { title: 'Choose a crew member.' });
      if (i < 0) return null;
      const c = await this.ui.choose(['SHIFT', 'INFO', 'CANCEL'], { cancel: true });
      if (c === 1) {
        await showSummary(this, this.ui, G.party[i]);
        continue;
      }
      if (c !== 0) continue;
      if (i === this.b.active.player) {
        await this.say(`${displayName(G.party[i]).toUpperCase()} is already out there!`);
        continue;
      }
      if (G.party[i].hp <= 0) {
        await this.say(`${displayName(G.party[i]).toUpperCase()} is knocked out cold!`);
        continue;
      }
      return { kind: 'switch', index: i };
    }
  }

  private async pickReplacement(): Promise<number> {
    for (;;) {
      const i = await pickFromParty(this, this.ui, { title: 'Send out who?', cancel: false, disabled: (d) => d.hp <= 0 });
      if (i >= 0 && G.party[i].hp > 0) return i;
      sfx('bump');
    }
  }

  // ---------- event playback ----------

  private async play(events: BattleEvent[]) {
    for (const e of events) {
      switch (e.t) {
        case 'msg':
          await this.say(e.text);
          break;
        case 'attack':
          await this.animAttack(e.side, e.move);
          break;
        case 'hit':
          await this.animHit(e.side, e.eff);
          break;
        case 'hp':
          await this.tweenHp(e.side, e.hp, e.max);
          break;
        case 'status':
          this.setStatus(e.side, e.status);
          break;
        case 'stat': {
          sfx(e.up ? 'statup' : 'statdown');
          const spr = e.side === 'enemy' ? this.enemySpr : this.playerSpr;
          spr.setTint(e.up ? 0x88aaff : 0xff8888);
          await this.ui.wait(350);
          spr.clearTint();
          break;
        }
        case 'faint': {
          sfx('faint');
          const spr = e.side === 'enemy' ? this.enemySpr : this.playerSpr;
          await this.tween({ targets: spr, y: spr.y + 50, alpha: 0, duration: 420, ease: 'Quad.in' });
          this.setBoxVisible(e.side, false);
          break;
        }
        case 'throw':
          this.lastThrow = item(e.item).name.toUpperCase();
          await this.animThrow(e.shakes, e.caught);
          break;
        case 'send': {
          const d = e.side === 'enemy' ? this.b.enemy[e.index] : this.b.player[e.index];
          if (e.side === 'enemy') markSeen(d.sp);
          await this.sendOut(e.side, d);
          break;
        }
        case 'recall':
          await this.tween({ targets: this.playerSpr, scale: 0, duration: 220 });
          this.setBoxVisible('player', false);
          break;
        case 'exp':
          await this.giveExp(e.index, e.amount);
          break;
        case 'end':
          break;
      }
    }
  }

  private async animAttack(side: Side, id: MoveId) {
    const spr = side === 'enemy' ? this.enemySpr : this.playerSpr;
    const def = move(id);
    const x0 = spr.x;
    if (def.power > 0) {
      await this.tween({ targets: spr, x: x0 + (side === 'enemy' ? -14 : 14), duration: 90, yoyo: true, ease: 'Quad.out' });
      spr.setX(x0);
    } else {
      await this.tween({ targets: spr, y: spr.y - 6, duration: 100, yoyo: true, repeat: 1 });
    }
  }

  private async animHit(side: Side, eff: number) {
    const spr = side === 'enemy' ? this.enemySpr : this.playerSpr;
    sfx(eff > 1 ? 'superhit' : eff < 1 ? 'weakhit' : 'hit');
    if (eff > 1) this.cameras.main.shake(220, 0.012);
    for (let i = 0; i < 3; i++) {
      spr.setVisible(false);
      await this.ui.wait(60);
      spr.setVisible(true);
      await this.ui.wait(60);
    }
  }

  private async animThrow(shakes: number, caught: boolean) {
    const sack = this.add.image(30, 120, 'sack').setDepth(30);
    sfx('throw');
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 520,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 1;
          sack.setPosition(30 + (EX - 30) * t, 120 + (EY - 40 - 120) * t - Math.sin(t * Math.PI) * 50);
          sack.setAngle(t * 540);
        },
        onComplete: () => resolve(),
      });
    });
    sack.setAngle(0);
    this.enemySpr.setTintFill(0xffffff);
    await this.tween({ targets: this.enemySpr, scale: 0, duration: 260 });
    await this.tween({ targets: sack, y: EY - 8, duration: 280, ease: 'Bounce.out' });
    for (let i = 0; i < shakes; i++) {
      await this.ui.wait(380);
      sfx('shake');
      await this.tween({ targets: sack, angle: -22, duration: 90, yoyo: true });
      await this.tween({ targets: sack, angle: 22, duration: 90, yoyo: true });
    }
    await this.ui.wait(380);
    if (caught) {
      sfx('caught');
      sack.setTint(0xa0a0a0);
      await this.ui.wait(600);
    } else {
      sack.destroy();
      this.enemySpr.setScale(1).clearTint();
      sfx('back');
    }
  }

  private async giveExp(index: number, amount: number) {
    const d = this.b.player[index];
    if (!d || d.hp <= 0) return;
    await this.say(`${displayName(d).toUpperCase()} gained ${amount} EXP. Points!`);
    const active = index === this.b.active.player;
    const ups = addExp(d, amount);
    if (active) {
      sfx('exp');
      this.drawExp(d);
    }
    for (const up of ups) {
      this.leveled.add(index);
      sfx('levelup');
      if (active) this.refreshBox('player', d);
      await this.say(`${displayName(d).toUpperCase()} grew to Lv. ${up.level}!`, 0);
      for (const m of up.newMoves) await this.learn(d, m);
    }
  }

  private async learn(d: Drifter, m: MoveId) {
    const name = displayName(d).toUpperCase();
    const mv = move(m).name.toUpperCase();
    if (learnMove(d, m)) {
      sfx('levelup');
      await this.say(`${name} learned ${mv}!`, 0);
      return;
    }
    await this.say(`${name} wants to learn ${mv}, but already knows four moves.`, 0);
    for (;;) {
      const yes = await this.ui.ask(`Forget a move to make room for ${mv}?`);
      if (yes !== 0) {
        await this.say(`${name} did not learn ${mv}.`, 0);
        return;
      }
      const names = d.moves.map((x) => move(x.id).name.toUpperCase());
      this.ui.show('Which move should be forgotten?');
      const k = await this.ui.choose(names, { x: 0, y: 98, w: 150, rowH: 12, cancel: true });
      if (k < 0) continue;
      const old = names[k];
      replaceMove(d, k, m);
      await this.say(`1, 2, and... Poof! ${name} forgot ${old} and learned ${mv}!`, 0);
      return;
    }
  }

  // ---------- ending ----------

  private async finish(result: BattleResult) {
    const d = this.data_;
    if (result === 'win' && d.trainer) {
      const tr = d.trainer;
      this.enemySpr.setTexture('tf_' + (d.trainerLook ?? 'thug')).setAlpha(1).setScale(1).setPosition(300, EY);
      await this.tween({ targets: this.enemySpr, x: EX, duration: 500, ease: 'Quad.out' });
      await this.say(`${tr.name}: ${tr.lose}`, 0);
      const money = tr.reward;
      G.money += money;
      await this.say(`${G.name} got $${money} for winning!`, 0);
      music('victory');
    } else if (result === 'win') {
      music('victory');
    }
    if (result === 'caught' && this.b.caught) {
      const c = this.b.caught;
      c.status = c.status === 'out' ? null : c.status;
      c.caughtWith = this.lastThrow;
      const where = recruit(c);
      if (where === 'storage') await this.say(`Your crew is full, so ${displayName(c).toUpperCase()} was dropped off at your STORAGE UNIT.`, 0);
      else await this.say(`${displayName(c).toUpperCase()} joined your crew!`, 0);
      music('victory');
    }
    if (result === 'lose' && d.noBlackout) {
      await this.say(`${G.name} lost to ${d.trainer?.name ?? 'them'}...`, 0);
    }
    if (result === 'win' || result === 'caught') await this.evolutions();

    // Stat stages and the field don't carry over; statuses do.
    this.ui.close();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    await new Promise<void>((r) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => r()));
    const cb = this.data_.onEnd;
    this.scene.stop();
    cb(result);
  }

  private async evolutions() {
    for (const i of this.leveled) {
      const d = G.party[i];
      if (!d || d.hp <= 0) continue;
      const into = canEvolve(d);
      if (!into) continue;
      const before = displayName(d).toUpperCase();
      this.setBoxVisible('player', false);
      this.setBoxVisible('enemy', false);
      this.enemySpr.setVisible(false);
      this.playerSpr.setVisible(false);
      const g = this.add.graphics().setDepth(40);
      g.fillStyle(0x182030).fillRect(0, 0, 240, 112);
      const img = this.add.image(120, 90, 'pf_' + d.sp).setOrigin(0.5, 1).setDepth(41);
      await this.say(`What? ${before} is changing!`, 0);
      music(null);
      let cancelled = false;
      for (let k = 0; k < 14 && !cancelled; k++) {
        img.setTexture('pf_' + (k % 2 ? into : d.sp)).setTintFill(0xffffff);
        sfx('blip');
        await this.ui.wait(Math.max(60, 260 - k * 15));
        if (Input.held('b')) cancelled = true;
      }
      if (cancelled) {
        img.setTexture('pf_' + d.sp).clearTint();
        await this.say(`Huh? ${before} stopped changing.`, 0);
      } else {
        evolve(d, into);
        img.setTexture('pf_' + into).clearTint();
        this.cameras.main.flash(300, 255, 255, 255);
        sfx('caught');
        await this.say(`${before} turned into ${species(into).name.toUpperCase()}!`, 0);
        for (const [lv, m] of species(into).learnset) if (lv === d.level) await this.learn(d, m);
      }
      g.destroy();
      img.destroy();
    }
  }
}
