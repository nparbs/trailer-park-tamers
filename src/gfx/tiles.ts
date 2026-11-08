// Every map tile, drawn in code. Outdoor and indoor maps each use their own legend
// of single characters, so map files read like ASCII art.

import { Pix, darken, lighten } from './pixels';

export interface TileDef {
  ch: string;
  solid?: boolean;
  /** Random encounters happen here. */
  enc?: boolean;
  /** Ledge-like tiles you can only walk onto going down. */
  ledge?: boolean;
  draw: (p: Pix) => void;
}

const C = {
  grass: 0x80c858,
  grassD: 0x60a840,
  grassL: 0xa0e078,
  weed: 0x4c9a34,
  weedD: 0x2c6c20,
  weedL: 0x78c050,
  dirt: 0xd0b078,
  dirtD: 0xb09058,
  asph: 0x5c5c66,
  asphD: 0x4a4a52,
  asphL: 0x6c6c76,
  line: 0xe8d060,
  walk: 0xc0bcb0,
  walkD: 0x9c988c,
  wood: 0xa07848,
  woodD: 0x7c5830,
  ink: 0x282830,
};

// ---------- shared painters ----------
function grass(p: Pix, flowers = false) {
  p.rect(0, 0, 16, 16, C.grass);
  p.speckle(0, 0, 16, 16, C.grassD, 0.08, 3);
  p.speckle(0, 0, 16, 16, C.grassL, 0.05, 7);
  for (const [x, y] of [[3, 4], [11, 10], [7, 13]]) {
    p.set(x, y, C.grassD);
    p.set(x + 1, y - 1, C.grassD);
  }
  if (flowers) {
    for (const [x, y, c] of [[3, 3, 0xf8f8f8], [11, 6, 0xf8d040], [6, 11, 0xf8f8f8], [13, 13, 0xf08080]] as const) {
      p.set(x, y, c);
      p.set(x - 1, y, c);
      p.set(x + 1, y, c);
      p.set(x, y - 1, c);
      p.set(x, y + 1, c);
      p.set(x, y, 0xe8b020);
    }
  }
}
function dirt(p: Pix) {
  p.rect(0, 0, 16, 16, C.dirt);
  p.speckle(0, 0, 16, 16, C.dirtD, 0.1, 5);
  p.speckle(0, 0, 16, 16, lighten(C.dirt, 0.25), 0.05, 11);
}
function asphalt(p: Pix) {
  p.rect(0, 0, 16, 16, C.asph);
  p.speckle(0, 0, 16, 16, C.asphD, 0.12, 2);
  p.speckle(0, 0, 16, 16, C.asphL, 0.08, 9);
}
function sidewalk(p: Pix) {
  p.rect(0, 0, 16, 16, C.walk);
  p.speckle(0, 0, 16, 16, C.walkD, 0.05, 4);
  p.rect(0, 15, 16, 1, C.walkD);
  p.rect(15, 0, 1, 16, C.walkD);
}
function canopy(p: Pix, x: number, y: number, w: number, h: number, base: number) {
  p.oval(x, y, w, h, darken(base, 0.7));
  p.oval(x + 1, y, w - 2, h - 2, base);
  p.oval(x + 3, y + 1, w - 7, h - 7, lighten(base, 0.25));
}
function roofRibs(p: Pix, base: number) {
  p.rect(0, 0, 16, 16, base);
  for (let x = 1; x < 16; x += 4) p.rect(x, 0, 1, 16, darken(base, 0.85));
  p.rect(0, 0, 16, 1, darken(base, 0.6));
}
function siding(p: Pix, base: number, stripe?: number) {
  p.rect(0, 0, 16, 16, base);
  for (let y = 2; y < 13; y += 3) p.rect(0, y, 16, 1, darken(base, 0.88));
  if (stripe !== undefined) p.rect(0, 5, 16, 2, stripe);
  // skirting
  p.rect(0, 13, 16, 3, 0x6c6460);
  for (let x = 0; x < 16; x += 3) p.set(x, 14, 0x4c4440);
}
function windowPane(p: Pix, x: number, y: number, w: number, h: number, frame = 0xe8e8e8) {
  p.rect(x, y, w, h, frame);
  p.rect(x + 1, y + 1, w - 2, h - 2, 0x78a0c8);
  p.rect(x + 1, y + 1, Math.max(1, (w - 2) >> 1), 2, 0xb8d0e8);
  p.set(x + w - 3, y + h - 3, 0xb8d0e8);
}
function brick(p: Pix, base = 0xa85840) {
  p.rect(0, 0, 16, 16, base);
  const m = darken(base, 0.7);
  for (let y = 3; y < 16; y += 4) p.rect(0, y, 16, 1, m);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 4 : 0;
    for (let x = off; x < 16; x += 8) p.rect(x, row * 4, 1, 3, m);
  }
}
function flatRoof(p: Pix, base: number) {
  p.rect(0, 0, 16, 16, base);
  p.speckle(0, 0, 16, 16, darken(base, 0.85), 0.12, 6);
  p.rect(0, 15, 16, 1, darken(base, 0.6));
}
function shingles(p: Pix, base: number) {
  p.rect(0, 0, 16, 16, base);
  for (let y = 0; y < 16; y += 4) {
    p.rect(0, y + 3, 16, 1, darken(base, 0.7));
    for (let x = (y / 4) % 2 ? 2 : 6; x < 16; x += 8) p.rect(x, y, 1, 3, darken(base, 0.8));
  }
}
function woodWall(p: Pix, base: number) {
  p.rect(0, 0, 16, 16, base);
  for (let x = 0; x < 16; x += 4) p.rect(x, 0, 1, 16, darken(base, 0.75));
  p.speckle(0, 0, 16, 16, darken(base, 0.85), 0.06, 8);
  p.rect(0, 14, 16, 2, darken(base, 0.55));
}

