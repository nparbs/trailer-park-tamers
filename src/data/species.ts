import type { MoveId } from './moves';
import type { TypeId } from './types';

export interface Look {
  skin: number;
  hair: number;
  hairStyle: 'bald' | 'short' | 'long' | 'mohawk' | 'afro' | 'cap' | 'beanie' | 'tinfoil' | 'hood' | 'wild' | 'bun' | 'helmet';
  beard?: 'stubble' | 'full' | 'long' | 'none';
  top: number;
  topStyle: 'tee' | 'coat' | 'vest' | 'hoodie' | 'robe' | 'army' | 'tank' | 'sweater';
  pants: number;
  prop?: 'bottle' | 'sign' | 'cart' | 'bible' | 'cans' | 'pigeon' | 'cat' | 'guitar' | 'pipe' | 'cards' | 'bag' | 'box' | 'scratchers' | 'paint' | 'bindle' | 'skateboard';
  shades?: boolean;
  eyepatch?: boolean;
  big?: boolean;
  thin?: boolean;
  nose?: number; // red nose etc.
  mouth?: number; // e.g. silver paint mouth
  beardColor?: number;
}

export interface SpeciesDef {
  name: string;
  types: TypeId[];
  base: { hp: number; atk: number; def: number; spd: number };
  catchRate: number; // 3..255, higher is easier
  baseExp: number;
  learnset: [number, MoveId][];
  /** Species id it turns into (a string here to avoid a circular type). */
  evolves?: { level: number; into: string };
  look: Look;
  dex: string;
}

const SKIN = { pale: 0xf0c8a0, tan: 0xd8a070, brown: 0xa86c40, dark: 0x6c4428, ruddy: 0xe0a080, grey: 0xc8b8a0 };

