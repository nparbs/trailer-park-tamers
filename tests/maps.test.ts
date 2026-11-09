import { describe, expect, it } from 'vitest';
import { MAPS, encountersFor } from '../src/data/maps';
import { ITEMS } from '../src/data/items';
import { phaseAt } from '../src/game/time';
import { SPECIES } from '../src/data/species';
import { INDOOR, OUTDOOR } from '../src/gfx/tiles';
import { WALKERS } from '../src/gfx/people';

function legend(indoor: boolean) {
  return new Map((indoor ? INDOOR : OUTDOOR).map((t) => [t.ch, t]));
}

describe('time of day', () => {
  it('splits the clock into four phases', () => {
    expect(phaseAt(3)).toBe('night');
    expect(phaseAt(5.5)).toBe('morning');
    expect(phaseAt(12)).toBe('day');
    expect(phaseAt(17.5)).toBe('evening');
    expect(phaseAt(19)).toBe('night');
    expect(phaseAt(23.9)).toBe('night');
  });
});

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

      it('has encounter tables with drifters by day and by night', () => {
        for (const enc of [m.enc, m.enc2?.enc]) {
          if (!enc) continue;
          for (const [sp] of enc.table) expect(SPECIES).toHaveProperty(sp);
          expect(encountersFor(enc, false).length, 'day table').toBeGreaterThan(0);
          expect(encountersFor(enc, true).length, 'night table').toBeGreaterThan(0);
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

      it('keeps NPCs off ledges and gives every ledge somewhere to land', () => {
        for (const n of m.npcs) expect(tile(n.x, n.y)?.ledge, `${n.id} on a ledge`).toBeFalsy();
        m.rows.forEach((r, y) =>
          [...r].forEach((_, x) => {
            if (!tile(x, y)?.ledge) return;
            expect(tile(x, y + 1), `below ledge ${x},${y}`).toBeTruthy();
            expect(tile(x, y + 1)?.ledge, `double ledge ${x},${y}`).toBeFalsy();
          }),
        );
      });

      it('hides items only in trash piles, dumpsters and bins', () => {
        for (const h of m.hidden ?? []) {
          expect(m.indoor, 'hidden items are outdoors').toBe(false);
          expect('%Dt'.includes(m.rows[h.y]?.[h.x] ?? ''), `hidden ${h.item} at ${h.x},${h.y}`).toBe(true);
          expect(ITEMS).toHaveProperty(h.item);
        }
      });

      it('puts zip-tied fences between two walkable tiles', () => {
        m.rows.forEach((r, y) =>
          [...r].forEach((ch, x) => {
            if (ch !== '5' || m.indoor) return;
            const across = (walkable(x - 1, y) && walkable(x + 1, y)) || (walkable(x, y - 1) && walkable(x, y + 1));
            expect(across, `fence ${x},${y} leads nowhere`).toBe(true);
          }),
        );
      });

      it('never strands you: every tile you can reach can get back to an exit', () => {
        // Walking rules: normal steps, one-way hops down ledges, and fences counted as cut.
        const h = m.rows.length;
        const open = (x: number, y: number) => {
          const t = tile(x, y);
          return !!t && !t.ledge && (!t.solid || t.ch === '5');
        };
        const next = (x: number, y: number): [number, number][] => {
          const out: [number, number][] = [];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, y + dy)) out.push([x + dx, y + dy]);
          if (tile(x, y + 1)?.ledge && open(x, y + 2)) out.push([x, y + 2]);
          return out;
        };
        const isWarp = (x: number, y: number) => m.warps.some((wp) => x >= wp.x && x < wp.x + (wp.w ?? 1) && y >= wp.y && y < wp.y + (wp.h ?? 1));
        const reach = (sx: number, sy: number) => {
          const seen = new Set([sx + ',' + sy]);
          const q: [number, number][] = [[sx, sy]];
          while (q.length) {
            const [x, y] = q.shift()!;
            for (const [nx, ny] of next(x, y)) {
              const k = nx + ',' + ny;
              if (!seen.has(k)) {
                seen.add(k);
                q.push([nx, ny]);
              }
            }
          }
          return seen;
        };
        if (!m.warps.length) return;
        const start = m.warps[0];
        for (const k of reach(start.x, start.y)) {
          const [x, y] = k.split(',').map(Number);
          const back = [...reach(x, y)].some((t) => isWarp(...(t.split(',').map(Number) as [number, number])));
          expect(back, `stuck at ${x},${y} (map height ${h})`).toBe(true);
        }
      });
    });
  }
});
