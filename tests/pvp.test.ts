import { describe, expect, it } from 'vitest';
import { Battle, type Action } from '../src/game/battle';
import { makeDrifter } from '../src/game/creature';
import { cleanDrifter } from '../src/net/protocol';

function seeded(seed = 1) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Play a whole PvP fight with both sides attacking and replacing when asked. */
function playOut(seed: number) {
  const rng = seeded(seed);
  const a = [makeDrifter('WILLIE', 12, rng), makeDrifter('STAN', 10, rng)];
  const b = [makeDrifter('AMOS', 12, rng), makeDrifter('CAROL', 10, rng)];
  const bt = new Battle({ player: a, enemy: b, wild: false, rng, pvp: { player: 'ALICE', enemy: 'BOB' } });
  for (let turn = 0; turn < 200 && !bt.over; turn++) {
    if (bt.needSwitch) bt.forceSwitch(a.findIndex((d) => d.hp > 0), 'player');
    if (bt.needSwitchEnemy) bt.forceSwitch(b.findIndex((d) => d.hp > 0), 'enemy');
    if (bt.over) break;
    expect(bt.active.player).toBeGreaterThanOrEqual(0);
    expect(bt.active.enemy).toBeGreaterThanOrEqual(0);
    const mv: Action = { kind: 'move', slot: 0 };
    expect(bt.validPvp('player', mv)).toBe(true);
    expect(bt.validPvp('enemy', mv)).toBe(true);
    bt.runTurnPvp(mv, mv);
  }
  return bt;
}

describe('pvp', () => {
  it('always finishes, with valid active fighters throughout', () => {
    for (let s = 1; s < 40; s++) expect(playOut(s).over).toMatch(/win|lose/);
  });

  it('names both owners in the text', () => {
    const bt = new Battle({ player: [makeDrifter('JOE', 5)], enemy: [makeDrifter('GARY', 5)], wild: false, pvp: { player: 'ALICE', enemy: 'BOB' } });
    const ev = bt.runTurnPvp({ kind: 'move', slot: 0 }, { kind: 'move', slot: 0 });
    const text = ev.filter((e) => e.t === 'msg').map((e) => (e as any).text).join(' ');
    expect(text).toContain("ALICE's");
    expect(text).toContain("BOB's");
  });

  it('rejects made-up drifters', () => {
    expect(cleanDrifter({ sp: 'NOPE', level: 5, moves: [{ id: 'SHOVE', pp: 5 }] })).toBeNull();
    expect(cleanDrifter({ sp: 'JOE', level: 500, moves: [{ id: 'SHOVE', pp: 5 }] })).toBeNull();
    expect(cleanDrifter({ sp: 'JOE', level: 5, moves: [{ id: 'KAMEHAMEHA', pp: 5 }] })).toBeNull();
    const ok = cleanDrifter({ sp: 'JOE', level: 5, hp: 10, moves: [{ id: 'SHOVE', pp: 999 }], ivs: { hp: 99 } })!;
    expect(ok.moves[0].pp).toBe(35);
    expect(ok.ivs.hp).toBe(31);
  });
});