// ---------- outdoor legend ----------
export const OUTDOOR: TileDef[] = [
  { ch: '.', draw: (p) => grass(p) },
  { ch: ',', draw: (p) => grass(p, true) },
  {
    // Encampment ground: flattened cardboard, tarp scraps and empties. Drifters live here.
    ch: '"', enc: true, draw: (p) => {
      dirt(p);
      p.speckle(0, 0, 16, 16, 0x9c7c50, 0.06, 21);
      p.rect(2, 3, 8, 6, 0xc09868);
      p.rect(2, 3, 8, 1, 0xa07848);
      p.rect(3, 5, 3, 1, 0xa07848);
      p.rect(11, 11, 2, 3, 0x5c8c3c);
      p.rect(11, 10, 2, 1, 0xd8d0b0);
      p.set(6, 13, 0xd04040);
      p.set(13, 4, 0xe8d050);
    },
  },
  {
    // Trash heap ground behind the dumpsters. Also full of drifters.
    ch: 'n', enc: true, draw: (p) => {
      asphalt(p);
      p.oval(0, 6, 8, 8, 0x2c2c34);
      p.oval(8, 1, 8, 8, 0x34343c);
      p.set(2, 8, 0x5c5c68);
      p.set(11, 3, 0x5c5c68);
      p.rect(9, 11, 4, 3, 0xd8c8a0);
      p.rect(3, 2, 3, 2, 0xd04040);
      p.rect(12, 12, 2, 2, 0x40a0d0);
      p.set(7, 14, 0xe8e0c0);
    },
  },
  {
    ch: 'u', solid: true, draw: (p) => {
      dirt(p);
      p.trap(2, 12, 7, 8, 0, 15, 0x3c70c0);
      p.trap(2, 12, 7, 8, 5, 10, 0x2c5090);
      p.rect(6, 9, 4, 5, 0x1c2c48);
      p.line(8, 1, 8, 2, 0x8c6c4c);
    },
  },
  {
    ch: 'v', solid: true, draw: (p) => {
      dirt(p);
      p.oval(0, 3, 16, 14, 0xe08030);
      p.rect(0, 10, 16, 6, 0xb88050);
      p.oval(1, 3, 14, 13, 0xe08030);
      p.oval(5, 8, 6, 7, 0x6c3c18);
      p.line(2, 9, 8, 3, 0xf0a050);
    },
  },
  {
    ch: 'a', solid: true, draw: (p) => {
      dirt(p);
      p.rect(1, 4, 14, 11, 0xc8a070);
      p.rect(1, 4, 14, 2, 0xa88050);
      p.rect(0, 2, 16, 3, 0x4c8c4c);
      p.rect(5, 8, 6, 7, 0x3c2c1c);
      p.rect(2, 7, 2, 2, 0x987040);
    },
  },
  { ch: 'C', draw: (p) => { asphalt(p); for (let y = 1; y < 16; y += 4) p.rect(1, y, 14, 2, 0xe8e8e8); } },
  { ch: 'I', draw: (p) => { asphalt(p); for (let x = 1; x < 16; x += 4) p.rect(x, 1, 2, 14, 0xe8e8e8); } },
  { ch: ':', draw: dirt },
  { ch: '=', draw: asphalt },
  { ch: '-', draw: (p) => { asphalt(p); p.rect(3, 15, 10, 1, C.line); } },
  { ch: '|', draw: (p) => { asphalt(p); p.rect(15, 3, 1, 10, C.line); } },
  { ch: '_', draw: sidewalk },
  {
    ch: 'T', solid: true, draw: (p) => {
      grass(p);
      p.rect(6, 10, 4, 6, 0x6c4c2c);
      p.rect(6, 10, 1, 6, 0x4c3418);
      canopy(p, 0, 0, 16, 13, 0x3c8030);
    },
  },
  { ch: 'b', solid: true, draw: (p) => { grass(p); canopy(p, 1, 4, 14, 11, 0x4c9038); } },
  {
    ch: '#', solid: true, draw: (p) => {
      grass(p);
      p.rect(0, 3, 16, 1, 0x707078);
      p.rect(0, 13, 16, 1, 0x707078);
      for (let i = -8; i < 16; i += 3) {
        p.line(i, 13, i + 9, 4, 0xa8a8b0);
        p.line(i + 9, 13, i, 4, 0x8c8c94);
      }
      p.rect(1, 2, 2, 13, 0x606068);
      p.rect(1, 2, 1, 13, 0x8c8c94);
    },
  },
  {
    ch: '~', solid: true, draw: (p) => {
      p.rect(0, 0, 16, 16, 0x5c7048);
      p.speckle(0, 0, 16, 16, 0x6c8458, 0.15, 12);
      p.rect(2, 4, 4, 1, 0x8ca070);
      p.rect(9, 10, 5, 1, 0x8ca070);
      p.rect(11, 3, 2, 2, 0xc8c8c0); // floating cup
    },
  },
  {
    ch: '%', solid: true, draw: (p) => {
      dirt(p);
      p.oval(1, 6, 9, 9, 0x303038);
      p.oval(6, 3, 9, 10, 0x3c3c48);
      p.oval(3, 2, 6, 6, 0x484858);
      p.set(5, 3, 0x6c6c7c);
      p.set(10, 5, 0x6c6c7c);
      p.rect(9, 11, 4, 3, 0xd04030); // soda box
      p.rect(2, 12, 3, 2, 0xe0e0d0);
    },
  },
  {
    ch: 'D', solid: true, draw: (p) => {
      asphalt(p);
      p.rect(1, 3, 14, 12, 0x2c6040);
      p.rect(1, 3, 14, 3, 0x3c7c54);
      p.rect(1, 6, 14, 1, 0x1c4028);
      p.rect(3, 9, 10, 1, 0x245034);
      p.rect(2, 14, 2, 2, 0x202020);
      p.rect(12, 14, 2, 2, 0x202020);
      p.set(6, 4, 0xd8d0c0);
    },
  },
  {
    ch: 'c', solid: true, draw: (p) => {
      grass(p);
      p.rect(0, 4, 16, 10, 0xa0603c);
      p.rect(0, 4, 16, 4, 0x8c4c2c);
      p.rect(0, 4, 2, 10, 0x7c4024);
      p.rect(14, 4, 2, 10, 0x7c4024);
      for (let x = 3; x < 14; x += 4) p.rect(x, 8, 1, 6, 0xc08050);
      p.rect(5, 10, 3, 2, 0xe8d8a0); // stuffing
    },
  },
  {
    ch: 'o', solid: true, draw: (p) => {
      grass(p);
      p.oval(2, 3, 12, 12, 0x282828);
      p.oval(5, 6, 6, 6, 0x5c7848);
      p.set(4, 6, 0x484848);
    },
  },
  {
    ch: 'S', solid: true, draw: (p) => {
      grass(p);
      p.rect(7, 9, 2, 7, C.woodD);
      p.rect(2, 2, 12, 8, C.wood);
      p.rect(2, 9, 12, 1, C.woodD);
      p.rect(4, 4, 8, 1, C.woodD);
      p.rect(4, 6, 6, 1, C.woodD);
    },
  },
  {
    ch: '+', draw: (p) => {
      p.rect(0, 0, 16, 16, 0x8c8478);
      p.speckle(0, 0, 16, 16, 0x6c6458, 0.2, 13);
      for (let x = 1; x < 16; x += 5) p.rect(x, 1, 3, 14, 0x6c4c30);
      p.rect(0, 3, 16, 2, 0x9c9ca4);
      p.rect(0, 11, 16, 2, 0x9c9ca4);
      p.rect(0, 4, 16, 1, 0x5c5c64);
      p.rect(0, 12, 16, 1, 0x5c5c64);
    },
  },
  {
    ch: 'X', solid: true, draw: (p) => {
      asphalt(p);
      p.rect(1, 9, 2, 7, 0xd8d8d8);
      p.rect(13, 9, 2, 7, 0xd8d8d8);
      p.rect(0, 5, 16, 5, 0xf0d020);
      for (let x = -4; x < 16; x += 5) p.line(x, 9, x + 4, 5, C.ink, 2);
    },
  },
  {
    ch: 'P', solid: true, draw: (p) => {
      grass(p);
      p.rect(8, 10, 1, 6, 0x303030);
      p.oval(4, 6, 8, 5, 0xf080a8);
      p.rect(9, 1, 2, 7, 0xf080a8);
      p.rect(10, 1, 3, 2, 0xf080a8);
      p.set(13, 2, 0x303030);
      p.set(10, 2, 0x303030);
    },
  },
  {
    ch: 'F', solid: true, draw: (p) => {
      dirt(p);
      p.rect(3, 5, 10, 11, 0x8c4c2c);
      p.rect(3, 8, 10, 1, 0x6c3018);
      p.rect(3, 12, 10, 1, 0x6c3018);
      p.rect(3, 5, 10, 2, 0x303030);
      p.oval(4, 0, 8, 7, 0xf08020);
      p.oval(6, 1, 4, 5, 0xf8d040);
    },
  },
  {
    ch: 'q', solid: true, draw: (p) => {
      grass(p);
      p.rect(1, 2, 15, 13, 0x8c5c3c);
      p.rect(4, 4, 6, 9, 0x405058);
      p.rect(5, 5, 2, 2, 0x708090);
      p.rect(1, 2, 15, 1, 0x6c3c24);
      p.rect(2, 13, 3, 3, 0x282828);
      p.speckle(1, 2, 15, 13, 0xa86c34, 0.1, 21);
    },
  },
  {
    ch: 'p', solid: true, draw: (p) => {
      grass(p);
      p.rect(0, 2, 14, 13, 0x8c5c3c);
      p.rect(2, 4, 5, 9, 0x405058);
      p.rect(0, 2, 14, 1, 0x6c3c24);
      p.rect(10, 13, 3, 3, 0x282828);
      p.rect(12, 5, 2, 3, 0xe8e0a0);
      p.speckle(0, 2, 14, 13, 0xa86c34, 0.1, 22);
    },
  },
  // Trailer, white with a teal stripe.
  { ch: 'R', solid: true, draw: (p) => roofRibs(p, 0xd8d4c8) },
  { ch: 'w', solid: true, draw: (p) => siding(p, 0xece4d4, 0x40a0a0) },
  { ch: 'W', solid: true, draw: (p) => { siding(p, 0xece4d4, 0x40a0a0); windowPane(p, 3, 2, 10, 9); } },
  {
    ch: 'd', draw: (p) => {
      siding(p, 0xece4d4, 0x40a0a0);
      p.rect(3, 1, 10, 13, 0xa89c88);
      p.rect(4, 2, 8, 4, 0x78a0c8);
      p.set(10, 8, 0xe8c040);
      p.rect(2, 13, 12, 3, 0x8c8478);
      p.rect(2, 13, 12, 1, 0xb0a898);
    },
  },
  // Trailer, rusty tan.
  { ch: 'Q', solid: true, draw: (p) => { roofRibs(p, 0xb8a088); p.speckle(0, 0, 16, 16, 0x9c6c40, 0.1, 17); } },
  { ch: 'y', solid: true, draw: (p) => { siding(p, 0xd8c098, 0x8c5c3c); p.speckle(0, 0, 16, 12, 0xa87c4c, 0.05, 31); } },
  { ch: 'Y', solid: true, draw: (p) => { siding(p, 0xd8c098, 0x8c5c3c); windowPane(p, 3, 2, 10, 9, 0xc8b088); p.line(4, 4, 11, 9, 0xf8f8f8); } },
  {
    ch: 'e', draw: (p) => {
      siding(p, 0xd8c098, 0x8c5c3c);
      p.rect(3, 1, 10, 13, 0x8c6c4c);
      p.rect(4, 2, 8, 4, 0x605040);
      p.set(10, 8, 0xc8c8c8);
      p.rect(2, 13, 12, 3, 0x6c4c30);
    },
  },
  // Brick buildings.
  { ch: 'A', solid: true, draw: (p) => flatRoof(p, 0x585460) },
  { ch: 'B', solid: true, draw: (p) => brick(p) },
  { ch: 'N', solid: true, draw: (p) => { brick(p); windowPane(p, 2, 2, 12, 10, 0xd8d0c0); } },
  {
    ch: 'E', draw: (p) => {
      brick(p);
      p.rect(2, 0, 12, 16, 0xc8c8d0);
      p.rect(3, 1, 10, 15, 0x6890b8);
      p.rect(7, 1, 2, 15, 0xc8c8d0);
      p.rect(4, 2, 2, 5, 0xa8c8e8);
    },
  },
  { ch: 'h', solid: true, draw: (p) => { flatRoof(p, 0xc04040); p.rect(0, 0, 16, 2, 0xe06060); } },
  { ch: 'j', solid: true, draw: (p) => { flatRoof(p, 0x3c64b0); p.rect(0, 0, 16, 2, 0x5c84d0); } },
  {
    ch: 'k', solid: true, draw: (p) => {
      brick(p);
      p.rect(1, 2, 14, 11, 0xf0e8d8);
      p.oval(3, 6, 10, 6, 0xc04040);
      p.rect(3, 6, 10, 2, 0xc04040);
      p.rect(5, 3, 1, 3, 0xd0d0d0);
      p.rect(8, 2, 1, 4, 0xd0d0d0);
      p.rect(11, 3, 1, 3, 0xd0d0d0);
    },
  },
  {
    ch: 'g', solid: true, draw: (p) => {
      brick(p);
      p.rect(1, 2, 14, 11, 0xf0e8d8);
      p.rect(4, 4, 6, 8, 0x3c64b0);
      p.rect(5, 5, 4, 2, 0xe0f0ff);
      p.rect(10, 6, 2, 1, 0x282828);
      p.rect(11, 6, 1, 5, 0x282828);
    },
  },
  { ch: 'M', solid: true, draw: (p) => { flatRoof(p, 0x7c4cb0); p.rect(0, 0, 16, 2, 0x9c6cd0); } },
  {
    ch: 'G', solid: true, draw: (p) => {
      brick(p);
      p.rect(1, 2, 14, 11, 0x202028);
      p.rect(2, 6, 12, 3, 0xe8c040);
      p.rect(3, 9, 2, 2, 0xe8e8e8);
      p.rect(11, 9, 2, 2, 0xe8e8e8);
      p.rect(3, 4, 10, 1, 0xf060a0);
    },
  },
  // Trap house.
  { ch: 'Z', solid: true, draw: (p) => shingles(p, 0x4c4048) },
  { ch: 'H', solid: true, draw: (p) => woodWall(p, 0x8c8478) },
  {
    ch: 'J', solid: true, draw: (p) => {
      woodWall(p, 0x8c8478);
      p.rect(2, 2, 12, 10, 0x202020);
      p.rect(1, 3, 14, 2, 0xb08c58);
      p.rect(1, 8, 14, 2, 0xb08c58);
      p.line(2, 11, 13, 2, 0xa07c48, 2);
    },
  },
  {
    ch: 'O', draw: (p) => {
      woodWall(p, 0x8c8478);
      p.rect(3, 1, 10, 15, 0x5c4030);
      p.rect(3, 1, 10, 1, 0x3c2818);
      p.rect(4, 5, 8, 1, 0x4c3020);
      p.set(11, 9, 0xc8c8c8);
      p.rect(5, 3, 3, 1, 0xf0f0f0); // eyehole
    },
  },
  {
    ch: 'L', solid: true, draw: (p) => {
      sidewalk(p);
      p.rect(4, 2, 8, 13, 0xc84040);
      p.rect(5, 3, 6, 4, 0x283038);
      p.rect(6, 4, 3, 1, 0x60e060);
      p.rect(12, 6, 2, 6, 0x303030);
      p.rect(4, 14, 8, 2, 0x606060);
    },
  },
  {
    ch: 'l', solid: true, draw: (p) => {
      sidewalk(p);
      p.rect(7, 3, 2, 13, 0x50505a);
      p.rect(4, 0, 8, 3, 0x50505a);
      p.rect(5, 2, 6, 1, 0xf8f0a0);
    },
  },
  {
    ch: 'm', solid: true, draw: (p) => {
      grass(p);
      p.rect(7, 8, 2, 8, C.woodD);
      p.rect(3, 3, 10, 6, 0x6c7c8c);
      p.rect(3, 3, 10, 2, 0x8c9cac);
      p.rect(12, 1, 1, 4, 0xd04040);
      p.rect(12, 1, 2, 2, 0xd04040);
    },
  },
  {
    ch: 'f', solid: true, draw: (p) => {
      sidewalk(p);
      p.rect(5, 5, 6, 10, 0xd84030);
      p.rect(4, 4, 8, 2, 0xe85040);
      p.rect(3, 8, 10, 2, 0xd84030);
      p.rect(6, 3, 4, 1, 0xb83020);
    },
  },
  {
    ch: 't', solid: true, draw: (p) => {
      sidewalk(p);
      p.rect(4, 4, 8, 11, 0x5c6c5c);
      p.rect(3, 3, 10, 2, 0x4c5c4c);
      for (let x = 5; x < 12; x += 2) p.rect(x, 6, 1, 8, 0x4c5c4c);
      p.set(6, 2, 0xe0e0d0);
    },
  },
  {
    ch: 'x', solid: true, draw: (p) => {
      asphalt(p);
      p.rect(2, 4, 11, 8, 0xb0b8c0);
      for (let x = 3; x < 13; x += 2) p.rect(x, 5, 1, 6, 0x707880);
      p.rect(2, 4, 11, 1, 0xd0d8e0);
      p.rect(12, 2, 3, 2, 0xd04040);
      p.rect(3, 13, 2, 2, 0x202020);
      p.rect(10, 13, 2, 2, 0x202020);
    },
  },
  {
    ch: 'i', draw: (p) => {
      grass(p);
      p.rect(3, 9, 3, 2, 0xc8c8c0);
      p.rect(10, 4, 2, 3, 0xc04040);
      p.set(12, 12, 0xe8d050);
    },
  },
];

