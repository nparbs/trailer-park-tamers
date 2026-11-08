// Battle sprites: a 64x64 front view and back view built from a species' Look.

import type { Look } from '../data/species';
import { Pix, darken, lighten } from './pixels';

const INK = 0x202028;
const WHITE = 0xf8f8f8;

export function drawDrifter(l: Look, back: boolean): Pix {
  const p = new Pix(64, 64);
  const cx = 32;
  const bw = l.big ? 30 : l.thin ? 18 : 24; // torso width
  const bx = cx - bw / 2;
  const longTop = l.topStyle === 'coat' || l.topStyle === 'robe';
  const torsoTop = 31;
  const torsoBot = 49;
  const skinD = darken(l.skin, 0.8);

  // --- behind everything ---
  if (l.prop === 'cart') drawCart(p, back ? 4 : 42, 36);
  if (l.prop === 'cans') drawCanBag(p, back ? 4 : 44, 40);
  if (l.prop === 'bag') drawTrashBag(p, back ? 38 : 8, 26);
  if (l.hairStyle === 'afro') p.oval(cx - 16, 1, 32, 26, l.hair);
  if (l.hairStyle === 'hood') p.oval(cx - 13, 6, 26, 28, darken(l.top, 0.85));
  if (l.hairStyle === 'long' || (l.hairStyle === 'bun' && !back)) p.rect(cx - 11, 12, 22, back ? 26 : 22, l.hair);

  // --- legs ---
  const legBot = 60;
  const legW = l.thin ? 7 : l.big ? 11 : 9;
  if (l.topStyle !== 'robe') {
    p.rect(cx - legW - 1, torsoBot - 2, legW, legBot - torsoBot + 2, l.pants);
    p.rect(cx + 1, torsoBot - 2, legW, legBot - torsoBot + 2, l.pants);
    p.rect(cx - 1, torsoBot - 2, 2, 4, l.pants);
  }
  const shoe = 0x3c3434;
  p.rect(cx - legW - 2, legBot, legW + 1, 3, shoe);
  p.rect(cx + 1, legBot, legW + 1, 3, shoe);

  // --- torso ---
  const coatBot = l.topStyle === 'robe' ? legBot : l.topStyle === 'coat' ? 55 : torsoBot;
  p.trap(torsoTop, coatBot - torsoTop, bx + 1, bx + bw - 2, bx - (longTop ? 2 : 0), bx + bw - 1 + (longTop ? 2 : 0), l.top);
  p.rect(bx - 1, torsoTop + 2, bw + 2, 6, l.top); // shoulders

  if (!back) {
    switch (l.topStyle) {
      case 'tee':
        p.trap(torsoTop, 3, cx - 3, cx + 2, cx - 2, cx + 1, l.skin);
        break;
      case 'tank':
        p.rect(bx - 1, torsoTop, 5, 8, l.skin);
        p.rect(bx + bw - 4, torsoTop, 5, 8, l.skin);
        p.trap(torsoTop, 5, cx - 5, cx + 4, cx - 3, cx + 2, l.skin);
        break;
      case 'coat':
        p.trap(torsoTop, coatBot - torsoTop, cx - 2, cx + 1, cx - 2, cx + 1, darken(l.top, 0.7));
        p.trap(torsoTop, 10, cx - 6, cx - 3, cx - 3, cx - 2, darken(l.top, 0.8));
        p.trap(torsoTop, 10, cx + 2, cx + 5, cx + 1, cx + 2, darken(l.top, 0.8));
        for (let y = torsoTop + 10; y < coatBot - 2; y += 5) p.rect(cx - 4, y, 2, 2, 0xc8b070);
        break;
      case 'vest':
        p.trap(torsoTop, torsoBot - torsoTop, cx - 5, cx + 4, cx - 4, cx + 3, 0xe0d8c8);
        p.rect(cx - 1, torsoTop + 2, 2, 8, 0x404040);
        break;
      case 'hoodie':
        p.rect(cx - 7, torsoBot - 9, 14, 6, darken(l.top, 0.8));
        p.line(cx - 3, torsoTop + 1, cx - 3, torsoTop + 8, 0xe0e0e0);
        p.line(cx + 2, torsoTop + 1, cx + 2, torsoTop + 8, 0xe0e0e0);
        break;
      case 'robe':
        p.rect(bx - 1, torsoBot - 4, bw + 2, 2, 0xc8a050);
        p.trap(torsoTop, 6, cx - 4, cx + 3, cx - 1, cx, darken(l.top, 0.8));
        break;
      case 'army':
        p.speckle(bx, torsoTop, bw, torsoBot - torsoTop, darken(l.top, 0.7), 0.18, 3);
        p.speckle(bx, torsoTop, bw, torsoBot - torsoTop, lighten(l.top, 0.2), 0.12, 5);
        p.rect(cx + 3, torsoTop + 5, 5, 4, darken(l.top, 0.6));
        break;
      case 'sweater':
        for (let y = torsoTop + 4; y < torsoBot; y += 4) p.rect(bx, y, bw, 1, darken(l.top, 0.8));
        p.trap(torsoTop, 3, cx - 4, cx + 3, cx - 3, cx + 2, darken(l.top, 0.75));
        break;
    }
  } else if (l.topStyle === 'hoodie') {
    p.oval(cx - 9, torsoTop - 2, 18, 9, darken(l.top, 0.8));
  }

  // --- arms ---
  const armW = l.thin ? 5 : l.big ? 8 : 6;
  const sleeve = l.topStyle === 'tank' ? l.skin : l.top;
  const armBot = torsoBot - 1;
  for (const ax of [bx - armW + 1, bx + bw - 1]) {
    p.rect(ax, torsoTop + 3, armW, armBot - torsoTop - 3, sleeve);
    if (l.topStyle === 'tee') p.rect(ax, torsoTop + 11, armW, armBot - torsoTop - 11, l.skin);
    p.oval(ax, armBot - 2, armW, 6, l.skin);
  }
  const handL = { x: bx - armW + 1 + armW / 2, y: armBot + 1 };
  const handR = { x: bx + bw - 1 + armW / 2, y: armBot + 1 };

  // --- neck & head ---
  p.rect(cx - 4, 26, 8, 6, skinD);
  const hx = cx - 9;
  const hy = 9;
  p.oval(hx, hy, 18, 20, l.skin);
  p.oval(hx - 2, hy + 8, 4, 6, l.skin); // ears
  p.oval(hx + 16, hy + 8, 4, 6, l.skin);

  if (back) {
    // Back of the head.
    if (l.hairStyle !== 'bald' && l.hairStyle !== 'tinfoil') p.oval(hx, hy, 18, 17, l.hair);
    if (l.hairStyle === 'bald') p.rect(hx + 5, hy + 3, 3, 2, lighten(l.skin, 0.4));
  } else {
    // Face.
    const ey = hy + 9;
    p.rect(hx + 3, ey, 5, 3, WHITE);
    p.rect(hx + 10, ey, 5, 3, WHITE);
    p.rect(hx + 5, ey, 2, 3, INK);
    p.rect(hx + 11, ey, 2, 3, INK);
    p.rect(hx + 3, ey - 2, 5, 1, darken(l.hair, 0.8));
    p.rect(hx + 10, ey - 2, 5, 1, darken(l.hair, 0.8));
    p.rect(hx + 8, ey + 3, 2, 3, l.nose ?? skinD);
    if (l.nose) p.rect(hx + 7, ey + 4, 4, 2, l.nose);
    p.rect(hx + 6, ey + 7, 6, 1, l.mouth ?? darken(l.skin, 0.55));
    if (l.mouth) p.rect(hx + 6, ey + 8, 6, 1, darken(l.mouth, 0.8));
    if (l.shades) {
      p.rect(hx + 2, ey - 1, 14, 4, INK);
      p.rect(hx + 3, ey, 2, 1, 0x8890a0);
      p.rect(hx + 11, ey, 2, 1, 0x8890a0);
    }
    if (l.eyepatch) {
      p.rect(hx + 10, ey - 1, 6, 5, INK);
      p.line(hx, ey - 4, hx + 17, ey + 1, INK);
    }
    // Beard.
    const bc = l.beardColor ?? l.hair;
    if (l.beard === 'stubble') p.speckle(hx + 3, ey + 5, 12, 6, darken(l.skin, 0.65), 0.35, 9);
    if (l.beard === 'full' || l.beard === 'long') {
      p.trap(ey + 4, 8, hx + 1, hx + 16, hx + 4, hx + 13, bc);
      p.rect(hx + 6, ey + 6, 6, 2, darken(l.skin, 0.5));
      p.rect(hx + 5, ey + 4, 8, 2, bc); // moustache
      if (l.beard === 'long') p.trap(ey + 11, 12, hx + 4, hx + 13, cx - 2, cx + 1, bc);
    }
  }

  // --- hair & hats ---
  const H = l.hair;
  switch (l.hairStyle) {
    case 'short':
    case 'long':
    case 'bun':
    case 'wild':
      p.oval(hx - 1, hy - 2, 20, 12, H);
      p.rect(hx - 1, hy + 3, 3, 8, H);
      p.rect(hx + 16, hy + 3, 3, 8, H);
      if (l.hairStyle === 'bun') p.oval(cx - 5, hy - 8, 10, 9, H);
      if (l.hairStyle === 'wild') {
        for (const [x, y] of [[hx - 4, hy], [hx + 2, hy - 5], [hx + 9, hy - 6], [hx + 15, hy - 4], [hx + 19, hy + 2], [hx - 3, hy + 8]]) p.oval(x, y, 6, 6, H);
      }
      break;
    case 'afro':
      p.oval(hx - 4, hy - 6, 26, 14, H);
      break;
    case 'mohawk':
      p.rect(cx - 2, hy - 9, 4, 14, H);
      p.rect(hx + 1, hy + 2, 2, 7, darken(l.skin, 0.75));
      p.rect(hx + 15, hy + 2, 2, 7, darken(l.skin, 0.75));
      break;
    case 'bald':
      if (!back) p.rect(hx + 4, hy + 2, 3, 2, lighten(l.skin, 0.4));
      p.rect(hx - 1, hy + 6, 2, 5, H);
      p.rect(hx + 17, hy + 6, 2, 5, H);
      break;
    case 'cap':
      p.oval(hx - 1, hy - 3, 20, 13, H);
      if (!back) p.rect(hx - 2, hy + 5, 22, 3, darken(H, 0.75));
      p.rect(cx - 1, hy - 3, 2, 2, lighten(H, 0.3));
      break;
    case 'beanie':
      p.oval(hx - 1, hy - 4, 20, 14, H);
      p.rect(hx - 1, hy + 4, 20, 4, darken(H, 0.8));
      p.oval(cx - 3, hy - 8, 6, 6, lighten(H, 0.25));
      break;
    case 'hood':
      p.oval(hx - 3, hy - 3, 24, 12, darken(l.top, 0.9));
      if (!back) {
        p.rect(hx - 3, hy + 4, 4, 16, darken(l.top, 0.9));
        p.rect(hx + 17, hy + 4, 4, 16, darken(l.top, 0.9));
      }
      break;
    case 'tinfoil': {
      const foil = 0xc8ccd8;
      p.trap(hy - 12, 16, cx - 1, cx, hx - 2, hx + 19, foil);
      p.speckle(hx - 2, hy - 12, 22, 16, 0xf0f4ff, 0.15, 14);
      p.speckle(hx - 2, hy - 12, 22, 16, 0x8c90a0, 0.12, 15);
      p.rect(hx - 2, hy + 3, 22, 2, 0x9ca0b0);
      break;
    }
    case 'helmet': {
      // A hubcap crown.
      const metal = 0xc8ccd0;
      p.oval(hx - 1, hy - 3, 20, 10, metal);
      for (let i = 0; i < 5; i++) p.trap(hy - 9, 7, hx + 1 + i * 4, hx + 1 + i * 4, hx - 1 + i * 4, hx + 3 + i * 4, 0xe8c040);
      p.rect(hx - 1, hy + 2, 20, 3, 0xd8b030);
      p.rect(cx - 1, hy + 3, 2, 1, 0xd04040);
      break;
    }
  }

  // --- props in front ---
  if (!back) {
    switch (l.prop) {
      case 'bottle':
        p.trap(handR.y - 9, 12, handR.x - 2, handR.x + 2, handR.x - 4, handR.x + 4, 0xb08850);
        p.rect(handR.x - 1, handR.y - 13, 3, 5, 0x3c7c3c);
        p.rect(handR.x - 1, handR.y - 14, 3, 1, 0xd8c060);
        break;
      case 'box':
        p.rect(cx - 9, torsoTop + 6, 18, 13, 0xf0f0f0);
        p.rect(cx - 9, torsoTop + 9, 18, 5, 0xa83050);
        p.rect(cx - 2, torsoTop + 3, 3, 3, 0x303030);
        break;
      case 'sign':
        p.rect(cx - 13, torsoTop + 5, 26, 15, 0xc8a068);
        p.rect(cx - 13, torsoTop + 5, 26, 1, 0xa88048);
        for (let i = 0; i < 3; i++) p.rect(cx - 10, torsoTop + 8 + i * 4, i === 2 ? 12 : 20, 2, 0x303030);
        break;
      case 'bible':
        p.rect(handR.x - 5, handR.y - 8, 10, 12, 0x202020);
        p.rect(handR.x - 1, handR.y - 6, 2, 7, 0xe8c040);
        p.rect(handR.x - 3, handR.y - 4, 6, 2, 0xe8c040);
        break;
      case 'pigeon':
        p.oval(bx + bw - 6, torsoTop - 7, 12, 9, 0x8c8c9c);
        p.oval(bx + bw + 2, torsoTop - 10, 6, 6, 0x6c6c84);
        p.rect(bx + bw + 7, torsoTop - 8, 2, 1, 0xe8a040);
        p.rect(bx + bw + 4, torsoTop - 9, 1, 1, INK);
        p.rect(bx + bw - 3, torsoTop - 5, 6, 2, 0x58a080);
        break;
      case 'cat':
        p.oval(cx - 11, torsoTop + 7, 22, 12, 0xe09040);
        p.oval(cx + 5, torsoTop + 2, 10, 10, 0xe09040);
        p.trap(torsoTop - 1, 4, cx + 6, cx + 6, cx + 5, cx + 8, 0xe09040);
        p.trap(torsoTop - 1, 4, cx + 12, cx + 12, cx + 10, cx + 13, 0xe09040);
        p.rect(cx + 7, torsoTop + 5, 2, 2, 0x58c040);
        p.rect(cx + 11, torsoTop + 5, 2, 2, 0x58c040);
        for (let x = cx - 9; x < cx + 4; x += 4) p.rect(x, torsoTop + 9, 2, 6, 0xc07020);
        break;
      case 'guitar':
        p.line(cx + 12, torsoTop - 6, cx - 2, torsoTop + 10, 0x6c4024, 3);
        p.oval(cx - 12, torsoTop + 8, 16, 14, 0xc07840);
        p.oval(cx - 7, torsoTop + 12, 5, 5, 0x3c2010);
        break;
      case 'pipe':
        p.line(handR.x, handR.y, handR.x + 4, handR.y - 12, 0x9ca0a8, 3);
        p.rect(handR.x + 2, handR.y - 15, 6, 4, 0x9ca0a8);
        break;
      case 'cards':
        for (let i = 0; i < 3; i++) {
          p.rect(handR.x - 6 + i * 4, handR.y - 10 + Math.abs(i - 1), 6, 9, WHITE);
          p.rect(handR.x - 4 + i * 4, handR.y - 8 + Math.abs(i - 1), 2, 2, i === 1 ? 0xd03030 : INK);
        }
        break;
      case 'scratchers':
        for (let i = 0; i < 3; i++) {
          p.rect(handR.x - 6 + i * 4, handR.y - 11 + i, 7, 10, [0x60c0e0, 0xe8c040, 0xe060a0][i]);
          p.rect(handR.x - 5 + i * 4, handR.y - 8 + i, 5, 3, 0xb8b8c0);
        }
        p.oval(handL.x - 3, handL.y - 3, 5, 5, 0xc8a040);
        break;
      case 'paint':
        p.rect(handR.x - 3, handR.y - 12, 6, 12, 0xd0d4dc);
        p.rect(handR.x - 3, handR.y - 9, 6, 3, 0x40a0d0);
        p.rect(handR.x - 1, handR.y - 14, 2, 2, 0x303030);
        break;
      case 'gun': {
        // A cartoon pistol held sideways.
        const gx = handR.x - 2;
        const gy = handR.y - 6;
        p.rect(gx, gy, 12, 4, 0x2c2c34);
        p.rect(gx, gy + 3, 4, 6, 0x2c2c34);
        p.rect(gx + 10, gy - 1, 2, 2, 0x2c2c34);
        p.rect(gx + 1, gy + 1, 8, 1, 0x5c5c68);
        break;
      }
      case 'joint':
        p.rect(handR.x - 1, handR.y - 8, 2, 7, 0xf0f0e8);
        p.rect(handR.x - 1, handR.y - 9, 2, 1, 0xe86830);
        p.speckle(handR.x - 4, handR.y - 22, 8, 12, 0xc8c8d0, 0.3, 7);
        break;
      case 'forty':
        p.rect(handR.x - 3, handR.y - 16, 6, 17, 0xb08850);
        p.rect(handR.x - 1, handR.y - 21, 3, 6, 0x6c4818);
        p.rect(handR.x - 3, handR.y - 10, 6, 4, 0xe8d8a0);
        p.rect(handL.x - 3, handL.y - 16, 6, 17, 0xb08850);
        p.rect(handL.x - 1, handL.y - 21, 3, 6, 0x6c4818);
        break;
      case 'handle':
        p.rect(handR.x - 5, handR.y - 18, 10, 19, 0xd8e0e8);
        p.rect(handR.x - 4, handR.y - 12, 8, 6, 0x3050a0);
        p.rect(handR.x - 1, handR.y - 22, 3, 5, 0xc03030);
        p.rect(handR.x + 4, handR.y - 16, 2, 8, 0xb8c0c8);
        break;
      case 'pills':
        p.rect(handR.x - 3, handR.y - 10, 7, 10, 0xe89030);
        p.rect(handR.x - 3, handR.y - 12, 7, 3, 0xf0f0f0);
        p.rect(handR.x - 2, handR.y - 7, 5, 3, 0xf8f8f0);
        for (const [dx, dy] of [[-8, -4], [-6, -1], [6, -3]]) p.rect(handR.x + dx, handR.y + dy, 2, 2, 0xf0f0f0);
        break;
      case 'beaker':
        p.trap(handR.y - 12, 12, handR.x - 2, handR.x + 1, handR.x - 5, handR.x + 4, 0xc8e8f0);
        p.trap(handR.y - 6, 6, handR.x - 3, handR.x + 2, handR.x - 5, handR.x + 4, 0x40a0e8);
        p.speckle(handR.x - 3, handR.y - 20, 6, 8, 0xc8f0c8, 0.3, 3);
        break;
      case 'leaf':
        for (const [dx, dy] of [[0, -10], [-5, -7], [5, -7], [-7, -2], [7, -2]]) p.line(handR.x, handR.y, handR.x + dx, handR.y + dy, 0x3c9c3c, 2);
        p.rect(handR.x, handR.y, 1, 5, 0x2c7c2c);
        break;
      case 'phone':
        p.rect(handR.x - 3, handR.y - 11, 6, 11, 0x202028);
        p.rect(handR.x - 2, handR.y - 10, 4, 8, 0x60a8f0);
        p.rect(handR.x - 1, handR.y - 9, 1, 2, 0xd8f0ff);
        break;
      case 'saw':
        p.rect(handR.x - 4, handR.y - 6, 9, 6, 0xd8a020);
        p.rect(handR.x + 5, handR.y - 4, 10, 2, 0xc8c8d0);
        for (let x = handR.x + 6; x < handR.x + 15; x += 2) p.set(x, handR.y - 2, 0x8c8c94);
        break;
      case 'loko':
        p.rect(handR.x - 3, handR.y - 14, 6, 14, 0x40c0a0);
        p.rect(handR.x - 3, handR.y - 10, 6, 3, 0xe040a0);
        p.rect(handR.x - 3, handR.y - 15, 6, 1, 0xc8c8d0);
        break;
      case 'crackpipe':
        p.rect(handR.x - 1, handR.y - 9, 2, 9, 0xd8e0e8);
        p.oval(handR.x - 2, handR.y - 12, 5, 4, 0xd8e0e8);
        p.rect(handR.x + 2, handR.y - 7, 4, 3, 0xe0c040);
        p.set(handR.x + 4, handR.y - 9, 0xf08030);
        break;
      case 'bindle':
        break;
    }
  }
  if (l.prop === 'bindle') {
    const sx = back ? cx - 16 : cx + 10;
    p.line(sx, torsoTop + 6, sx + (back ? -10 : 12), torsoTop - 18, 0x8c6034, 2);
    const kx = back ? sx - 18 : sx + 6;
    p.oval(kx, torsoTop - 26, 14, 12, 0xd03838);
    p.set(kx + 4, torsoTop - 22, WHITE);
    p.set(kx + 9, torsoTop - 19, WHITE);
    p.set(kx + 6, torsoTop - 16, WHITE);
  }
  if (back && l.prop === 'pigeon') p.oval(bx - 4, torsoTop - 7, 12, 9, 0x8c8c9c);
  if (back && l.prop === 'guitar') p.line(cx - 12, torsoTop - 6, cx + 6, torsoTop + 16, 0x6c4024, 3);

  p.shade(0.78, [INK, WHITE]);
  p.outline(INK);
  return p;
}

