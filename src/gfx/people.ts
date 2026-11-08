// Overworld character sprites: 16x16, three frames per direction (stand, step, step).
// Frame order in the sheet: down0 down1 down2 up0 up1 up2 left0 left1 left2.
// Right-facing frames are the left ones flipped.

import { Pix, darken } from './pixels';

export interface WalkerLook {
  skin: number;
  hair: number;
  top: number;
  pants: number;
  shoes?: number;
  /** If set, the top of the head is a hat in this colour. */
  hat?: number;
  bald?: boolean;
  beard?: number;
}

const HEAD_DOWN = [
  '................',
  '....oooooooo....',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..ohhhhhhhhhho..',
  '..ohssssssssho..',
  '..ossessssesso..',
  '..ossssssssssO..',
  '...oossbbssoo...',
];
const HEAD_UP = [
  '................',
  '....oooooooo....',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..oshhhhhhhhso..',
  '...oosssssso....',
];
const HEAD_LEFT = [
  '................',
  '....oooooooo....',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..ohhhhhhhhhho..',
  '..osssshhhhhho..',
  '..osesshhhhhho..',
  '..obssshhhhhho..',
  '...oobsssooo....',
];

const BODY_DOWN = [
  ['...otttttttto...', '..osttttttttso..', '..osttttttttso..', '...oppppppppo...', '....oppooppo....', '....okkookko....', '................'],
  ['...otttttttto...', '..osttttttttto..', '..osttttttttso..', '...oppppppppo...', '....oppooppo....', '....okkoo.......', '................'],
  ['...otttttttto...', '..ottttttttso...', '..osttttttttso..', '...oppppppppo...', '....oppooppo....', '.......ookko....', '................'],
];
const BODY_UP = BODY_DOWN;
const BODY_LEFT = [
  ['....otttttto....', '....ottstto.....', '....otttttto....', '....oppppppo....', '....oppppppo....', '....okkkkkko....', '................'],
  ['....otttttto....', '...ostttttto....', '....otttttto....', '....oppppppo....', '...oppo..oppo...', '...okko..okko...', '................'],
  ['....otttttto....', '....otttttsto...', '....otttttto....', '....oppppppo....', '...oppo..oppo...', '...okko..okko...', '................'],
];

function frame(head: string[], body: string[], pal: Record<string, number>, bob: number) {
  const p = new Pix(16, 16);
  p.stamp(0, bob, head, pal);
  p.stamp(0, 9 + bob, body.slice(0, 7 - bob), pal);
  return p;
}

export function walkerFrames(l: WalkerLook): Pix[] {
  const hatC = l.hat ?? l.hair;
  const pal: Record<string, number> = {
    o: 0x282830,
    O: 0x282830,
    H: l.bald ? l.skin : hatC,
    h: l.bald ? l.skin : l.hat !== undefined ? darken(l.hat, 0.75) : l.hair,
    s: l.skin,
    e: 0x202028,
    b: l.beard ?? l.skin,
    t: l.top,
    p: l.pants,
    k: l.shoes ?? 0x383838,
  };
  const out: Pix[] = [];
  for (let i = 0; i < 3; i++) out.push(frame(HEAD_DOWN, BODY_DOWN[i], pal, i === 0 ? 0 : 1));
  for (let i = 0; i < 3; i++) out.push(frame(HEAD_UP, BODY_UP[i], pal, i === 0 ? 0 : 1));
  for (let i = 0; i < 3; i++) out.push(frame(HEAD_LEFT, BODY_LEFT[i], pal, i === 0 ? 0 : 1));
  return out;
}

/** The six looks a player can pick. Index 0 matches the original hero. */
export const OUTFIT_LOOKS: { name: string; look: WalkerLook }[] = [
  { name: 'RED CAP', look: { skin: 0xf0c8a0, hair: 0x5c3c20, hat: 0xd03838, top: 0xf0f0f0, pants: 0x3c5c9c, shoes: 0xd03838 } },
  { name: 'BLUE CAP', look: { skin: 0xa86c40, hair: 0x202020, hat: 0x3c64c8, top: 0x303038, pants: 0x6c6c78, shoes: 0xf0f0f0 } },
  { name: 'BEANIE', look: { skin: 0xf0d0b0, hair: 0xc08040, hat: 0x3c8c4c, top: 0xb04040, pants: 0x3c4c6c } },
  { name: 'PINK HAIR', look: { skin: 0xf0c8a0, hair: 0xf080b8, top: 0x7c4cb0, pants: 0x303038, shoes: 0xf0f0f0 } },
  { name: 'MULLET', look: { skin: 0xe8b088, hair: 0xe8c860, top: 0x5c7cb0, pants: 0x3c5488, beard: 0xc8a850 } },
  { name: 'HOODIE', look: { skin: 0x6c4428, hair: 0x202020, hat: 0xe08030, top: 0xe08030, pants: 0x404040 } },
];

