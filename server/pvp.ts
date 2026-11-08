// A fight between two players. The server runs the same battle rules as the
// single-player game and sends each side the events from its own point of view.

import { Battle, type Action, type BattleEvent, type BattleResult, type Side } from '../src/game/battle';
import type { Drifter } from '../src/game/creature';
import type { SideSnap } from '../src/net/protocol';
import type { Client } from './world';

const TURN_MS = 90_000;

export class PvpRoom {
  private battle: Battle;
  private pending: Partial<Record<Side, Action>> = {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  private done = false;
  /** Decisions accepted from each side so far. */
  private decided: Record<Side, number> = { player: 0, enemy: 0 };

  constructor(private a: Client, aTeam: Drifter[], private b: Client, bTeam: Drifter[], private onEnd: () => void) {
    a.pvp = this;
    b.pvp = this;
    this.battle = new Battle({ player: aTeam, enemy: bTeam, wild: false, pvp: { player: a.name, enemy: b.name } });
    a.send({ t: 'b_start', foe: { name: b.name, outfit: b.outfit, team: bTeam }, you: aTeam });
    b.send({ t: 'b_start', foe: { name: a.name, outfit: a.outfit, team: aTeam }, you: bTeam });
    this.broadcast([]);
  }

  private sideOf(c: Client): Side {
    return c === this.a ? 'player' : 'enemy';
  }

  private needOf(side: Side): 'action' | 'switch' | 'wait' | 'over' {
    const bt = this.battle;
    if (bt.over) return 'over';
    const mine = side === 'player' ? bt.needSwitch : bt.needSwitchEnemy;
    const theirs = side === 'player' ? bt.needSwitchEnemy : bt.needSwitch;
    if (mine) return 'switch';
    if (theirs) return 'wait';
    return this.pending[side] ? 'wait' : 'action';
  }

  private snap(side: Side): SideSnap {
    const team = side === 'player' ? this.battle.player : this.battle.enemy;
    return { active: this.battle.active[side], team: team.map((d) => ({ hp: d.hp, status: d.status, pp: d.moves.map((m) => m.pp) })) };
  }

  private broadcast(events: BattleEvent[]) {
    const result = this.battle.over ?? undefined;
    this.a.send({ t: 'b_events', events, me: this.snap('player'), foe: this.snap('enemy'), need: this.needOf('player'), seq: this.decided.player + 1, result });
    this.b.send({
      t: 'b_events', events: events.map(flip), me: this.snap('enemy'), foe: this.snap('player'), need: this.needOf('enemy'), seq: this.decided.enemy + 1,
      result: result ? invert(result) : undefined,
    });
    if (this.battle.over) this.end();
    else this.arm();
  }

  /** Make sure nobody can stall forever: pick for whoever is slow. */
  private arm() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      for (const side of ['player', 'enemy'] as Side[]) {
        const need = this.needOf(side);
        const c = side === 'player' ? this.a : this.b;
        if (need === 'switch') {
          const team = side === 'player' ? this.battle.player : this.battle.enemy;
          this.action(c, { kind: 'switch', index: team.findIndex((d) => d.hp > 0) });
        } else if (need === 'action') {
          const mon = this.battle.mon(side);
          this.action(c, { kind: 'move', slot: mon.moves.findIndex((m) => m.pp > 0) });
        }
      }
    }, TURN_MS);
  }

  action(c: Client, action: Action) {
    if (this.done || !action || typeof action !== 'object') return;
    const side = this.sideOf(c);
    const need = this.needOf(side);
    const bt = this.battle;
    if (need === 'switch') {
      if (action.kind !== 'switch' || !bt.validPvp(side, action)) return;
      this.decided[side]++;
      this.broadcast(bt.forceSwitch(action.index, side));
      return;
    }
    if (need !== 'action' || !bt.validPvp(side, action)) return;
    this.decided[side]++;
    this.pending[side] = action;
    if (this.pending.player && this.pending.enemy) {
      const ev = bt.runTurnPvp(this.pending.player, this.pending.enemy);
      this.pending = {};
      this.broadcast(ev);
    } else {
      // Let this side know we're waiting on the other one.
      c.send({ t: 'b_events', events: [], me: this.snap(side), foe: this.snap(side === 'player' ? 'enemy' : 'player'), need: 'wait', seq: this.decided[side] + 1 });
    }
  }

  forfeit(c: Client, left = false) {
    if (this.done) return;
    const side = this.sideOf(c);
    const loser = c.name;
    const msg: BattleEvent = { t: 'msg', text: left ? `${loser} left the fight!` : `${loser} gave up!` };
    this.battle.over = side === 'player' ? 'lose' : 'win';
    this.broadcast([msg, { t: 'end', result: this.battle.over }]);
  }

  private end() {
    if (this.done) return;
    this.done = true;
    if (this.timer) clearTimeout(this.timer);
    this.a.pvp = null;
    this.b.pvp = null;
    this.onEnd();
  }
}

function flipSide(s: Side): Side {
  return s === 'player' ? 'enemy' : 'player';
}

function flip(e: BattleEvent): BattleEvent {
  if (e.t === 'end') return { t: 'end', result: invert(e.result) };
  if ('side' in e) return { ...e, side: flipSide(e.side) } as BattleEvent;
  return e;
}

function invert(r: BattleResult): BattleResult {
  return r === 'win' ? 'lose' : r === 'lose' ? 'win' : r;
}
