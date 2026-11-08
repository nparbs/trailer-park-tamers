// Build every texture at startup from code.

import Phaser from 'phaser';
import { SPECIES, type Look, type SpeciesId } from '../data/species';
import { WALKERS, walkerFrames, type WalkerLook } from './people';
import { Pix, darken, lighten } from './pixels';
import { drawDrifter } from './portrait';
import { INDOOR, OUTDOOR, buildTileset } from './tiles';

function addFrames(scene: Phaser.Scene, key: string, cv: HTMLCanvasElement, fw: number, fh: number) {
  const tex = scene.textures.addCanvas(key, cv)!;
  const n = Math.floor(cv.width / fw);
  for (let i = 0; i < n; i++) tex.add(i, 0, i * fw, 0, fw, fh);
}

function stripOf(frames: Pix[]) {
  const all = new Pix(16 * frames.length, 16);
  frames.forEach((f, i) => all.blit(f, i * 16, 0));
  return all.toCanvas();
}

/** Overworld sprite for a drifter species, based on its battle look. */
export function walkerFromLook(l: Look): WalkerLook {
  const hatStyles: Record<string, number | undefined> = {
    cap: l.hair, beanie: l.hair, tinfoil: 0xc8ccd8, hood: darken(l.top, 0.85), helmet: 0xe8c040,
  };
  return {
    skin: l.skin,
    hair: l.hair,
    hat: hatStyles[l.hairStyle],
    bald: l.hairStyle === 'bald',
    top: l.top,
    pants: l.topStyle === 'robe' ? l.top : l.pants,
    beard: l.beard === 'full' || l.beard === 'long' ? l.hair : undefined,
  };
}

/** Battle portrait for a human trainer, based on their overworld look. */
export function lookFromWalker(w: WalkerLook, big = false): Look {
  return {
    skin: w.skin,
    hair: w.hat ?? w.hair,
    hairStyle: w.bald ? 'bald' : w.hat !== undefined ? 'cap' : 'short',
    beard: w.beard !== undefined ? 'full' : 'none',
    beardColor: w.beard,
    top: w.top,
    topStyle: 'tee',
    pants: w.pants,
    big,
  };
}

function battleBg(kind: 'park' | 'street' | 'indoor') {
  const p = new Pix(240, 112);
  const pal = {
    park: { sky: 0xb8e0f8, sky2: 0xd8f0f8, far: 0x88b868, ground: 0xa8d880, plat: 0x78b050, platL: 0x98c870 },
    street: { sky: 0xe8b890, sky2: 0xf8d8b0, far: 0x787088, ground: 0xb0aca0, plat: 0x7c7c84, platL: 0x9c9ca4 },
    indoor: { sky: 0x8c7058, sky2: 0x9c8068, far: 0x6c5440, ground: 0xb08458, plat: 0x8c6038, platL: 0xa87848 },
  }[kind];
  p.rect(0, 0, 240, 60, pal.sky);
  for (let y = 0; y < 60; y += 6) p.rect(0, y, 240, 2, pal.sky2);
  if (kind === 'park') {
    for (let x = 0; x < 240; x += 18) p.oval(x - 4, 36, 26, 28, darken(pal.far, 0.9));
    for (let x = 12; x < 240; x += 40) {
      // distant trailers
      p.rect(x, 44, 26, 12, 0xe8e0d0);
      p.rect(x, 48, 26, 2, 0x40a0a0);
      p.rect(x + 4, 46, 4, 3, 0x78a0c8);
    }
  } else if (kind === 'street') {
    for (let x = 0; x < 240; x += 30) {
      const h = 20 + ((x * 7) % 23);
      p.rect(x, 58 - h, 28, h, pal.far);
      for (let wy = 60 - h; wy < 54; wy += 6) for (let wx = x + 3; wx < x + 26; wx += 6) p.rect(wx, wy, 3, 3, (wx + wy) % 4 ? 0xf8e8a0 : 0x585068);
    }
  } else {
    p.rect(0, 0, 240, 60, pal.sky);
    for (let x = 0; x < 240; x += 12) p.rect(x, 0, 1, 60, darken(pal.sky, 0.85));
    p.rect(150, 10, 40, 30, 0x202020);
    p.rect(152, 12, 16, 26, 0xb08c58);
    p.rect(170, 12, 18, 26, 0xa07c48);
  }
  p.rect(0, 56, 240, 56, pal.ground);
  p.speckle(0, 56, 240, 56, darken(pal.ground, 0.9), 0.08, 3);
  p.speckle(0, 56, 240, 56, lighten(pal.ground, 0.15), 0.06, 4);
  // platforms
  p.oval(124, 62, 104, 22, darken(pal.plat, 0.8));
  p.oval(126, 62, 100, 19, pal.plat);
  p.oval(140, 64, 70, 11, pal.platL);
  p.oval(4, 96, 120, 26, darken(pal.plat, 0.8));
  p.oval(6, 96, 116, 23, pal.plat);
  p.oval(24, 99, 80, 13, pal.platL);
  return p.toCanvas();
}

