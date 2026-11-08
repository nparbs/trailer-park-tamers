// Turn-based battle rules with no rendering. The battle scene feeds it actions
// and plays back the events it returns, one at a time.

import { item, type ItemId } from '../data/items';
import { move, type MoveDef, type MoveId, type Stat, type Status } from '../data/moves';
import { species } from '../data/species';
import { effectiveness, type TypeId } from '../data/types';
import { displayName, maxHp, stats, type Drifter, type Rng } from './creature';

export type Side = 'player' | 'enemy';

export type Action =
  | { kind: 'move'; slot: number }
  | { kind: 'item'; item: ItemId; target?: number }
  | { kind: 'switch'; index: number }
  | { kind: 'run' };

export type BattleEvent =
  | { t: 'msg'; text: string }
  | { t: 'attack'; side: Side; move: MoveId }
  | { t: 'hit'; side: Side; eff: number }
  | { t: 'hp'; side: Side; hp: number; max: number }
  | { t: 'status'; side: Side; status: Status | null }
  | { t: 'stat'; side: Side; up: boolean }
  | { t: 'faint'; side: Side }
  | { t: 'throw'; item: ItemId; shakes: number; caught: boolean }
  | { t: 'send'; side: Side; index: number }
  | { t: 'recall'; side: Side }
  | { t: 'exp'; index: number; amount: number }
  | { t: 'end'; result: BattleResult };

export type BattleResult = 'win' | 'lose' | 'run' | 'caught';

type Stages = Record<Stat, number>;
const freshStages = (): Stages => ({ atk: 0, def: 0, spd: 0, acc: 0 });

export interface BattleOptions {
  player: Drifter[];
  enemy: Drifter[];
  wild: boolean;
  trainerName?: string;
  rng?: Rng;
  /** Items the player is carrying, consumed by item actions. */
  bag?: Partial<Record<ItemId, number>>;
  /** Player-vs-player: both sides choose actions, nobody earns exp, and text names both owners. */
  pvp?: { player: string; enemy: string };
}

const STRUGGLE: MoveDef = { name: 'Flail', type: 'STREET', power: 50, acc: 0, pp: 1, recoil: 0.25 };

export class Battle {
  readonly player: Drifter[];
  readonly enemy: Drifter[];
  readonly wild: boolean;
  readonly trainerName: string;
  readonly rng: Rng;
  readonly bag: Partial<Record<ItemId, number>>;
  active: Record<Side, number> = { player: 0, enemy: 0 };
  stages: Record<Side, Stages> = { player: freshStages(), enemy: freshStages() };
  /** Crew members who fought the current enemy, who split its experience. */
  private participants = new Set<number>();
  private runAttempts = 0;
  over: BattleResult | null = null;
  /** Set when your active drifter fainted and you must pick a replacement. */
  needSwitch = false;
  /** PvP only: the other side's active drifter fainted and they must pick a replacement. */
  needSwitchEnemy = false;
  caught: Drifter | null = null;
  readonly pvp: { player: string; enemy: string } | null;

  constructor(o: BattleOptions) {
    this.player = o.player;
    this.enemy = o.enemy;
    this.wild = o.wild;
    this.trainerName = o.trainerName ?? '';
    this.rng = o.rng ?? Math.random;
    this.bag = o.bag ?? {};
    this.pvp = o.pvp ?? null;
    this.active.enemy = Math.max(0, this.enemy.findIndex((d) => d.hp > 0));
    this.active.player = Math.max(0, this.player.findIndex((d) => d.hp > 0));
    this.participants.add(this.active.player);
  }

  get me() {
    return this.player[this.active.player];
  }
  get foe() {
    return this.enemy[this.active.enemy];
  }
  mon(side: Side) {
    return side === 'player' ? this.me : this.foe;
  }
  label(side: Side) {
    const n = displayName(this.mon(side));
    if (this.pvp) return `${this.pvp[side]}'s ${n}`;
    if (side === 'player') return n;
    return this.wild ? `The wild ${n}` : `${this.trainerName}'s ${n}`;
  }

