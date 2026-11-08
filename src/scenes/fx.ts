// Move effects by type: a little particle show between the lunge and the hit.
// Everything is plain rectangles and circles so it stays crisp at 240x160.

import Phaser from 'phaser';
import type { MoveDef } from '../data/moves';
import type { TypeId } from '../data/types';

export interface Pt {
  x: number;
  y: number;
}

const DEPTH = 25;

type Fx = (s: Phaser.Scene, from: Pt, to: Pt) => Promise<void>;

function tween(s: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig) {
  return new Promise<void>((r) => s.tweens.add({ ...cfg, onComplete: () => r() }));
}

function dot(s: Phaser.Scene, x: number, y: number, size: number, color: number) {
  return s.add.rectangle(Math.round(x), Math.round(y), size, size, color).setDepth(DEPTH);
}

function ring(s: Phaser.Scene, x: number, y: number, r: number, color: number) {
  return s.add.circle(x, y, r).setStrokeStyle(2, color).setDepth(DEPTH);
}

/** Particles flying out from a point, then fading. */
async function burst(s: Phaser.Scene, at: Pt, colors: number[], n = 8, spread = 18, ms = 320, size = 3) {
  const parts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = spread * (0.6 + Math.random() * 0.5);
    const p = dot(s, at.x, at.y, size, colors[i % colors.length]);
    return { p, x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d };
  });
  await Promise.all(parts.map(({ p, x, y }) => tween(s, { targets: p, x, y, alpha: 0, duration: ms, ease: 'Quad.out' })));
  parts.forEach(({ p }) => p.destroy());
}

/** Something thrown in an arc from one point to another. */
async function lob(s: Phaser.Scene, from: Pt, to: Pt, w: number, h: number, color: number, ms = 300, height = 26) {
  const o = s.add.rectangle(from.x, from.y, w, h, color).setDepth(DEPTH);
  await new Promise<void>((r) =>
    s.tweens.addCounter({
      from: 0,
      to: 1,
      duration: ms,
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 1;
        o.setPosition(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * height);
        o.setAngle(t * 400);
      },
      onComplete: () => r(),
    }),
  );
  o.destroy();
}

