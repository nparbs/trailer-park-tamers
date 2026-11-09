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
  prop?: 'bottle' | 'sign' | 'cart' | 'bible' | 'cans' | 'pigeon' | 'cat' | 'guitar' | 'pipe' | 'cards' | 'bag' | 'box' | 'scratchers' | 'paint' | 'bindle' | 'skateboard'
    | 'gun' | 'joint' | 'forty' | 'handle' | 'pills' | 'beaker' | 'leaf' | 'phone' | 'saw' | 'loko' | 'crackpipe';
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
    learnset: [[1, 'SHOVE'], [1, 'PANHANDLE'], [6, 'BOTTLE_SMASH'], [9, 'BEER_BREATH'], [13, 'LIQUID_COURAGE'], [15, 'FORTY_SMASH'], [18, 'PROJECTILE_PUKE'], [26, 'BENDER']],
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
    learnset: [[1, 'SHOVE'], [1, 'REPENT'], [6, 'BIBLE_THUMP'], [9, 'SERMON'], [13, 'LAYING_HANDS'], [14, 'HOLY_WATER'], [20, 'BRIMSTONE']],
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
    learnset: [[1, 'SHOVE'], [1, 'SPIT'], [6, 'TWITCH'], [9, 'FUMES'], [13, 'TWEAK_OUT'], [15, 'BAD_TRIP'], [27, 'CHEM_BURN']],
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
  // ---------- second wave ----------
  MO: {
    name: 'Malt Liquor Mo', types: ['BOOZE'], base: { hp: 45, atk: 45, def: 40, spd: 40 }, catchRate: 200, baseExp: 52,
    learnset: [[1, 'SHOVE'], [1, 'SPIT'], [5, 'BOTTLE_SMASH'], [9, 'BEER_BREATH'], [13, 'LIQUID_COURAGE']],
    evolves: { level: 14, into: 'FORTYMO' },
    look: { skin: 0x8c5c38, hair: 0x202020, hairStyle: 'beanie', beard: 'stubble', top: 0x3c4c6c, topStyle: 'hoodie', pants: 0x3c3c3c, prop: 'bottle', nose: 0xb04030 },
    dex: 'Gets his breakfast in a brown paper bag. It is also his lunch and dinner.',
  },
  FORTYMO: {
    name: '40oz Mo', types: ['BOOZE'], base: { hp: 65, atk: 65, def: 55, spd: 45 }, catchRate: 90, baseExp: 120,
    learnset: [[1, 'BOTTLE_SMASH'], [1, 'BEER_BREATH'], [14, 'FORTY_SMASH'], [20, 'LIQUID_COURAGE'], [27, 'PROJECTILE_PUKE']],
    evolves: { level: 30, into: 'HANDLEMO' },
    look: { skin: 0x8c5c38, hair: 0x202020, hairStyle: 'beanie', beard: 'full', top: 0x2c3c5c, topStyle: 'coat', pants: 0x2c2c2c, prop: 'forty', nose: 0xc03030 },
    dex: 'Two forties duct-taped to his hands. He calls it Edward Fortyhands. He has not opened a door since.',
  },
  HANDLEMO: {
    name: 'Handle Mo', types: ['BOOZE', 'TOUGH'], base: { hp: 95, atk: 90, def: 75, spd: 40 }, catchRate: 45, baseExp: 190,
    learnset: [[1, 'FORTY_SMASH'], [1, 'HANDLE'], [30, 'BENDER'], [36, 'HAYMAKER']],
    look: { skin: 0x8c5c38, hair: 0x202020, hairStyle: 'beanie', beard: 'long', top: 0x2c3c5c, topStyle: 'coat', pants: 0x2c2c2c, prop: 'handle', nose: 0xe03030, big: true },
    dex: 'Graduated to the plastic handle of vodka. Nobody has ever seen him put it down.',
  },
  KENNY: {
    name: 'Crackhead Kenny', types: ['CHEM'], base: { hp: 40, atk: 55, def: 30, spd: 80 }, catchRate: 190, baseExp: 58,
    learnset: [[1, 'TWITCH'], [1, 'SPIT'], [6, 'PICKPOCKET'], [10, 'HIT_PIPE'], [15, 'BAD_TRIP']],
    evolves: { level: 20, into: 'ROCKBOTTOM' },
    look: { skin: 0xc8a080, hair: 0x5c4c3c, hairStyle: 'wild', beard: 'stubble', top: 0x7c6c5c, topStyle: 'tank', pants: 0x4c5c7c, prop: 'crackpipe', thin: true },
    dex: 'Will wash your windshield whether you want it washed or not. Runs faster than the bus.',
  },
  ROCKBOTTOM: {
    name: 'Rock Bottom Kenny', types: ['CHEM', 'PSYCHO'], base: { hp: 55, atk: 85, def: 40, spd: 110 }, catchRate: 60, baseExp: 160,
    learnset: [[1, 'TWITCH'], [1, 'HIT_PIPE'], [20, 'MELTDOWN'], [26, 'CHEM_BURN'], [32, 'BONE_SMASH']],
    look: { skin: 0xb8b0a0, hair: 0x6c5c4c, hairStyle: 'wild', beard: 'full', top: 0x6c5c4c, topStyle: 'tank', pants: 0x3c4c6c, prop: 'crackpipe', thin: true, shades: true },
    dex: 'Has hit rock bottom so many times he started digging. Claims he can hear colours.',
  },
  LYLE: {
    name: 'Lookmaxer Lyle', types: ['SLICK'], base: { hp: 45, atk: 50, def: 55, spd: 65 }, catchRate: 150, baseExp: 62,
    learnset: [[1, 'SHOVE'], [1, 'MEWING'], [7, 'MOG'], [12, 'FAST_TALK'], [17, 'SUCKER_PUNCH']],
    evolves: { level: 22, into: 'MOGGER' },
    look: { skin: 0xe0b088, hair: 0x302010, hairStyle: 'short', top: 0x202020, topStyle: 'tank', pants: 0x5c5c6c, prop: 'phone' },
    dex: 'Lives in his car but has a 14-step skincare routine. Rates everyone out of ten. You got a four.',
  },
  MOGGER: {
    name: 'Mogger Lyle', types: ['SLICK', 'PSYCHO'], base: { hp: 60, atk: 80, def: 75, spd: 85 }, catchRate: 45, baseExp: 165,
    learnset: [[1, 'MOG'], [1, 'MEWING'], [22, 'BONE_SMASH'], [28, 'THREE_CARD']],
    look: { skin: 0xd8a070, hair: 0x302010, hairStyle: 'short', top: 0xe0e0e0, topStyle: 'tank', pants: 0x3c3c4c, prop: 'phone', shades: true, big: true },
    dex: 'Hit himself in the face with a hammer to fix his jaw. He will tell you it worked. At length.',
  },
  BETTY: {
    name: 'Bitch Ass Betty', types: ['SLICK', 'FERAL'], base: { hp: 60, atk: 70, def: 50, spd: 70 }, catchRate: 80, baseExp: 110,
    learnset: [[1, 'SPIT'], [1, 'SLAP_FIGHT'], [8, 'MAD_SHIT'], [13, 'SCRATCH'], [18, 'BITE'], [24, 'SUCKER_PUNCH']],
    look: { skin: 0xf0c8a0, hair: 0xe8c860, hairStyle: 'bun', top: 0xe060a0, topStyle: 'tank', pants: 0x6c4c8c, mouth: 0xc02050, prop: 'loko' },
    dex: 'Banned from every Waffle House in the county. Started it, finished it, filmed it.',
  },
  KYLE: {
    name: 'Kush Kyle', types: ['CHEM'], base: { hp: 55, atk: 40, def: 50, spd: 35 }, catchRate: 190, baseExp: 55,
    learnset: [[1, 'SHOVE'], [1, 'FUMES'], [6, 'HOTBOX'], [11, 'MUNCHIES'], [15, 'BAD_TRIP']],
    evolves: { level: 16, into: 'GROWOP' },
    look: { skin: 0xe8b890, hair: 0x8c6c3c, hairStyle: 'long', beard: 'stubble', top: 0x4c8c3c, topStyle: 'hoodie', pants: 0x5c5c4c, prop: 'joint' },
    dex: 'Has been about to start a business for eleven years. The business is weed.',
  },
  GROWOP: {
    name: 'Grow Op Kyle', types: ['CHEM', 'FERAL'], base: { hp: 75, atk: 55, def: 70, spd: 40 }, catchRate: 90, baseExp: 125,
    learnset: [[1, 'HOTBOX'], [1, 'MUNCHIES'], [16, 'LEECH'], [22, 'CHEM_BURN']],
    evolves: { level: 32, into: 'DISPENSARY' },
    look: { skin: 0xe8b890, hair: 0x8c6c3c, hairStyle: 'long', beard: 'full', top: 0x3c6c2c, topStyle: 'vest', pants: 0x4c4c3c, prop: 'leaf' },
    dex: 'Turned a storage unit into a jungle. The power bill is higher than the rent he does not pay.',
  },
  DISPENSARY: {
    name: 'Dispensary Kyle', types: ['CHEM', 'SLICK'], base: { hp: 95, atk: 70, def: 90, spd: 50 }, catchRate: 45, baseExp: 190,
    learnset: [[1, 'HOTBOX'], [1, 'RE_UP'], [32, 'FAST_TALK'], [38, 'LAB_BLAST']],
    look: { skin: 0xe8b890, hair: 0x8c6c3c, hairStyle: 'bun', beard: 'long', top: 0xe8e8e8, topStyle: 'coat', pants: 0x3c4c3c, prop: 'leaf', shades: true, big: true },
    dex: 'Went legit. Wears a lab coat and calls it medicine. Still sells out the back door.',
  },
  LARRY: {
    name: 'Lab Coat Larry', types: ['CHEM', 'SCRAP'], base: { hp: 50, atk: 70, def: 45, spd: 55 }, catchRate: 75, baseExp: 90,
    learnset: [[1, 'FUMES'], [1, 'CAN_TOSS'], [8, 'TWITCH'], [14, 'TWEAK_OUT'], [20, 'CHEM_BURN']],
    evolves: { level: 25, into: 'BLUEBATCH' },
    look: { skin: 0xf0d0b0, hair: 0xb0b0b0, hairStyle: 'bald', beard: 'stubble', top: 0xe8e8e0, topStyle: 'coat', pants: 0x5c5c6c, prop: 'beaker', shades: true },
    dex: 'Used to teach high school chemistry. Still teaches chemistry, just not to anyone with a diploma.',
  },
  BLUEBATCH: {
    name: 'Blue Batch Larry', types: ['CHEM', 'SCRAP'], base: { hp: 70, atk: 100, def: 60, spd: 70 }, catchRate: 30, baseExp: 180,
    learnset: [[1, 'CHEM_BURN'], [1, 'TWEAK_OUT'], [25, 'LAB_BLAST'], [32, 'RUSTY_PIPE']],
    look: { skin: 0xf0d0b0, hair: 0xb0b0b0, hairStyle: 'bald', beard: 'full', top: 0xe8d040, topStyle: 'robe', pants: 0xe8d040, prop: 'beaker', shades: true, big: true },
    dex: 'Wears a yellow hazmat suit to the grocery store. Nobody stops him. Nobody wants to know.',
  },
  GLEN: {
    name: 'Glock Glen', types: ['STRAPPED'], base: { hp: 55, atk: 65, def: 45, spd: 60 }, catchRate: 75, baseExp: 88,
    learnset: [[1, 'PISTOL_WHIP'], [1, 'WARNING_SHOT'], [9, 'TACTICAL'], [15, 'CELEBRATORY'], [21, 'SPRAY_PRAY']],
    evolves: { level: 24, into: 'SWITCHGLEN' },
    look: { skin: 0xd8a070, hair: 0x202020, hairStyle: 'cap', top: 0x303030, topStyle: 'hoodie', pants: 0x3c3c48, prop: 'gun' },
    dex: 'Keeps it on him at all times. Has fired it twice: once at a raccoon and once at his own foot.',
  },
  SWITCHGLEN: {
    name: 'Switch Glen', types: ['STRAPPED', 'TOUGH'], base: { hp: 70, atk: 95, def: 65, spd: 75 }, catchRate: 30, baseExp: 175,
    learnset: [[1, 'PISTOL_WHIP'], [1, 'SPRAY_PRAY'], [24, 'HAYMAKER'], [30, 'CELEBRATORY']],
    look: { skin: 0xd8a070, hair: 0x202020, hairStyle: 'cap', beard: 'full', top: 0x202020, topStyle: 'army', pants: 0x2c2c34, prop: 'gun', shades: true, big: true },
    dex: 'Made it full auto with a part off the internet. Now it mostly fires sideways.',
  },
  CAL: {
    name: 'Open Carry Cal', types: ['STRAPPED', 'BOOZE'], base: { hp: 65, atk: 60, def: 60, spd: 45 }, catchRate: 90, baseExp: 95,
    learnset: [[1, 'WARNING_SHOT'], [1, 'BOTTLE_SMASH'], [10, 'PISTOL_WHIP'], [16, 'FORTY_SMASH'], [24, 'SPRAY_PRAY']],
    look: { skin: 0xf0c098, hair: 0x8c6c4c, hairStyle: 'cap', beard: 'full', top: 0x6c7c4c, topStyle: 'army', pants: 0x4c5c8c, prop: 'gun', nose: 0xd05050 },
    dex: 'Walks into the gas station with a rifle on his back to buy one lottery ticket. Every single day.',
  },
  DEZ: {
    name: 'Dime Bag Dez', types: ['SLICK', 'CHEM'], base: { hp: 50, atk: 55, def: 50, spd: 75 }, catchRate: 120, baseExp: 70,
    learnset: [[1, 'PICKPOCKET'], [1, 'FAST_TALK'], [7, 'FUMES'], [12, 'RE_UP'], [17, 'SUCKER_PUNCH']],
    evolves: { level: 20, into: 'PLUG' },
    look: { skin: 0xa86c40, hair: 0x101010, hairStyle: 'cap', top: 0xd0d0d0, topStyle: 'hoodie', pants: 0x3c4c6c, prop: 'bag' },
    dex: 'Always on the corner, always just waiting for a friend. He has a lot of friends.',
  },
  PLUG: {
    name: 'The Plug', types: ['SLICK', 'CHEM'], base: { hp: 70, atk: 75, def: 70, spd: 95 }, catchRate: 40, baseExp: 170,
    learnset: [[1, 'SUCKER_PUNCH'], [1, 'RE_UP'], [20, 'THREE_CARD'], [28, 'CHEM_BURN']],
    look: { skin: 0xa86c40, hair: 0x101010, hairStyle: 'short', top: 0x7c2c8c, topStyle: 'coat', pants: 0x202020, prop: 'phone', shades: true },
    dex: 'Three phones, no last name. If you need something, you already know. If you do not, you do not.',
  },
  LISA: {
    name: 'Four Loko Lisa', types: ['BOOZE', 'CHEM'], base: { hp: 55, atk: 60, def: 40, spd: 70 }, catchRate: 140, baseExp: 68,
    learnset: [[1, 'BEER_BREATH'], [1, 'TWITCH'], [8, 'BOTTLE_SMASH'], [13, 'LOKO_RAGE'], [19, 'TWEAK_OUT']],
    look: { skin: 0xf0c8a0, hair: 0xd04040, hairStyle: 'long', top: 0x40c0c0, topStyle: 'tee', pants: 0x303040, prop: 'loko' },
    dex: 'Equal parts caffeine and malt. Has been awake and drunk since the drink was legal.',
  },
  NED: {
    name: 'Nodding Ned', types: ['CHEM'], base: { hp: 75, atk: 40, def: 60, spd: 20 }, catchRate: 170, baseExp: 60,
    learnset: [[1, 'NOD_OFF'], [1, 'STARE'], [7, 'FUMES'], [12, 'HOTBOX'], [18, 'BAD_TRIP']],
    look: { skin: 0xc8b8a0, hair: 0x6c5c4c, hairStyle: 'hood', beard: 'stubble', top: 0x5c5c6c, topStyle: 'hoodie', pants: 0x3c3c48, thin: true },
    dex: 'Falls asleep standing up at the bus stop. Wakes up exactly when you try to take his stuff.',
  },
  PHYLLIS: {
    name: 'Pill Mill Phyllis', types: ['CHEM', 'HOLY'], base: { hp: 60, atk: 45, def: 65, spd: 40 }, catchRate: 100, baseExp: 85,
    learnset: [[1, 'REPENT'], [1, 'FUMES'], [9, 'LAYING_HANDS'], [14, 'HOTBOX'], [20, 'BRIMSTONE']],
    look: { skin: 0xf0d8c0, hair: 0xd8d8e8, hairStyle: 'bun', top: 0x8cb8d8, topStyle: 'sweater', pants: 0x8cb8d8, prop: 'pills' },
    dex: 'A sweet old lady with nine doctors and nine prescriptions. Her purse rattles like a maraca.',
  },
  CARL: {
    name: 'Catalytic Carl', types: ['SCRAP', 'SLICK'], base: { hp: 55, atk: 70, def: 55, spd: 60 }, catchRate: 110, baseExp: 80,
    learnset: [[1, 'CAN_TOSS'], [1, 'PICKPOCKET'], [9, 'HUBCAP'], [14, 'SAWZALL'], [21, 'SUCKER_PUNCH']],
    look: { skin: 0xe0b088, hair: 0x5c4c3c, hairStyle: 'beanie', beard: 'stubble', top: 0x4c6c8c, topStyle: 'hoodie', pants: 0x3c3c3c, prop: 'saw' },
    dex: 'Can get under a Prius and back out in ninety seconds. Your car now sounds like a Harley.',
  },
  // ---------- the Bottoms ----------
  SID: {
    name: 'Squatter Sid', types: ['STREET', 'TOUGH'], base: { hp: 60, atk: 55, def: 65, spd: 35 }, catchRate: 150, baseExp: 70,
    learnset: [[1, 'SHOVE'], [1, 'SQUAT'], [10, 'HEADBUTT'], [14, 'CURB_STOMP'], [19, 'EVICT']],
    evolves: { level: 24, into: 'ADVERSE' },
    look: { skin: SKIN.ruddy, hair: 0x5c4030, hairStyle: 'beanie', beard: 'full', top: 0x7c6c4c, topStyle: 'coat', pants: 0x4c4c5c, prop: 'box' },
    dex: 'Moved into a foreclosed house and put his name on the mailbox. Nobody has asked him to leave yet.',
  },
  ADVERSE: {
    name: 'Adverse Possession Sid', types: ['STREET', 'SLICK'], base: { hp: 85, atk: 75, def: 90, spd: 45 }, catchRate: 45, baseExp: 165,
    learnset: [[1, 'SQUAT'], [1, 'EVICT'], [24, 'FAST_TALK'], [30, 'BUM_RUSH']],
    look: { skin: SKIN.ruddy, hair: 0x5c4030, hairStyle: 'short', beard: 'full', top: 0x3c3c5c, topStyle: 'sweater', pants: 0x3c3c48, prop: 'phone', big: true },
    dex: 'Lived there long enough that it is legally his now. Charges the previous owner rent.',
  },
  MEL: {
    name: 'Moonshine Mel', types: ['BOOZE', 'SCRAP'], base: { hp: 55, atk: 60, def: 50, spd: 40 }, catchRate: 140, baseExp: 68,
    learnset: [[1, 'BOTTLE_SMASH'], [1, 'CAN_TOSS'], [9, 'BEER_BREATH'], [13, 'HUBCAP'], [18, 'MOONSHINE']],
    evolves: { level: 26, into: 'SHINEKING' },
    look: { skin: SKIN.ruddy, hair: 0xd8d8d0, hairStyle: 'cap', beard: 'long', top: 0x5c7c9c, topStyle: 'vest', pants: 0x3c4c6c, prop: 'bottle', nose: 0xe04040 },
    dex: 'Runs a still out of a radiator. Each jar is labelled with a skull he drew himself.',
  },
  SHINEKING: {
    name: 'Still King Mel', types: ['BOOZE', 'SCRAP'], base: { hp: 80, atk: 95, def: 70, spd: 45 }, catchRate: 45, baseExp: 170,
    learnset: [[1, 'MOONSHINE'], [1, 'HUBCAP'], [26, 'RUSTY_PIPE'], [32, 'BENDER']],
    look: { skin: SKIN.ruddy, hair: 0xe8e8e0, hairStyle: 'wild', beard: 'long', top: 0x3c5c7c, topStyle: 'vest', pants: 0x2c3c5c, prop: 'handle', nose: 0xf03030, big: true },
    dex: 'Built a second still out of the first still. Revenue agents have stopped coming back.',
  },
  BENNY: {
    name: 'Bootleg Benny', types: ['SLICK'], base: { hp: 50, atk: 55, def: 45, spd: 70 }, catchRate: 140, baseExp: 66,
    learnset: [[1, 'PICKPOCKET'], [1, 'FAST_TALK'], [10, 'HUSTLE'], [15, 'THREE_CARD'], [21, 'SUCKER_PUNCH']],
    look: { skin: SKIN.brown, hair: 0x202020, hairStyle: 'cap', top: 0x5c3c8c, topStyle: 'hoodie', pants: 0x3c3c3c, prop: 'box', shades: true },
    dex: "Sells movies that aren't out yet. You can see the back of a man's head in every one.",
  },
  PAM: {
    name: 'Porch Pirate Pam', types: ['SLICK', 'FERAL'], base: { hp: 50, atk: 60, def: 40, spd: 75 }, catchRate: 130, baseExp: 70,
    learnset: [[1, 'PORCH_GRAB'], [1, 'SCRATCH'], [10, 'PICKPOCKET'], [14, 'BITE'], [20, 'SUCKER_PUNCH']],
    look: { skin: SKIN.pale, hair: 0x8c3c2c, hairStyle: 'hood', top: 0x2c2c3c, topStyle: 'hoodie', pants: 0x3c3c4c, prop: 'box' },
    dex: 'Follows the delivery truck on a bicycle. Has never once needed anything she took.',
  },
  STEVE: {
    name: 'Sovereign Steve', types: ['PSYCHO', 'TOUGH'], base: { hp: 65, atk: 55, def: 70, spd: 45 }, catchRate: 110, baseExp: 78,
    learnset: [[1, 'RANT'], [1, 'NO_CONSENT'], [11, 'STARE'], [15, 'HEADBUTT'], [22, 'CONSPIRACY']],
    look: { skin: SKIN.pale, hair: 0x8c7c5c, hairStyle: 'short', beard: 'stubble', top: 0x7c8c4c, topStyle: 'army', pants: 0x4c4c3c, prop: 'sign' },
    dex: 'Made his own license plate out of cardboard. Will explain maritime law to you until the cops give up.',
  },
  DWAYNE: {
    name: 'Deacon Dwayne', types: ['HOLY', 'STRAPPED'], base: { hp: 65, atk: 65, def: 60, spd: 50 }, catchRate: 90, baseExp: 85,
    learnset: [[1, 'BIBLE_THUMP'], [1, 'WARNING_SHOT'], [11, 'REPENT'], [16, 'PISTOL_WHIP'], [22, 'BRIMSTONE']],
    look: { skin: SKIN.dark, hair: 0x202020, hairStyle: 'short', top: 0x2c2c3c, topStyle: 'coat', pants: 0x2c2c3c, prop: 'bible', shades: true },
    dex: 'Head of church security. Passes the collection plate with one hand. The other hand is busy.',
  },
  JUGGALO: {
    name: 'Juggalo Jeff', types: ['PSYCHO', 'BOOZE'], base: { hp: 55, atk: 65, def: 45, spd: 60 }, catchRate: 140, baseExp: 70,
    learnset: [[1, 'SCREECH'], [1, 'FAYGO'], [10, 'BOTTLE_SMASH'], [15, 'RANT'], [21, 'MELTDOWN']],
    look: { skin: 0xf0f0f0, hair: 0x202020, hairStyle: 'wild', top: 0x3c3c3c, topStyle: 'tee', pants: 0x2c2c48, prop: 'bottle', mouth: 0x202020, nose: 0x202020 },
    dex: 'Whoop whoop. Paints his face every morning even when nobody is coming over. Nobody is ever coming over.',
  },
  DWIGHT: {
    name: 'DUI Dwight', types: ['BOOZE', 'STREET'], base: { hp: 60, atk: 55, def: 55, spd: 65 }, catchRate: 150, baseExp: 66,
    learnset: [[1, 'SHOVE'], [1, 'BEER_BREATH'], [10, 'BOTTLE_SMASH'], [14, 'CART_RAM'], [20, 'FORTY_SMASH']],
    look: { skin: SKIN.tan, hair: 0x6c5c4c, hairStyle: 'helmet', beard: 'stubble', top: 0xc0c0c0, topStyle: 'tee', pants: 0x4c5c8c, nose: 0xd04040 },
    dex: 'Lost his license in 2009. Rides a moped everywhere in a full-face helmet. Still gets pulled over.',
  },
  CLIFF: {
    name: 'Copper Cliff', types: ['SCRAP', 'TOUGH'], base: { hp: 60, atk: 70, def: 65, spd: 40 }, catchRate: 110, baseExp: 80,
    learnset: [[1, 'CAN_TOSS'], [1, 'HEADBUTT'], [10, 'COPPER_STRIP'], [16, 'TARP_UP'], [22, 'RUSTY_PIPE']],
    look: { skin: SKIN.ruddy, hair: 0x3c3c3c, hairStyle: 'beanie', beard: 'full', top: 0xc87c3c, topStyle: 'vest', pants: 0x4c4c4c, prop: 'saw' },
    dex: 'Has gutted every vacant house on the block. Can tell copper from aluminum by licking it.',
  },
  TRUDY: {
    name: 'Troll Toll Trudy', types: ['FERAL', 'TOUGH'], base: { hp: 75, atk: 65, def: 60, spd: 35 }, catchRate: 90, baseExp: 82,
    learnset: [[1, 'BITE'], [1, 'STARE'], [10, 'TROLL_TOLL'], [16, 'CHOKEHOLD'], [22, 'HAYMAKER']],
    look: { skin: SKIN.grey, hair: 0x5c6c3c, hairStyle: 'wild', top: 0x4c5c3c, topStyle: 'coat', pants: 0x3c3c34, prop: 'bag', big: true },
    dex: 'Lives under the overpass and charges anyone who walks through a dollar. She takes cigarettes.',
  },
} satisfies Record<string, SpeciesDef>;

export type SpeciesId = keyof typeof SPECIES;

export function species(id: SpeciesId): SpeciesDef {
  return SPECIES[id] as SpeciesDef;
}

export const STARTERS: SpeciesId[] = ['WILLIE', 'AMOS', 'PETE'];
