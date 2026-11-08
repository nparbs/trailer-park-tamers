import { expect, it } from 'vitest';
import { Battle } from '../src/game/battle';
import { makeDrifter, maxHp } from '../src/game/creature';

it('catch odds are sane', () => {
  const rates: Record<string, number> = {};
  for (const [sp, hpFrac] of [['JOE', 1], ['JOE', 0.3], ['STAN', 1], ['TERRY', 0.2], ['TANK', 0.1]] as const) {
    let ok = 0;
    for (let i = 0; i < 4000; i++) {
      const foe = makeDrifter(sp, 5);
      foe.hp = Math.max(1, Math.floor(maxHp(foe) * hpFrac));
      const b = new Battle({ player: [makeDrifter('WILLIE', 5)], enemy: [foe], wild: true });
      if (b.catchRoll(1).caught) ok++;
    }
    rates[`${sp}@${hpFrac}`] = ok / 4000;
  }
  expect(rates['JOE@1']).toBeGreaterThan(0.25);
  expect(rates['JOE@0.3']).toBeGreaterThan(0.6);
});