export const SPECIES = {
  WILLIE: {
    name: 'Wino Willie', types: ['BOOZE'], base: { hp: 50, atk: 55, def: 40, spd: 45 }, catchRate: 45, baseExp: 64,
    learnset: [[1, 'SHOVE'], [1, 'PANHANDLE'], [5, 'BOTTLE_SMASH'], [9, 'BEER_BREATH'], [13, 'LIQUID_COURAGE'], [18, 'PROJECTILE_PUKE'], [26, 'BENDER']],
    evolves: { level: 16, into: 'BILL' },
    look: { skin: SKIN.ruddy, hair: 0x9c9890, hairStyle: 'beanie', beard: 'stubble', top: 0x6a5a3a, topStyle: 'coat', pants: 0x404858, prop: 'bottle', nose: 0xd04040 },
    dex: 'Lives in a paper bag, emotionally and physically. Gets braver every swig.',
  },
  BILL: {
    name: 'Box Wine Bill', types: ['BOOZE'], base: { hp: 75, atk: 80, def: 60, spd: 55 }, catchRate: 45, baseExp: 142,
    learnset: [[1, 'SHOVE'], [1, 'BOTTLE_SMASH'], [18, 'PROJECTILE_PUKE'], [24, 'CURB_STOMP'], [30, 'BENDER']],
    look: { skin: SKIN.ruddy, hair: 0xb8b4a8, hairStyle: 'wild', beard: 'full', top: 0x504830, topStyle: 'coat', pants: 0x384050, prop: 'box', nose: 0xe03030, big: true },
    dex: 'Graduated from bottles to the bag-in-a-box. Has not been sober since the Clinton years.',
  },
  AMOS: {
    name: 'Brother Amos', types: ['HOLY'], base: { hp: 55, atk: 45, def: 55, spd: 40 }, catchRate: 45, baseExp: 64,
    learnset: [[1, 'SHOVE'], [1, 'REPENT'], [5, 'BIBLE_THUMP'], [9, 'SERMON'], [13, 'LAYING_HANDS'], [20, 'BRIMSTONE']],
    evolves: { level: 16, into: 'PROPHET' },
    look: { skin: SKIN.dark, hair: 0x302820, hairStyle: 'short', beard: 'full', top: 0x302830, topStyle: 'sweater', pants: 0x282830, prop: 'bible' },
    dex: 'Preaches on the same corner every day. Nobody listens, but he keeps the hours of a bank.',
  },
  PROPHET: {
    name: 'Prophet Amos', types: ['HOLY', 'PSYCHO'], base: { hp: 80, atk: 60, def: 80, spd: 50 }, catchRate: 45, baseExp: 142,
    learnset: [[1, 'BIBLE_THUMP'], [1, 'SERMON'], [20, 'BRIMSTONE'], [25, 'RANT'], [32, 'MELTDOWN']],
    look: { skin: SKIN.dark, hair: 0xe0e0e0, hairStyle: 'long', beard: 'long', top: 0xe0d8c0, topStyle: 'robe', pants: 0xc8c0a8, prop: 'sign' },
    dex: 'Wears a bedsheet and a sandwich board that says THE END IS NEAR. He has a date picked out.',
  },
  PETE: {
    name: 'Twitchy Pete', types: ['CHEM'], base: { hp: 45, atk: 50, def: 35, spd: 70 }, catchRate: 45, baseExp: 64,
    learnset: [[1, 'SHOVE'], [1, 'SPIT'], [5, 'TWITCH'], [9, 'FUMES'], [13, 'TWEAK_OUT'], [19, 'BAD_TRIP'], [27, 'CHEM_BURN']],
    evolves: { level: 16, into: 'SPUN' },
    look: { skin: SKIN.pale, hair: 0x806040, hairStyle: 'hood', beard: 'none', top: 0x50607c, topStyle: 'hoodie', pants: 0x384048, thin: true },
    dex: 'Has been awake since Tuesday. Which Tuesday is unclear.',
  },
  SPUN: {
    name: 'Spun Pete', types: ['CHEM', 'PSYCHO'], base: { hp: 60, atk: 75, def: 45, spd: 100 }, catchRate: 45, baseExp: 142,
    learnset: [[1, 'TWITCH'], [1, 'FUMES'], [19, 'BAD_TRIP'], [24, 'STARE'], [28, 'CHEM_BURN']],
    look: { skin: SKIN.grey, hair: 0x605040, hairStyle: 'wild', beard: 'stubble', top: 0x40485c, topStyle: 'tank', pants: 0x303840, thin: true, prop: 'pipe' },
    dex: 'Took apart a microwave to "see the waves." Fast enough to steal your shoes while you wear them.',
  },
  JOE: {
    name: 'Bindle Joe', types: ['STREET'], base: { hp: 45, atk: 45, def: 40, spd: 50 }, catchRate: 255, baseExp: 50,
    learnset: [[1, 'SHOVE'], [3, 'SPIT'], [6, 'SIGN_SLAP'], [10, 'PANHANDLE'], [15, 'CURB_STOMP'], [22, 'BUM_RUSH']],
    evolves: { level: 14, into: 'BOXCAR' },
    look: { skin: SKIN.tan, hair: 0x504030, hairStyle: 'cap', beard: 'stubble', top: 0x8c4a3a, topStyle: 'vest', pants: 0x5a6c8c, prop: 'bindle' },
    dex: 'A classic. Carries everything he owns in a handkerchief on a stick, mostly crackers.',
  },
  BOXCAR: {
    name: 'Boxcar Joe', types: ['STREET', 'TOUGH'], base: { hp: 70, atk: 70, def: 60, spd: 65 }, catchRate: 120, baseExp: 120,
    learnset: [[1, 'SHOVE'], [1, 'SIGN_SLAP'], [15, 'CURB_STOMP'], [20, 'HEADBUTT'], [26, 'BUM_RUSH']],
    look: { skin: SKIN.tan, hair: 0x403020, hairStyle: 'cap', beard: 'full', top: 0x6c3a2c, topStyle: 'coat', pants: 0x4a5a78, prop: 'bindle', big: true },
    dex: 'Has ridden every freight line in the country. Rumoured to have punched a train.',
  },
  GARY: {
    name: 'Sign Guy Gary', types: ['STREET'], base: { hp: 55, atk: 40, def: 45, spd: 45 }, catchRate: 255, baseExp: 48,
    learnset: [[1, 'SIGN_SLAP'], [1, 'PANHANDLE'], [5, 'SPIT'], [10, 'NAP'], [16, 'CURB_STOMP']],
    look: { skin: SKIN.pale, hair: 0xc09050, hairStyle: 'long', beard: 'full', top: 0x7c8c58, topStyle: 'army', pants: 0x5c5040, prop: 'sign' },
    dex: 'His cardboard sign says ANYTHING HELPS. It is, in fact, a weapon.',
  },
  STAN: {
    name: 'Can Man Stan', types: ['SCRAP'], base: { hp: 50, atk: 55, def: 60, spd: 35 }, catchRate: 190, baseExp: 58,
    learnset: [[1, 'SHOVE'], [1, 'CAN_TOSS'], [7, 'TARP_UP'], [11, 'HUBCAP'], [17, 'CART_RAM'], [25, 'RUSTY_PIPE']],
    evolves: { level: 18, into: 'CARTKING' },
    look: { skin: SKIN.brown, hair: 0x202020, hairStyle: 'beanie', beard: 'stubble', top: 0x4c6a5a, topStyle: 'coat', pants: 0x4a4a4a, prop: 'cans' },
    dex: 'Knows the deposit value of every can in a three-mile radius. Five cents is five cents.',
  },
  CARTKING: {
    name: 'Cart King Stan', types: ['SCRAP', 'TOUGH'], base: { hp: 75, atk: 80, def: 90, spd: 40 }, catchRate: 60, baseExp: 150,
    learnset: [[1, 'CAN_TOSS'], [1, 'CART_RAM'], [18, 'HEADBUTT'], [25, 'RUSTY_PIPE'], [30, 'HAYMAKER']],
    look: { skin: SKIN.brown, hair: 0x202020, hairStyle: 'helmet', beard: 'full', top: 0x3c5a4a, topStyle: 'coat', pants: 0x3a3a3a, prop: 'cart', big: true },
    dex: 'Rules a fleet of stolen shopping carts. His crown is a hubcap. Do not touch the cart.',
  },
  CAROL: {
    name: 'Cat Lady Carol', types: ['FERAL'], base: { hp: 55, atk: 50, def: 45, spd: 55 }, catchRate: 150, baseExp: 62,
    learnset: [[1, 'SCRATCH'], [1, 'SPIT'], [6, 'BITE'], [10, 'FLEAS'], [15, 'HOWL'], [21, 'LEECH']],
    look: { skin: SKIN.pale, hair: 0xb0b0b8, hairStyle: 'bun', top: 0xb04a7c, topStyle: 'sweater', pants: 0x6a4a6a, prop: 'cat' },
    dex: 'Has forty-one cats and a name for every one. All of them are named Mr. Whiskers.',
  },
  PAT: {
    name: 'Pigeon Pat', types: ['FERAL'], base: { hp: 40, atk: 45, def: 35, spd: 65 }, catchRate: 220, baseExp: 50,
    learnset: [[1, 'SCRATCH'], [1, 'STARE'], [5, 'BITE'], [12, 'HOWL'], [18, 'PIGEON_STORM']],
    look: { skin: SKIN.tan, hair: 0x7c7c7c, hairStyle: 'bald', beard: 'long', top: 0x5a5a6a, topStyle: 'coat', pants: 0x404040, prop: 'pigeon' },
    dex: 'Feeds the pigeons bread every morning. The pigeons fight for him now.',
  },
  TERRY: {
    name: 'Tinfoil Terry', types: ['PSYCHO'], base: { hp: 50, atk: 60, def: 40, spd: 55 }, catchRate: 120, baseExp: 66,
    learnset: [[1, 'RANT'], [1, 'STARE'], [8, 'SCREECH'], [12, 'CONSPIRACY'], [24, 'MELTDOWN']],
    evolves: { level: 22, into: 'ABDUCTEE' },
    look: { skin: SKIN.pale, hair: 0x806030, hairStyle: 'tinfoil', beard: 'stubble', top: 0x7c7c40, topStyle: 'army', pants: 0x4a4a3a },
    dex: 'The hat blocks the signals. He will tell you about the signals. You did not ask.',
  },
  ABDUCTEE: {
    name: 'Abductee Terry', types: ['PSYCHO', 'CHEM'], base: { hp: 70, atk: 90, def: 55, spd: 75 }, catchRate: 45, baseExp: 150,
    learnset: [[1, 'RANT'], [1, 'CONSPIRACY'], [22, 'BAD_TRIP'], [30, 'MELTDOWN']],
    look: { skin: SKIN.grey, hair: 0x806030, hairStyle: 'tinfoil', beard: 'long', top: 0x50a050, topStyle: 'robe', pants: 0x405040, shades: true },
    dex: 'Claims the aliens gave him back, but kept his left sock. He is not wrong about everything.',
  },
  MUMBLES: {
    name: 'Mumbles', types: ['PSYCHO'], base: { hp: 60, atk: 40, def: 55, spd: 40 }, catchRate: 190, baseExp: 56,
    learnset: [[1, 'STARE'], [1, 'SHOVE'], [6, 'RANT'], [11, 'SPIT'], [16, 'CONSPIRACY']],
    look: { skin: SKIN.brown, hair: 0x302820, hairStyle: 'wild', beard: 'long', top: 0x5c4a3c, topStyle: 'coat', pants: 0x3a3a3a, prop: 'bag' },
    dex: 'Talks to himself all day and wins most of the arguments.',
  },
  SARGE: {
    name: 'Sarge', types: ['TOUGH'], base: { hp: 65, atk: 70, def: 65, spd: 45 }, catchRate: 75, baseExp: 90,
    learnset: [[1, 'SHOVE'], [1, 'DRILL_SGT'], [7, 'HEADBUTT'], [12, 'TOUGH_IT_OUT'], [18, 'CHOKEHOLD'], [26, 'HAYMAKER']],
    look: { skin: SKIN.dark, hair: 0xc0c0c0, hairStyle: 'short', beard: 'stubble', top: 0x5c6a3c, topStyle: 'army', pants: 0x4c5a34, eyepatch: true },
    dex: 'Served three tours. Still sleeps with one eye open, which is easy since he only has one.',
  },
  MARV: {
    name: 'Three-Card Marv', types: ['SLICK'], base: { hp: 45, atk: 55, def: 40, spd: 70 }, catchRate: 150, baseExp: 62,
    learnset: [[1, 'PICKPOCKET'], [1, 'FAST_TALK'], [7, 'HUSTLE'], [11, 'THREE_CARD'], [19, 'SUCKER_PUNCH']],
    look: { skin: SKIN.tan, hair: 0x201810, hairStyle: 'short', top: 0x8c2c3c, topStyle: 'vest', pants: 0x2c2c3c, prop: 'cards', shades: true },
    dex: 'Follow the queen. Watch the queen. You will not find the queen. There was never a queen.',
  },
  BEV: {
    name: 'Busker Bev', types: ['SLICK'], base: { hp: 50, atk: 50, def: 45, spd: 60 }, catchRate: 150, baseExp: 60,
    learnset: [[1, 'SHOVE'], [1, 'FAST_TALK'], [6, 'PICKPOCKET'], [10, 'SCREECH'], [16, 'THREE_CARD']],
    look: { skin: SKIN.brown, hair: 0x9c3c2c, hairStyle: 'afro', top: 0xc8903c, topStyle: 'tee', pants: 0x3c4c7c, prop: 'guitar' },
    dex: 'Knows four chords and one song. The song is Wonderwall. It is always Wonderwall.',
  },
  DAVE: {
    name: 'Dumpster Dave', types: ['SCRAP', 'FERAL'], base: { hp: 60, atk: 55, def: 55, spd: 40 }, catchRate: 160, baseExp: 64,
    learnset: [[1, 'SCRATCH'], [1, 'CAN_TOSS'], [6, 'FLEAS'], [10, 'BITE'], [14, 'HUBCAP'], [20, 'LEECH']],
    look: { skin: SKIN.ruddy, hair: 0x6c5030, hairStyle: 'wild', beard: 'full', top: 0x4c5c3c, topStyle: 'hoodie', pants: 0x3c3c34, prop: 'bag' },
    dex: 'Eats like a king behind the bakery at 10:15 every night. Smells like a different king.',
  },
  LINDA: {
    name: 'Lotto Linda', types: ['SLICK', 'BOOZE'], base: { hp: 55, atk: 50, def: 45, spd: 60 }, catchRate: 120, baseExp: 70,
    learnset: [[1, 'PICKPOCKET'], [1, 'BEER_BREATH'], [8, 'BOTTLE_SMASH'], [13, 'FAST_TALK'], [18, 'THREE_CARD']],
    look: { skin: SKIN.pale, hair: 0xe0c040, hairStyle: 'long', top: 0x40a0a0, topStyle: 'tank', pants: 0x404c8c, prop: 'scratchers', mouth: 0xc03050 },
    dex: 'One more scratcher and she is due. She has been due since 1998.',
  },
  HANK: {
    name: "Huffin' Hank", types: ['CHEM', 'SCRAP'], base: { hp: 50, atk: 60, def: 50, spd: 55 }, catchRate: 120, baseExp: 70,
    learnset: [[1, 'FUMES'], [1, 'CAN_TOSS'], [8, 'TWITCH'], [13, 'HUBCAP'], [18, 'BAD_TRIP']],
    look: { skin: SKIN.pale, hair: 0x2c2c2c, hairStyle: 'mohawk', beard: 'stubble', top: 0x2c2c2c, topStyle: 'tank', pants: 0x5c5c6c, prop: 'paint', mouth: 0xc8c8d8 },
    dex: 'His favourite colour is metallic silver, which is also the colour of his mouth.',
  },
  LENNY: {
    name: 'Lookout Lenny', types: ['SLICK'], base: { hp: 50, atk: 55, def: 45, spd: 75 }, catchRate: 100, baseExp: 72,
    learnset: [[1, 'PICKPOCKET'], [1, 'STARE'], [8, 'HUSTLE'], [12, 'SUCKER_PUNCH'], [20, 'THREE_CARD']],
    look: { skin: SKIN.brown, hair: 0x201810, hairStyle: 'cap', top: 0xe0e0e0, topStyle: 'tank', pants: 0x3c4c6c, shades: true, thin: true },
    dex: 'Whistles twice when the cops come and three times when the ice cream truck comes.',
  },
  TANK: {
    name: 'Tank', types: ['TOUGH', 'CHEM'], base: { hp: 85, atk: 80, def: 75, spd: 40 }, catchRate: 25, baseExp: 160,
    learnset: [[1, 'HEADBUTT'], [1, 'FUMES'], [10, 'TOUGH_IT_OUT'], [14, 'CHOKEHOLD'], [22, 'HAYMAKER']],
    look: { skin: SKIN.dark, hair: 0x101010, hairStyle: 'bald', beard: 'full', top: 0x303030, topStyle: 'tank', pants: 0x2c3448, big: true, shades: true },
    dex: 'Big Tony\'s muscle. Was a nightclub bouncer until he bounced the owner.',
  },
} satisfies Record<string, SpeciesDef>;

export type SpeciesId = keyof typeof SPECIES;

export function species(id: SpeciesId): SpeciesDef {
  return SPECIES[id] as SpeciesDef;
}

export const STARTERS: SpeciesId[] = ['WILLIE', 'AMOS', 'PETE'];