  /** Effective stat after stat stages. */
  stat(side: Side, s: 'atk' | 'def' | 'spd') {
    const base = stats(this.mon(side))[s];
    const st = this.stages[side][s];
    return Math.max(1, Math.floor(base * (st >= 0 ? (2 + st) / 2 : 2 / (2 - st))));
  }

  /** Play one full turn. */
  runTurn(action: Action): BattleEvent[] {
    const ev: BattleEvent[] = [];
    if (this.over || this.needSwitch) return ev;

    if (action.kind === 'run') {
      if (!this.wild) {
        ev.push({ t: 'msg', text: "No running from a street fight!" });
        return ev;
      }
      this.runAttempts++;
      const a = this.stat('player', 'spd');
      const b = Math.max(1, this.stat('enemy', 'spd'));
      const odds = ((a * 128) / b + 30 * this.runAttempts) / 256;
      if (a >= b || this.rng() < odds) {
        ev.push({ t: 'msg', text: 'Got away safely!' });
        this.finish(ev, 'run');
        return ev;
      }
      ev.push({ t: 'msg', text: "Couldn't get away!" });
      this.enemyTurnOnly(ev);
      return ev;
    }

    if (action.kind === 'item') {
      if (!this.useItem(action.item, action.target, ev)) return ev;
      if (this.over) return ev;
      this.enemyTurnOnly(ev);
      return ev;
    }

    if (action.kind === 'switch') {
      this.switchIn(action.index, ev, true);
      this.enemyTurnOnly(ev);
      return ev;
    }

    // Both sides attack, faster first.
    const mySlot = action.slot;
    const foeSlot = this.chooseEnemyMove();
    const myMove = this.moveFor('player', mySlot);
    const foeMove = this.moveFor('enemy', foeSlot);
    const myPri = myMove.priority ?? 0;
    const foePri = foeMove.priority ?? 0;
    let first: Side = 'player';
    if (foePri > myPri) first = 'enemy';
    else if (foePri === myPri) {
      const a = this.stat('player', 'spd');
      const b = this.stat('enemy', 'spd');
      if (b > a || (a === b && this.rng() < 0.5)) first = 'enemy';
    }
    const order: [Side, number][] = first === 'player' ? [['player', mySlot], ['enemy', foeSlot]] : [['enemy', foeSlot], ['player', mySlot]];
    for (const [side, slot] of order) {
      if (this.mon(side).hp <= 0 || this.mon(other(side)).hp <= 0) break;
      this.useMove(side, slot, ev);
      if (this.checkFaints(ev)) return ev;
    }
    this.endOfTurn(ev);
    return ev;
  }

  /** Called after needSwitch, with the crew member you picked. */
  forceSwitch(index: number, side: Side = 'player'): BattleEvent[] {
    const ev: BattleEvent[] = [];
    if (side === 'player') this.needSwitch = false;
    else this.needSwitchEnemy = false;
    this.switchIn(index, ev, false, side);
    return ev;
  }

  /** Is this a legal action for a side in a PvP turn? */
  validPvp(side: Side, a: Action): boolean {
    const team = side === 'player' ? this.player : this.enemy;
    if (a.kind === 'move') return Number.isInteger(a.slot) && a.slot >= -1 && a.slot < this.mon(side).moves.length;
    if (a.kind === 'switch') return Number.isInteger(a.index) && a.index !== this.active[side] && (team[a.index]?.hp ?? 0) > 0;
    return false;
  }