// ---------- indoor legend ----------
function lino(p: Pix) {
  p.rect(0, 0, 16, 16, 0xd8d0b8);
  p.rect(0, 0, 8, 8, 0xc8c0a4);
  p.rect(8, 8, 8, 8, 0xc8c0a4);
}
function woodFloor(p: Pix) {
  p.rect(0, 0, 16, 16, 0xb08050);
  for (let y = 3; y < 16; y += 4) p.rect(0, y, 16, 1, 0x8c6038);
  p.rect(5, 0, 1, 3, 0x8c6038);
  p.rect(12, 4, 1, 3, 0x8c6038);
  p.rect(3, 8, 1, 3, 0x8c6038);
  p.rect(10, 12, 1, 3, 0x8c6038);
}
function carpet(p: Pix) {
  p.rect(0, 0, 16, 16, 0x8c7c6c);
  p.speckle(0, 0, 16, 16, 0x7c6c5c, 0.25, 41);
  p.oval(9, 9, 5, 3, 0x6c5c4c); // stain
}
function wallpaper(p: Pix) {
  p.rect(0, 0, 16, 16, 0xd8c8a0);
  for (let x = 2; x < 16; x += 4) p.rect(x, 0, 1, 12, 0xc8b890);
  p.rect(0, 12, 16, 4, 0x8c6c4c);
  p.rect(0, 12, 16, 1, 0x6c4c30);
  p.speckle(0, 0, 16, 12, 0xb8a078, 0.04, 51);
}