const ATTACK: Record<TypeId, Fx> = {
  STREET: (s, _f, to) => burst(s, { x: to.x, y: to.y + 14 }, [0xc8c0b0, 0x9c9488], 7, 14, 280),
  BOOZE: async (s, from, to) => {
    await lob(s, from, to, 3, 7, 0x6c4c20);
    await burst(s, to, [0x58a050, 0x8c6c30, 0xe8e8d0], 9, 16);
  },
  CHEM: async (s, _f, to) => {
    const bubbles = Array.from({ length: 7 }, (_, i) => {
      const b = s.add.circle(to.x - 14 + i * 5, to.y + 10, 2 + (i % 2), i % 3 ? 0x60d050 : 0xa8f080).setDepth(DEPTH);
      return tween(s, { targets: b, y: to.y - 18 - (i % 3) * 6, alpha: 0, duration: 380 + i * 25, ease: 'Sine.out' }).then(() => b.destroy());
    });
    await Promise.all(bubbles);
  },
  PSYCHO: async (s, from) => {
    const rings = [0, 1, 2].map((i) => ring(s, from.x, from.y, 4, i % 2 ? 0xe080f0 : 0xa040c0));
    await Promise.all(rings.map((r, i) => tween(s, { targets: r, scale: 6 + i * 2, alpha: 0, duration: 360, delay: i * 80 })));
    rings.forEach((r) => r.destroy());
  },
  TOUGH: async (s, _f, to) => {
    const star = s.add.star(to.x, to.y, 6, 4, 11, 0xf8f8f8).setStrokeStyle(2, 0xf0a030).setDepth(DEPTH);
    s.cameras.main.shake(120, 0.006);
    await tween(s, { targets: star, scale: 1.6, alpha: 0, duration: 260 });
    star.destroy();
  },
  SLICK: async (s, _f, to) => {
    const lines = [-8, 0, 8].map((dy, i) => s.add.rectangle(to.x - 20, to.y + dy, 10, 1, i === 1 ? 0xf8f070 : 0xf8f8f8).setDepth(DEPTH));
    await Promise.all(lines.map((l, i) => tween(s, { targets: l, x: to.x + 20, scaleX: 2, alpha: 0, duration: 200, delay: i * 40 })));
    lines.forEach((l) => l.destroy());
  },
  HOLY: async (s, _f, to) => {
    const beam = s.add.rectangle(to.x, to.y - 30, 14, 80, 0xf8e880, 0.8).setDepth(DEPTH).setScale(0.2, 1);
    await tween(s, { targets: beam, scaleX: 1, duration: 140 });
    await tween(s, { targets: beam, alpha: 0, duration: 260 });
    beam.destroy();
    await burst(s, to, [0xf8f0b0, 0xf8d040], 6, 12, 200, 2);
  },
  FERAL: async (s, _f, to) => {
    const marks = [-6, 0, 6].map((dx) => s.add.rectangle(to.x + dx, to.y, 2, 22, 0xf05050).setDepth(DEPTH).setAngle(25).setScale(1, 0));
    await Promise.all(marks.map((m, i) => tween(s, { targets: m, scaleY: 1, duration: 120, delay: i * 50 })));
    await Promise.all(marks.map((m) => tween(s, { targets: m, alpha: 0, duration: 200 })));
    marks.forEach((m) => m.destroy());
  },
  SCRAP: async (s, from, to) => {
    await Promise.all([0, 1, 2].map((i) => new Promise<void>((r) => s.time.delayedCall(i * 70, () => void lob(s, from, { x: to.x - 8 + i * 8, y: to.y + (i - 1) * 4 }, 6, 5, [0x9ca8b0, 0x7c8890, 0xb87040][i], 300, 22).then(r)))));
    await burst(s, to, [0x9ca8b0, 0x5c6870], 6, 12, 220);
  },
  STRAPPED: async (s, from, to) => {
    const flash = s.add.star(from.x + 10, from.y - 6, 5, 3, 9, 0xf8e050).setDepth(DEPTH);
    const tracer = s.add.line(0, 0, from.x, from.y, to.x, to.y, 0xf8f0a0).setOrigin(0, 0).setDepth(DEPTH).setLineWidth(2);
    await new Promise<void>((r) => s.time.delayedCall(160, () => r()));
    flash.destroy();
    tracer.destroy();
    await burst(s, to, [0xf8e050, 0xf8f8f8], 6, 10, 200, 2);
  },
};

/** Self-buffs and status moves: a glow around whoever it's aimed at. */
async function aura(s: Phaser.Scene, at: Pt, color: number, up: boolean) {
  const parts = Array.from({ length: 8 }, (_, i) => dot(s, at.x - 16 + (i % 4) * 10 + (i > 3 ? 5 : 0), at.y + (up ? 16 : -20) + (i > 3 ? 6 : 0), 3, color));
  await Promise.all(parts.map((p, i) => tween(s, { targets: p, y: p.y + (up ? -30 : 30), alpha: 0, duration: 420, delay: i * 30 })));
  parts.forEach((p) => p.destroy());
}

const TYPE_COLOR: Record<TypeId, number> = {
  STREET: 0xc8c0b0, BOOZE: 0xd09040, CHEM: 0x70e060, PSYCHO: 0xd070e0, TOUGH: 0xf07050,
  SLICK: 0x70a0f8, HOLY: 0xf8e070, FERAL: 0xc09060, SCRAP: 0xa8b8c0, STRAPPED: 0xf8f0a0,
};

/** Play the effect for a move. from/to are the middle of the user and the target. */
export async function moveFx(s: Phaser.Scene, def: MoveDef, from: Pt, to: Pt) {
  if (def.power > 0) return ATTACK[def.type](s, from, to);
  if (def.heal) return aura(s, from, 0x80f0a0, true);
  const onSelf = def.stat?.who === 'self';
  const up = onSelf ? (def.stat?.stages ?? 1) > 0 : false;
  return aura(s, onSelf ? from : to, TYPE_COLOR[def.type], up);
}