  /** One PvP turn: switches happen first, then moves in priority and speed order. */
  runTurnPvp(a: Action, b: Action): BattleEvent[] {
    const ev: BattleEvent[] = [];
    if (this.over || this.needSwitch || this.needSwitchEnemy) return ev;
    const acts: [Side, Action][] = [['player', a], ['enemy', b]];
    for (const [side, act] of acts) if (act.kind === 'switch') this.switchIn(act.index, ev, true, side);
    const movers = acts.filter(([, act]) => act.kind === 'move') as [Side, { kind: 'move'; slot: number }][];
    if (movers.length === 2) {
      const pri = (s: Side, slot: number) => this.moveFor(s, slot).priority ?? 0;
      const [pa, pb] = [pri('player', movers[0][1].slot), pri('enemy', movers[1][1].slot)];
      const sa = this.stat('player', 'spd');
      const sb = this.stat('enemy', 'spd');
      if (pb > pa || (pb === pa && (sb > sa || (sa === sb && this.rng() < 0.5)))) movers.reverse();
    }
    for (const [side, act] of movers) {
      if (this.mon(side).hp <= 0 || this.mon(other(side)).hp <= 0) break;
      this.useMove(side, act.slot, ev);
      if (this.checkFaints(ev)) return ev;
    }
    this.endOfTurn(ev);
    return ev;
  }

  private enemyTurnOnly(ev: BattleEvent[]) {
    if (this.over) return;
    this.useMove('enemy', this.chooseEnemyMove(), ev);
    if (this.checkFaints(ev)) return;
    this.endOfTurn(ev);
  }

  private moveFor(side: Side, slot: number): MoveDef {
    const m = this.mon(side).moves[slot];
    return m && m.pp > 0 ? move(m.id) : STRUGGLE;
  }