/** Overworld sprite looks for the cast. */
export const WALKERS: Record<string, WalkerLook> = {
  player: { skin: 0xf0c8a0, hair: 0x5c3c20, hat: 0xd03838, top: 0xf0f0f0, pants: 0x3c5c9c, shoes: 0xd03838 },
  mom: { skin: 0xf0c8a0, hair: 0xe0c060, top: 0xd080b0, pants: 0x6c8cc8 },
  dale: { skin: 0xe0a880, hair: 0x9c9c9c, hat: 0x3c6c3c, top: 0xe8e8e8, pants: 0x4c5c8c, beard: 0x9c9c9c },
  rival: { skin: 0xf0c8a0, hair: 0xe8d070, top: 0x3c3c3c, pants: 0x6c5c4c, hat: 0xe08030 },
  hick: { skin: 0xe8b088, hair: 0x6c4c2c, hat: 0xc8c0a0, top: 0x7c9c5c, pants: 0x4c5c8c },
  granny: { skin: 0xf0d0b0, hair: 0xd8d8e0, top: 0x8c6cb0, pants: 0x8c6cb0 },
  bum: { skin: 0xd8a070, hair: 0x6c5c4c, top: 0x6c5c3c, pants: 0x4c4c4c, beard: 0x6c5c4c },
  bum2: { skin: 0xa86c40, hair: 0x302820, hat: 0x4c6a5a, top: 0x4c4c5c, pants: 0x3c3c3c, beard: 0x302820 },
  thug: { skin: 0x8c5c38, hair: 0x202020, hat: 0x202020, top: 0xe0e0e0, pants: 0x3c4c6c },
  thug2: { skin: 0xd8a070, hair: 0x202020, top: 0xc03030, pants: 0x303030, bald: true },
  tony: { skin: 0xd8a070, hair: 0x202020, top: 0x7c2c8c, pants: 0x202020, shoes: 0xe8c040, beard: 0x202020 },
  cop: { skin: 0xe0a880, hair: 0x303030, hat: 0x2c3c6c, top: 0x3c4c8c, pants: 0x2c3c6c },
  clerk: { skin: 0xf0c8a0, hair: 0x9c3c2c, top: 0x3c64b0, pants: 0x404040 },
  nun: { skin: 0xf0c8a0, hair: 0x202028, hat: 0x202028, top: 0x202028, pants: 0x202028 },
  kid: { skin: 0xa86c40, hair: 0x202020, top: 0xe0c040, pants: 0x4c6cb0 },
  preacher: { skin: 0x6c4428, hair: 0x302820, top: 0x302830, pants: 0x282830, beard: 0x302820 },
  skater: { skin: 0xf0c8a0, hair: 0x60c0e0, top: 0x303030, pants: 0x8c8c6c },
  slumlord: { skin: 0xe0b088, hair: 0x5c5c5c, top: 0x8c6c3c, pants: 0x5c4c34, shoes: 0x3c2c1c, beard: 0x5c5c5c },
  super: { skin: 0xc8946c, hair: 0x302820, hat: 0x3c5c8c, top: 0x5c6c7c, pants: 0x3c3c48, beard: 0x302820 },
  juggalo: { skin: 0xf0f0f0, hair: 0x202020, top: 0x3c3c3c, pants: 0x2c2c48 },
  tattoo: { skin: 0xf0c8a0, hair: 0x40c060, top: 0x202020, pants: 0x303040, beard: 0x40c060 },
  nurse: { skin: 0xa86c40, hair: 0x302020, top: 0xe8e8f0, pants: 0xe8e8f0 },
  clerk2: { skin: 0xc8946c, hair: 0x202020, hat: 0xe8e8e8, top: 0xe8e8e8, pants: 0x3c3c48, beard: 0x202020 },
};