function drawCart(p: Pix, x: number, y: number) {
  const m = 0xa8b0b8;
  p.rect(x, y, 20, 14, darken(m, 0.6));
  p.rect(x + 1, y + 1, 18, 12, T_CLEAR);
  for (let i = x + 1; i < x + 20; i += 3) p.rect(i, y, 1, 14, m);
  for (let j = y + 1; j < y + 14; j += 3) p.rect(x, j, 20, 1, m);
  p.rect(x + 2, y - 4, 6, 5, 0xd03838); // junk
  p.rect(x + 9, y - 6, 7, 7, 0x5c7c9c);
  p.rect(x - 3, y - 2, 4, 2, m);
  p.rect(x + 1, y + 14, 18, 2, darken(m, 0.6));
  p.rect(x + 2, y + 16, 3, 3, INK);
  p.rect(x + 15, y + 16, 3, 3, INK);
}
const T_CLEAR = 0x3c3c40;

function drawCanBag(p: Pix, x: number, y: number) {
  p.oval(x, y, 18, 22, 0xd8dce8);
  const cans = [0xd03030, 0x3060c0, 0x40a040, 0xe8c040, 0xb0b0b8];
  for (let i = 0; i < 7; i++) p.rect(x + 3 + ((i * 5) % 12), y + 5 + Math.floor(i / 3) * 5, 3, 4, cans[i % cans.length]);
  p.rect(x + 7, y - 2, 4, 3, 0xd8dce8);
}

function drawTrashBag(p: Pix, x: number, y: number) {
  p.oval(x, y, 18, 20, 0x2c2c34);
  p.oval(x + 3, y + 3, 6, 6, 0x48485a);
  p.rect(x + 7, y - 3, 4, 4, 0x2c2c34);
}
