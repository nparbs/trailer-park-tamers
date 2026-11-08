import { describe, expect, it } from 'vitest';
import { Battle } from '../src/game/battle';
import { addExp, expForLevel, makeDrifter, maxHp, stats } from '../src/game/creature';
import { MOVES } from '../src/data/moves';
import { SPECIES } from '../src/data/species';
import { effectiveness } from '../src/data/types';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('data', () => {
  it('every learnset move exists and is sorted by level', () => {
    for (const [id, sp] of Object.entries(SPECIES)) {
      let last = 0;
      for (const [lv, mv] of sp.learnset) {
        expect(MOVES, `${id} ${mv}`).toHaveProperty(mv);
        expect(lv).toBeGreaterThanOrEqual(last);
        last = lv;
      }
      if ('evolves' in sp && sp.evolves) expect(SPECIES).toHaveProperty(sp.evolves.into);
    }
  });

  it('starter triangle works', () => {
    expect(effectiveness('BOOZE', ['HOLY'])).toBe(2);
    expect(effectiveness('HOLY', ['CHEM'])).toBe(2);
    expect(effectiveness('CHEM', ['BOOZE'])).toBe(2);
  });
});

describe('creature', () => {
  it('makes a level 5 drifter with moves and full HP', () => {
    const d = makeDrifter('WILLIE', 5, seeded());
    expect(d.moves.length).toBeGreaterThan(0);
    expect(d.moves.length).toBeLessThanOrEqual(4);
    expect(d.hp).toBe(maxHp(d));
    expect(stats(d).hp).toBeGreaterThan(15);
  });

  it('levels up and learns moves', () => {
    const d = makeDrifter('WILLIE', 4, seeded());
    const ups = addExp(d, expForLevel(5) - d.exp);
    expect(d.level).toBe(5);
    expect(ups[0].newMoves).toContain('BOTTLE_SMASH');
  });
});

describe('battle', () => {
  it('a wild fight ends with a knockout', () => {
    const rng = seeded(7);
    const me = makeDrifter('PETE', 10, rng);
    const foe = makeDrifter('JOE', 3, rng);
    const b = new Battle({ player: [me], enemy: [foe], wild: true, rng });
    let guard = 0;
    while (!b.over && guard++ < 50) b.runTurn({ kind: 'move', slot: 0 });
    expect(b.over).toBe('win');
    expect(foe.hp).toBe(0);
  });

  it('catching a weak foe with lots of sacks eventually works', () => {
    const rng = seeded(3);
    const me = makeDrifter('AMOS', 5, rng);
    const foe = makeDrifter('JOE', 3, rng);
    foe.hp = 1;
    const b = new Battle({ player: [me], enemy: [foe], wild: true, rng, bag: { SACK: 30 } });
    let guard = 0;
    while (!b.over && guard++ < 30) b.runTurn({ kind: 'item', item: 'SACK' });
    expect(b.over).toBe('caught');
    expect(b.caught).toBe(foe);
  });

  it("refuses to bag a trainer's crew and doesn't use the sack", () => {
    const me = makeDrifter('AMOS', 5);
    const foe = makeDrifter('JOE', 3);
    const bag = { SACK: 1 };
    const b = new Battle({ player: [me], enemy: [foe], wild: false, trainerName: 'RUSTY', bag });
    const ev = b.runTurn({ kind: 'item', item: 'SACK' });
    expect(bag.SACK).toBe(1);
    expect(ev.some((e) => e.t === 'msg' && e.text.includes("somebody else's"))).toBe(true);
  });

  it('asks for a switch when the active crew member drops', () => {
    const rng = seeded(11);
    const a = makeDrifter('JOE', 2, rng);
    const c = makeDrifter('JOE', 2, rng);
    const foe = makeDrifter('TANK', 30, rng);
    const b = new Battle({ player: [a, c], enemy: [foe], wild: true, rng });
    let guard = 0;
    while (!b.needSwitch && !b.over && guard++ < 20) b.runTurn({ kind: 'move', slot: 0 });
    expect(b.needSwitch).toBe(true);
    b.forceSwitch(1);
    expect(b.me).toBe(c);
  });

  it('super effective hits do more damage', () => {
    const rng = () => 0.5;
    const willie = makeDrifter('WILLIE', 20, rng);
    const amos = makeDrifter('AMOS', 20, rng);
    const pete = makeDrifter('PETE', 20, rng);
    const vsHoly = new Battle({ player: [willie], enemy: [amos], wild: true, rng });
    const vsChem = new Battle({ player: [willie], enemy: [pete], wild: true, rng });
    const mv = MOVES.BOTTLE_SMASH;
    const se = vsHoly.calcDamage('player', 'enemy', mv, false);
    const nve = vsChem.calcDamage('player', 'enemy', mv, false);
    expect(se.eff).toBe(2);
    expect(nve.eff).toBe(0.5);
    expect(se.dmg).toBeGreaterThan(nve.dmg * 2);
  });
});
