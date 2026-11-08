import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/data/maps';
import { SPECIES } from '../src/data/species';
import { INDOOR, OUTDOOR } from '../src/gfx/tiles';
import { WALKERS } from '../src/gfx/people';

function legend(indoor: boolean) {
  return new Map((indoor ? INDOOR : OUTDOOR).map((t) => [t.ch, t]));
}

describe('maps', () => {
  for (const m of Object.values(MAPS)) {
    describe(m.id, () => {
      const L = legend(m.indoor);
      const w = m.rows[0].length;
      const tile = (x: number, y: number) => L.get(m.rows[y]?.[x] ?? '');
      const walkable = (x: number, y: number) => {
        const t = tile(x, y);
        return !!t && !t.solid;
      };

      it('has rectangular rows of known tiles', () => {
        m.rows.forEach((r, y) => {
          expect(r.length, `row ${y}`).toBe(w);
          for (const ch of r) expect(L.has(ch), `char "${ch}" in row ${y}`).toBe(true);
        });
      });

      it('has warps that land on walkable tiles', () => {
        for (const wp of m.warps) {
          const dest = MAPS[wp.to];
          expect(dest, `warp target ${wp.to}`).toBeTruthy();
          const dl = legend(dest.indoor);
          for (let i = 0; i < (wp.w ?? 1); i++)
            for (let j = 0; j < (wp.h ?? 1); j++) {
              expect(walkable(wp.x + i, wp.y + j), `warp source ${wp.x + i},${wp.y + j}`).toBe(true);
              const t = dl.get(dest.rows[wp.ty + j]?.[wp.tx + i] ?? '');
              expect(t && !t.solid, `warp dest ${wp.to} ${wp.tx + i},${wp.ty + j}`).toBe(true);
            }
        }
      });

      it('places NPCs on walkable tiles with known looks', () => {
        for (const n of m.npcs) {
          expect(walkable(n.x, n.y), `${n.id} at ${n.x},${n.y}`).toBe(true);
          if (n.look.startsWith('sp:')) expect(SPECIES).toHaveProperty(n.look.slice(3));
          else if (n.look !== 'item') expect(WALKERS).toHaveProperty(n.look);
          for (const [sp] of n.trainer?.team ?? []) expect(SPECIES).toHaveProperty(sp);
        }
      });

      it('has signs on solid tiles', () => {
        for (const s of m.signs ?? []) expect(tile(s.x, s.y)?.solid, `sign ${s.x},${s.y}`).toBe(true);
      });
    });
  }
});