export const INDOOR: TileDef[] = [
  { ch: '.', draw: lino },
  { ch: ',', draw: woodFloor },
  { ch: '-', draw: carpet },
  { ch: 'r', draw: (p) => { lino(p); p.rect(0, 2, 16, 12, 0x8c3c3c); p.rect(1, 3, 14, 10, 0xa84c4c); p.rect(3, 5, 10, 6, 0xc8a050); } },
  { ch: '@', solid: true, draw: (p) => p.rect(0, 0, 16, 16, 0x101014) },
  { ch: '#', solid: true, draw: wallpaper },
  { ch: 'w', solid: true, draw: (p) => { wallpaper(p); windowPane(p, 3, 2, 10, 8, 0xe8e0c8); } },
  { ch: 'M', draw: (p) => { lino(p); p.rect(2, 4, 12, 10, 0x8c3c3c); p.rect(3, 5, 10, 8, 0xa85050); p.rect(5, 8, 6, 1, 0x8c3c3c); } },
  {
    ch: 'B', solid: true, draw: (p) => {
      lino(p);
      p.rect(1, 0, 14, 16, 0x6c4c30);
      p.rect(2, 1, 12, 14, 0xe8e8f0);
      p.rect(3, 2, 10, 4, 0xf8f8ff);
      p.rect(2, 7, 12, 8, 0x4c6cb0);
      p.rect(2, 7, 12, 1, 0x6c8cd0);
    },
  },
  {
    ch: 'V', solid: true, draw: (p) => {
      carpet(p);
      p.rect(1, 4, 14, 9, 0x5c4c3c);
      p.rect(2, 5, 9, 7, 0x304050);
      p.rect(3, 6, 3, 2, 0x7898a8);
      p.rect(12, 6, 2, 2, 0xc0c0c0);
      p.rect(12, 9, 2, 2, 0xc0c0c0);
      p.line(5, 4, 3, 1, 0x909090);
      p.line(8, 4, 10, 1, 0x909090);
      p.rect(2, 13, 2, 2, 0x3c2c1c);
      p.rect(12, 13, 2, 2, 0x3c2c1c);
    },
  },
  { ch: 'K', solid: true, draw: (p) => { lino(p); p.rect(0, 2, 16, 14, 0xa08060); p.rect(0, 2, 16, 4, 0xe0dcd0); p.rect(0, 6, 16, 1, 0x806040); p.rect(3, 9, 4, 5, 0x8c6c4c); p.rect(9, 9, 4, 5, 0x8c6c4c); } },
  { ch: 'S', solid: true, draw: (p) => { lino(p); p.rect(1, 2, 14, 14, 0xe8e8e8); p.rect(2, 3, 5, 4, 0x303030); p.rect(9, 3, 5, 4, 0x303030); p.rect(3, 9, 10, 6, 0x404040); p.rect(4, 10, 8, 1, 0x808080); } },
  { ch: 'F', solid: true, draw: (p) => { lino(p); p.rect(2, 0, 12, 16, 0xf0f0e8); p.rect(2, 6, 12, 1, 0xb8b8b0); p.rect(11, 2, 1, 3, 0x909090); p.rect(11, 8, 1, 4, 0x909090); p.rect(4, 2, 3, 3, 0xe0b040); } },
  { ch: 't', solid: true, draw: (p) => { lino(p); p.rect(1, 3, 14, 9, 0x9c6c3c); p.rect(1, 3, 14, 2, 0xb88850); p.rect(2, 12, 2, 4, 0x6c4c2c); p.rect(12, 12, 2, 4, 0x6c4c2c); p.rect(5, 5, 4, 3, 0xe8e8e8); } },
  { ch: 'c', solid: true, draw: (p) => { carpet(p); p.rect(0, 3, 16, 12, 0x6c8c4c); p.rect(0, 3, 16, 5, 0x5c7c3c); p.rect(0, 3, 2, 12, 0x4c6c2c); p.rect(14, 3, 2, 12, 0x4c6c2c); p.rect(7, 8, 1, 7, 0x4c6c2c); } },
  { ch: 'Z', solid: true, draw: (p) => {
      p.rect(0, 0, 16, 16, 0x8c7c6c);
      p.rect(0, 0, 16, 16, 0x9c8c78);
      for (let y = 4; y < 16; y += 5) p.rect(0, y, 16, 1, 0x5c4c3c);
      const goods = [0xd04040, 0xe8c040, 0x40a0d0, 0x60c060, 0xf0f0f0, 0xd080c0];
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) p.rect(1 + i * 3, r * 5 + 1, 2, 3, goods[(i + r * 2) % goods.length]);
    } },
  { ch: 'z', solid: true, draw: (p) => { lino(p); p.rect(0, 1, 16, 15, 0x6c5c8c); p.rect(0, 1, 16, 4, 0xd8d8e0); p.rect(0, 5, 16, 1, 0x4c3c6c); } },
  { ch: '$', solid: true, draw: (p) => { lino(p); p.rect(0, 1, 16, 15, 0x6c5c8c); p.rect(0, 1, 16, 4, 0xd8d8e0); p.rect(0, 5, 16, 1, 0x4c3c6c); p.rect(4, 0, 8, 4, 0x404048); p.rect(5, 1, 6, 1, 0x60e060); } },
  { ch: 'P', solid: true, draw: (p) => { lino(p); p.rect(0, 2, 16, 14, 0xb0b0b8); p.rect(0, 2, 16, 4, 0xd8d8e0); p.oval(3, 0, 10, 6, 0x707078); p.oval(4, 0, 8, 3, 0xc8a050); p.rect(7, 0, 1, 2, 0xe8e8e8); } },
  { ch: 'm', solid: true, draw: (p) => { woodFloor(p); p.rect(1, 2, 14, 12, 0xc8c0a0); p.rect(1, 2, 14, 1, 0xe0d8b8); p.oval(4, 5, 6, 4, 0xa89870); p.oval(9, 9, 4, 3, 0xa89870); } },
  { ch: 'x', solid: true, draw: (p) => { woodFloor(p); p.rect(1, 6, 10, 8, 0xd8b880); p.rect(1, 6, 10, 1, 0xb89860); p.rect(5, 3, 10, 7, 0xe0c890); p.rect(6, 4, 3, 2, 0xc04040); p.rect(3, 12, 4, 3, 0x40a0d0); } },
  { ch: 'p', solid: true, draw: (p) => { lino(p); p.rect(5, 10, 6, 6, 0xb06040); p.oval(2, 1, 12, 10, 0x3c8030); p.oval(4, 2, 6, 5, 0x5ca048); } },
  { ch: 'C', solid: true, draw: (p) => { lino(p); p.rect(4, 2, 8, 6, 0x9c6c3c); p.rect(4, 8, 8, 3, 0xb88850); p.rect(4, 11, 1, 5, 0x6c4c2c); p.rect(11, 11, 1, 5, 0x6c4c2c); } },
  {
    ch: 'G', solid: true, draw: (p) => {
      woodFloor(p);
      p.rect(0, 0, 16, 2, 0xf8e8a0);
      p.rect(4, 11, 8, 5, 0x6c4c2c);
      for (const [dx, dy] of [[0, -9], [-5, -6], [5, -6], [-6, -1], [6, -1], [-3, -4], [3, -4]]) p.line(8, 11, 8 + dx, 11 + dy, 0x3c9c3c, 2);
      p.rect(7, 3, 2, 8, 0x2c7c2c);
    },
  },
  { ch: 'g', solid: true, draw: (p) => { woodFloor(p); p.rect(3, 8, 10, 8, 0x6c4c2c); p.rect(3, 8, 10, 2, 0x4c3018); p.rect(4, 9, 8, 1, 0x3c2810); } },
  {
    ch: 'H', solid: true, draw: (p) => {
      lino(p);
      p.rect(0, 5, 16, 11, 0x8c8c94);
      p.rect(0, 5, 16, 3, 0xb8b8c0);
      p.trap(0, 6, 3, 4, 1, 6, 0xc8e8f0);
      p.rect(1, 3, 6, 3, 0x40a0e8);
      p.rect(9, 1, 3, 5, 0xc8e8f0);
      p.rect(9, 3, 3, 3, 0x60d060);
      p.rect(13, 2, 2, 4, 0xe8d040);
    },
  },
  { ch: 'U', solid: true, draw: (p) => { wallpaper(p); for (let i = 0; i < 3; i++) { p.rect(1 + i * 5, 1, 4, 11, [0xd04040, 0x40a0d0, 0xe8c040][i]); p.rect(1 + i * 5, 3, 4, 1, 0x202020); p.rect(1 + i * 5, 9, 4, 1, 0x202020); } } },
  { ch: 'I', solid: true, draw: (p) => { lino(p); p.rect(3, 2, 10, 14, 0xd8d8e0); p.rect(3, 2, 10, 2, 0xb8b8c0); p.rect(5, 0, 6, 2, 0x8c8c94); p.rect(4, 7, 8, 3, 0xd04040); } },
  { ch: 'L', solid: true, draw: (p) => { lino(p); p.rect(1, 6, 14, 10, 0x9c6c3c); p.rect(3, 0, 10, 8, 0xd0d0c8); p.rect(4, 1, 8, 5, 0x3c5c8c); p.rect(5, 2, 3, 1, 0x80c0f0); p.rect(4, 7, 8, 1, 0xa0a098); } },
];

export function tileIndex(legend: TileDef[]) {
  const m = new Map<string, number>();
  legend.forEach((t, i) => m.set(t.ch, i));
  return m;
}

export function buildTileset(legend: TileDef[]): HTMLCanvasElement {
  const all = new Pix(16 * legend.length, 16);
  legend.forEach((t, i) => {
    const p = new Pix(16, 16);
    t.draw(p);
    all.blit(p, i * 16, 0);
  });
  return all.toCanvas();
}