  chooseEnemyMove(): number {
    const foe = this.foe;
    const usable = foe.moves.map((m, i) => ({ m, i })).filter((x) => x.m.pp > 0);
    if (!usable.length) return -1;
    if (this.wild || this.rng() < 0.35) return usable[Math.floor(this.rng() * usable.length)].i;
    // Trainers mostly pick the move that hurts most, with a little variety.
    const myTypes = species(this.me.sp).types as TypeId[];
    const foeTypes = species(foe.sp).types as TypeId[];
    let best = usable[0].i;
    let bestScore = -1;
    for (const { m, i } of usable) {
      const def = move(m.id);
      let score = def.power
        ? def.power * effectiveness(def.type, myTypes) * (foeTypes.includes(def.type) ? 1.5 : 1)
        : 30 + this.rng() * 30;
      if (def.inflict && this.me.status) score = 5;
      if (def.heal && foe.hp > maxHp(foe) * 0.5) score = 0;
      score *= 0.85 + this.rng() * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  private useMove(side: Side, slot: number, ev: BattleEvent[]) {
    const user = this.mon(side);
    const target = this.mon(other(side));
    const tside = other(side);

    // Status checks before acting.
    if (user.status === 'out') {
      if (user.statusTurns > 0) {
        user.statusTurns--;
        ev.push({ t: 'msg', text: `${this.label(side)} is passed out cold.` });
        return;
      }
      user.status = null;
      ev.push({ t: 'status', side, status: null });
      ev.push({ t: 'msg', text: `${this.label(side)} came to!` });
    }
    if (user.status === 'wasted') {
      if (user.statusTurns <= 0) {
        user.status = null;
        ev.push({ t: 'status', side, status: null });
        ev.push({ t: 'msg', text: `${this.label(side)} sobered up!` });
      } else {
        user.statusTurns--;
        ev.push({ t: 'msg', text: `${this.label(side)} is totally wasted!` });
        if (this.rng() < 1 / 3) {
          const dmg = this.calcDamage(side, side, { name: '', type: 'STREET', power: 40, acc: 0, pp: 1 }, false).dmg;
          ev.push({ t: 'msg', text: 'It tripped over its own feet!' });
          this.damage(side, dmg, ev);
          return;
        }
      }
    }

    const ms = user.moves[slot];
    const def = this.moveFor(side, slot);
    if (ms && ms.pp > 0) ms.pp--;
    else ev.push({ t: 'msg', text: `${this.label(side)} has nothing left!` });
    const id = (ms && def !== STRUGGLE ? ms.id : 'SHOVE') as MoveId;
    ev.push({ t: 'msg', text: `${this.label(side)} used ${def.name.toUpperCase()}!` });
    ev.push({ t: 'attack', side, move: id });

    // Accuracy.
    const targetsFoe = def.power > 0 || def.inflict || def.stat?.who === 'foe';
    if (targetsFoe && def.acc > 0) {
      const st = this.stages[side].acc;
      const accMul = st >= 0 ? (3 + st) / 3 : 3 / (3 - st);
      if (this.rng() * 100 >= def.acc * accMul) {
        ev.push({ t: 'msg', text: `${this.label(side)}'s attack missed!` });
        return;
      }
    }

    if (def.text) ev.push({ t: 'msg', text: def.text });

    if (def.power > 0) {
      const { dmg, eff, crit } = this.calcDamage(side, tside, def, true);
      if (eff === 0) {
        ev.push({ t: 'msg', text: `It doesn't affect ${this.label(tside)}...` });
        return;
      }
      ev.push({ t: 'hit', side: tside, eff });
      const dealt = this.damage(tside, dmg, ev);
      if (crit) ev.push({ t: 'msg', text: 'A critical hit!' });
      if (eff > 1) ev.push({ t: 'msg', text: "It's super effective!" });
      else if (eff < 1) ev.push({ t: 'msg', text: "It's not very effective..." });
      if (def.drain && dealt > 0 && user.hp > 0) {
        this.heal(side, Math.max(1, Math.floor(dealt * def.drain)), ev);
        ev.push({ t: 'msg', text: `${this.label(side)} mooched some health!` });
      }
      if (def.recoil && dealt > 0) {
        ev.push({ t: 'msg', text: `${this.label(side)} is hurt by recoil!` });
        this.damage(side, Math.max(1, Math.floor(dealt * def.recoil)), ev);
      }
    }

    if (def.heal) {
      const m = maxHp(user);
      if (user.hp >= m) ev.push({ t: 'msg', text: `${this.label(side)} is already fine!` });
      else {
        this.heal(side, Math.floor(m * def.heal), ev);
        ev.push({ t: 'msg', text: `${this.label(side)} feels better!` });
      }
    }

    if (def.inflict && target.hp > 0) {
      if (this.rng() * 100 < def.inflict.chance) this.inflict(tside, def.inflict.status, ev, def.power === 0);
    }

    if (def.stat && (def.stat.who === 'self' ? user : target).hp > 0) {
      if (def.stat.chance === undefined || this.rng() * 100 < def.stat.chance) {
        this.changeStage(def.stat.who === 'self' ? side : tside, def.stat.stat, def.stat.stages, ev);
      }
    }
  }

  calcDamage(side: Side, tside: Side, def: MoveDef, canCrit: boolean) {
    const user = this.mon(side);
    const target = this.mon(tside);
    const L = user.level;
    const atk = this.stat(side, 'atk');
    const dfn = this.stat(tside, 'def');
    let dmg = Math.floor((Math.floor((2 * L) / 5 + 2) * def.power * atk) / dfn / 50) + 2;
    const userTypes = species(user.sp).types as TypeId[];
    if (userTypes.includes(def.type)) dmg = Math.floor(dmg * 1.5);
    const eff = effectiveness(def.type, species(target.sp).types as TypeId[]);
    dmg = Math.floor(dmg * eff);
    const crit = canCrit && this.rng() < (def.highCrit ? 1 / 8 : 1 / 16);
    if (crit) dmg = Math.floor(dmg * 1.5);
    dmg = Math.floor((dmg * (85 + Math.floor(this.rng() * 16))) / 100);
    return { dmg: eff === 0 ? 0 : Math.max(1, dmg), eff, crit };
  }

  private damage(side: Side, amount: number, ev: BattleEvent[]) {
    const d = this.mon(side);
    const dealt = Math.min(d.hp, amount);
    d.hp -= dealt;
    ev.push({ t: 'hp', side, hp: d.hp, max: maxHp(d) });
    return dealt;
  }

  private heal(side: Side, amount: number, ev: BattleEvent[]) {
    const d = this.mon(side);
    d.hp = Math.min(maxHp(d), d.hp + amount);
    ev.push({ t: 'hp', side, hp: d.hp, max: maxHp(d) });
  }

  private inflict(side: Side, status: Status, ev: BattleEvent[], announceFail: boolean) {
    const d = this.mon(side);
    if (d.status) {
      if (announceFail) ev.push({ t: 'msg', text: 'But it failed!' });
      return;
    }
    d.status = status;
    d.statusTurns = status === 'out' ? 1 + Math.floor(this.rng() * 3) : status === 'wasted' ? 2 + Math.floor(this.rng() * 3) : 0;
    ev.push({ t: 'status', side, status });
    const text = { out: 'passed out!', sick: 'feels sick!', wasted: 'got wasted!' }[status];
    ev.push({ t: 'msg', text: `${this.label(side)} ${text}` });
  }

  private changeStage(side: Side, stat: Stat, n: number, ev: BattleEvent[]) {
    const cur = this.stages[side][stat];
    const next = Math.max(-6, Math.min(6, cur + n));
    const name = { atk: 'ATTACK', def: 'DEFENSE', spd: 'SPEED', acc: 'ACCURACY' }[stat];
    if (next === cur) {
      ev.push({ t: 'msg', text: `${this.label(side)}'s ${name} won't go ${n > 0 ? 'higher' : 'lower'}!` });
      return;
    }
    this.stages[side][stat] = next;
    ev.push({ t: 'stat', side, up: n > 0 });
    const how = Math.abs(n) >= 2 ? (n > 0 ? 'rose sharply!' : 'harshly fell!') : n > 0 ? 'rose!' : 'fell!';
    ev.push({ t: 'msg', text: `${this.label(side)}'s ${name} ${how}` });
  }

  private endOfTurn(ev: BattleEvent[]) {
    for (const side of ['player', 'enemy'] as Side[]) {
      const d = this.mon(side);
      if (d.hp > 0 && d.status === 'sick') {
        ev.push({ t: 'msg', text: `${this.label(side)} is sick to its stomach!` });
        this.damage(side, Math.max(1, Math.floor(maxHp(d) / 8)), ev);
        if (this.checkFaints(ev)) return;
      }
    }
  }

  /** Handle anyone at 0 HP. Returns true if the turn should stop. */
  private checkFaints(ev: BattleEvent[]): boolean {
    let stop = false;
    if (this.foe.hp <= 0) {
      stop = true;
      ev.push({ t: 'faint', side: 'enemy' });
      ev.push({ t: 'msg', text: `${this.label('enemy')} got knocked out!` });
      if (this.pvp) {
        if (this.enemy.some((d) => d.hp > 0)) this.needSwitchEnemy = true;
        else {
          ev.push({ t: 'msg', text: `${this.pvp.enemy} has no crew left standing!` });
          this.finish(ev, 'win');
          return true;
        }
      }
      if (!this.pvp) this.awardExp(ev);
      const next = this.pvp ? -2 : this.enemy.findIndex((d) => d.hp > 0);
      if (next === -2) {
        // PvP: the other player picks their replacement.
      } else if (next < 0) {
        if (!this.wild) ev.push({ t: 'msg', text: `You beat ${this.trainerName}!` });
        this.finish(ev, 'win');
        return true;
      } else {
        this.active.enemy = next;
        this.stages.enemy = freshStages();
        this.participants = new Set([this.active.player]);
        ev.push({ t: 'msg', text: `${this.trainerName} sent out ${displayName(this.foe)}!` });
        ev.push({ t: 'send', side: 'enemy', index: next });
      }
    }
    if (this.me.hp <= 0) {
      stop = true;
      ev.push({ t: 'faint', side: 'player' });
      ev.push({ t: 'msg', text: `${this.pvp ? this.label('player') : displayName(this.me)} got knocked out!` });
      this.participants.delete(this.active.player);
      if (this.player.some((d) => d.hp > 0)) this.needSwitch = true;
      else {
        ev.push({ t: 'msg', text: this.pvp ? `${this.pvp.player} has no crew left standing!` : 'Your whole crew is down!' });
        this.needSwitchEnemy = false;
        if (!this.over) this.finish(ev, 'lose');
      }
    }
    return stop;
  }

  private awardExp(ev: BattleEvent[]) {
    const f = this.foe;
    const total = Math.floor((species(f.sp).baseExp * f.level) / 7) * (this.wild ? 1 : 1.5);
    const alive = [...this.participants].filter((i) => this.player[i]?.hp > 0);
    if (!alive.length) return;
    const each = Math.max(1, Math.floor(total / alive.length));
    for (const i of alive) ev.push({ t: 'exp', index: i, amount: each });
  }

  private switchIn(index: number, ev: BattleEvent[], voluntary: boolean, side: Side = 'player') {
    const owner = this.pvp?.[side];
    if (voluntary) {
      const name = displayName(this.mon(side));
      ev.push({ t: 'msg', text: owner ? `${owner} called back ${name}!` : `Get back here, ${name}!` });
      ev.push({ t: 'recall', side });
    }
    this.active[side] = index;
    this.stages[side] = freshStages();
    if (side === 'player') this.participants.add(index);
    const name = displayName(this.mon(side));
    ev.push({ t: 'msg', text: owner ? `${owner} sent out ${name}!` : `Go! ${name}!` });
    ev.push({ t: 'send', side, index });
  }

  private useItem(id: ItemId, target: number | undefined, ev: BattleEvent[]): boolean {
    const def = item(id);
    if (!this.bag[id]) return false;
    if (def.kind === 'catch') {
      if (!this.wild) {
        ev.push({ t: 'msg', text: `Hey! ${this.trainerName} is watching! That's somebody else's guy!` });
        return false;
      }
      this.bag[id]!--;
      ev.push({ t: 'msg', text: `You threw the ${def.name.toUpperCase()}!` });
      const { shakes, caught } = this.catchRoll(def.catchBonus ?? 1);
      ev.push({ t: 'throw', item: id, shakes, caught });
      if (caught) {
        ev.push({ t: 'msg', text: `Gotcha! ${displayName(this.foe)} got bagged!` });
        this.caught = this.foe;
        this.finish(ev, 'caught');
      } else {
        ev.push({ t: 'msg', text: ['Dang! They wriggled right out!', 'Argh! Almost had them!', 'Shoot! So close!', 'No way! They broke free!'][shakes] });
      }
      return true;
    }
    const d = this.player[target ?? this.active.player];
    if (!d) return false;
    const onField = (target ?? this.active.player) === this.active.player;
    this.bag[id]!--;
    ev.push({ t: 'msg', text: `You used a ${def.name.toUpperCase()}.` });
    if (def.revive) {
      d.hp = Math.max(1, Math.floor(maxHp(d) * def.revive));
      d.status = null;
      ev.push({ t: 'msg', text: `${displayName(d)} jolted back to life!` });
    }
    if (def.heal) {
      const before = d.hp;
      d.hp = Math.min(maxHp(d), d.hp + def.heal);
      if (onField) ev.push({ t: 'hp', side: 'player', hp: d.hp, max: maxHp(d) });
      ev.push({ t: 'msg', text: `${displayName(d)} got ${d.hp - before} HP back.` });
    }
    if (def.cures && d.status) {
      d.status = null;
      if (onField) ev.push({ t: 'status', side: 'player', status: null });
      ev.push({ t: 'msg', text: `${displayName(d)} snapped out of it!` });
    }
    return true;
  }

  /** Third-gen style catch check: up to three shakes, then the catch. */
  catchRoll(bonus: number) {
    const f = this.foe;
    const m = maxHp(f);
    const statusMul = f.status === 'out' ? 2 : f.status ? 1.5 : 1;
    const a = (((3 * m - 2 * f.hp) * species(f.sp).catchRate * bonus) / (3 * m)) * statusMul;
    if (a >= 255) return { shakes: 3, caught: true };
    const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a)));
    let shakes = 0;
    while (shakes < 4 && this.rng() * 65536 < b) shakes++;
    return shakes >= 4 ? { shakes: 3, caught: true } : { shakes, caught: false };
  }

  private finish(ev: BattleEvent[], result: BattleResult) {
    this.over = result;
    ev.push({ t: 'end', result });
  }
}

function other(s: Side): Side {
  return s === 'player' ? 'enemy' : 'player';
}