function itemBall() {
  const p = new Pix(16, 16);
  p.oval(3, 5, 10, 10, 0xc8a068);
  p.rect(6, 3, 4, 4, 0xc8a068);
  p.rect(5, 5, 6, 1, 0x8c6034);
  p.speckle(3, 5, 10, 10, 0xa88048, 0.15, 4);
  p.set(6, 8, 0xe8c888);
  p.outline(0x282830);
  return p;
}

function sack() {
  const p = new Pix(16, 16);
  p.oval(2, 4, 12, 12, 0xc8a068);
  p.rect(5, 1, 6, 5, 0xc8a068);
  p.rect(4, 5, 8, 1, 0x8c6034);
  p.speckle(2, 4, 12, 12, 0xa88048, 0.18, 9);
  p.outline(0x282830);
  return p;
}

function alertBubble() {
  const p = new Pix(10, 12);
  p.rect(0, 0, 10, 10, 0xf8f8f8);
  p.rect(4, 2, 2, 4, 0xd03030);
  p.rect(4, 7, 2, 2, 0xd03030);
  p.rect(3, 10, 3, 2, 0xf8f8f8);
  p.outline(0x282830);
  return p;
}

function weedOverlay() {
  // Covers the walker's legs while standing in weeds.
  const p = new Pix(16, 16);
  for (let i = 0; i < 4; i++) {
    const x = i * 4;
    p.line(x, 15, x + 1, 9, 0x2c6c20);
    p.line(x + 2, 15, x + 2, 10, 0x78c050);
    p.rect(x, 13, 4, 3, 0x4c9a34);
  }
  return p;
}

function shadow() {
  const p = new Pix(14, 5);
  p.oval(0, 0, 14, 5, 0x000000);
  return p;
}

export function buildTextures(scene: Phaser.Scene) {
  scene.textures.addCanvas('tiles-out', buildTileset(OUTDOOR));
  scene.textures.addCanvas('tiles-in', buildTileset(INDOOR));

  for (const [k, look] of Object.entries(WALKERS)) addFrames(scene, 'w_' + k, stripOf(walkerFrames(look)), 16, 16);
  for (const [id, sp] of Object.entries(SPECIES)) {
    addFrames(scene, 'w_sp:' + id, stripOf(walkerFrames(walkerFromLook(sp.look as Look))), 16, 16);
    scene.textures.addCanvas('pf_' + id, drawDrifter(sp.look as Look, false).toCanvas());
    scene.textures.addCanvas('pb_' + id, drawDrifter(sp.look as Look, true).toCanvas());
  }
  for (const [k, w] of Object.entries(WALKERS)) {
    scene.textures.addCanvas('tf_' + k, drawDrifter(lookFromWalker(w, k === 'tony'), false).toCanvas());
  }
  scene.textures.addCanvas('tb_player', drawDrifter(lookFromWalker(WALKERS.player), true).toCanvas());

  for (const k of ['park', 'street', 'indoor'] as const) scene.textures.addCanvas('bg_' + k, battleBg(k));
  scene.textures.addCanvas('item', itemBall().toCanvas());
  scene.textures.addCanvas('sack', sack().toCanvas());
  scene.textures.addCanvas('alert', alertBubble().toCanvas());
  scene.textures.addCanvas('weeds', weedOverlay().toCanvas());
  scene.textures.addCanvas('shadow', shadow().toCanvas());
}

export function portraitKey(sp: SpeciesId, back = false) {
  return (back ? 'pb_' : 'pf_') + sp;
}
