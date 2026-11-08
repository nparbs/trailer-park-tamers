import type { Dir } from '../game/state';
import type { ItemId } from './items';
import type { SpeciesId } from './species';

export interface Warp {
  x: number;
  y: number;
  w?: number;
  h?: number;
  to: string;
  tx: number;
  ty: number;
  /** Facing after arrival. Defaults to the direction you were walking. */
  face?: Dir;
}

export interface TrainerDef {
  cls: string;
  name: string;
  team: [SpeciesId, number][];
  sight: number;
  intro: string[];
  lose: string;
  after: string;
  reward: number;
  boss?: boolean;
}

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  look: string; // a WALKERS key, 'sp:SPECIES' for a drifter, or 'item'
  dir?: Dir;
  talk?: string | string[];
  script?: string;
  trainer?: TrainerDef;
  /** Picked up as an item. */
  item?: ItemId;
  /** Only present while this returns true. */
  when?: (f: Record<string, boolean>) => boolean;
  wander?: boolean;
}

export interface Trigger {
  x: number;
  y: number;
  w?: number;
  h?: number;
  script: string;
  when?: (f: Record<string, boolean>) => boolean;
}

export interface Encounters {
  rate: number;
  table: [SpeciesId, number, number, number][]; // species, min level, max level, weight
}

export interface MapDef {
  id: string;
  name: string;
  indoor: boolean;
  music: string;
  bg: 'park' | 'street' | 'indoor';
  rows: string[];
  warps: Warp[];
  npcs: NpcDef[];
  signs?: { x: number; y: number; text: string; script?: string }[];
  triggers?: Trigger[];
  enc?: Encounters;
  /** A second encounter table for certain areas of the map (x0,y0,x1,y1 inclusive). */
  enc2?: { area: [number, number, number, number]; enc: Encounters };
  /** Heals and respawns here count as this map's "last safe place". */
  respawn?: { map: string; x: number; y: number };
}

const ROUTE1_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['JOE', 2, 4, 35],
    ['GARY', 2, 4, 30],
    ['PAT', 3, 4, 20],
    ['STAN', 3, 5, 10],
    ['DAVE', 4, 5, 5],
  ],
};

const ALLEY_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['MUMBLES', 5, 7, 25],
    ['CAROL', 5, 7, 20],
    ['BEV', 5, 7, 15],
    ['MARV', 6, 7, 15],
    ['DAVE', 5, 7, 15],
    ['TERRY', 6, 8, 10],
  ],
};

const LOT_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['LINDA', 6, 8, 30],
    ['HANK', 6, 8, 30],
    ['TERRY', 6, 8, 20],
    ['JOE', 6, 8, 15],
    ['SARGE', 7, 8, 5],
  ],
};

export const MAPS: Record<string, MapDef> = {
  home: {
    id: 'home',
    name: 'YOUR TRAILER',
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w##w###w#',
      'B.-----KSF',
      '..-----...',
      '..-cc--...',
      '..-V---.t.',
      '.........C',
      '....M.....',
    ],
    warps: [{ x: 4, y: 6, to: 'park', tx: 4, ty: 4, face: 'down' }],
    npcs: [{ id: 'mom', x: 7, y: 2, look: 'mom', dir: 'left', script: 'mom' }],
    signs: [
      { x: 3, y: 4, text: "It's a TV. Judge Joanne is on. Somebody's getting sued over a pit bull." },
      { x: 0, y: 1, text: "Your bed. It's more of a futon. It's more of a pile." },
      { x: 9, y: 1, text: 'The fridge has mustard, half a Mountain Dew, and a note that says "DONT".' },
      { x: 8, y: 1, text: 'The stove has never been used for cooking. Only for lighting things.' },
      { x: 8, y: 4, text: 'A stack of overdue bills. Somebody drew a smiley face on one.' },
    ],
  },

  park: {
    id: 'park',
    name: 'PINE ACRES TRAILER PARK',
    indoor: false,
    music: 'town',
    bg: 'park',
    rows: [
      'TTTTTTTTTT::::TTTTTTTTTT',
      'T.........::::.........T',
      'T.RRRRR...::::...QQQQQ.T',
      'T.wWdWw...::::...yYeYy.T',
      'T.,..m....::::.......P,T',
      'T.c..o....::::..o.....bT',
      'T::::::::::::::::::::::T',
      'T::::::::::::::::::::::T',
      'T.....,.::.......,.....T',
      'T.QQQQQ.::..RRRRR..%%..T',
      'T.yYeYy.::..wWdWw..%F..T',
      'T.o.....::.....c.......T',
      'T.qp....::...P.....bb..T',
      'T.......::.............T',
      'T.......::.....,.......T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 4, y: 3, to: 'home', tx: 4, ty: 6, face: 'up' },
      { x: 19, y: 3, to: 'dale', tx: 4, ty: 6, face: 'up' },
      { x: 4, y: 10, to: 'granny', tx: 3, ty: 5, face: 'up' },
      { x: 14, y: 10, to: 'hick', tx: 3, ty: 5, face: 'up' },
      { x: 10, y: 0, w: 4, to: 'route1', tx: 8, ty: 28 },
    ],
    npcs: [
      { id: 'park_kid', x: 7, y: 13, look: 'kid', dir: 'up', wander: true, talk: "My mom says if I don't stop running around she's gonna sell me to Uncle Dale for scrap." },
      { id: 'park_hick', x: 16, y: 7, look: 'hick', dir: 'left', wander: true, talk: ['Them people out on Rail Yard Road?', "Hang out in the weeds long enough and one'll jump right out at ya.", "Wear 'em down first, THEN bag 'em. That's just manners."] },
      { id: 'park_bum', x: 21, y: 12, look: 'bum', dir: 'down', talk: "I'm not homeless, I'm house-optional." },
    ],
    signs: [
      { x: 5, y: 4, text: 'Mailbox: "OCCUPANT". Also a court summons. Also a Little Caesars coupon.' },
      { x: 13, y: 12, text: 'A pink lawn flamingo. Somebody gave it a cigarette.' },
    ],
    triggers: [{ x: 10, y: 1, w: 4, script: 'need_starter', when: (f) => !f.starter }],
  },

  dale: {
    id: 'dale',
    name: "UNCLE DALE'S TRAILER",
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w##w###w#',
      'V,,,,,,,KF',
      ',,,,,,,,,,',
      ',,,,,,,,,,',
      ',cc,,,,,,x',
      ',,,,,,,,,,',
      ',,,,M,,,,,',
    ],
    warps: [{ x: 4, y: 6, to: 'park', tx: 19, ty: 4, face: 'down' }],
    npcs: [
      { id: 'dale', x: 5, y: 2, look: 'dale', dir: 'down', script: 'dale' },
      { id: 'st_WILLIE', x: 3, y: 3, look: 'sp:WILLIE', dir: 'down', script: 'starter', when: (f) => !f.starter },
      { id: 'st_AMOS', x: 5, y: 3, look: 'sp:AMOS', dir: 'down', script: 'starter', when: (f) => !f.starter },
      { id: 'st_PETE', x: 7, y: 3, look: 'sp:PETE', dir: 'down', script: 'starter', when: (f) => !f.starter },
      { id: 'rival', x: 8, y: 5, look: 'rival', dir: 'left', script: 'rival_wait', when: (f) => !f.rival1 },
    ],
    signs: [
      { x: 0, y: 1, text: 'The TV is playing a 24-hour pawn shop channel.' },
      { x: 9, y: 4, text: 'Pizza boxes stacked to the ceiling. One of them is load-bearing.' },
    ],
  },

  granny: {
    id: 'granny',
    name: "MEEMAW'S TRAILER",
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w###w#',
      'p.---.B',
      '..-r-..',
      '..---.t',
      'c.....C',
      '...M...',
    ],
    warps: [{ x: 3, y: 5, to: 'park', tx: 4, ty: 11, face: 'down' }],
    npcs: [{ id: 'granny', x: 5, y: 2, look: 'granny', dir: 'down', script: 'granny' }],
  },

  hick: {
    id: 'hick',
    name: "CLETUS'S TRAILER",
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w###w#',
      'V,,,,xx',
      ',,,,,,x',
      ',cc,,,,',
      ',,,,,,m',
      ',,,M,,,',
    ],
    warps: [{ x: 3, y: 5, to: 'park', tx: 14, ty: 11, face: 'down' }],
    npcs: [{ id: 'cletus', x: 4, y: 2, look: 'hick', dir: 'down', script: 'cletus' }],
  },

  route1: {
    id: 'route1',
    name: 'RAIL YARD ROAD',
    indoor: false,
    music: 'route',
    bg: 'park',
    rows: [
      'TTTTTTTT::::TTTTTTTT',
      'T"""....::::...""".T',
      'T""""...::::..""""bT',
      'T""""...::::..""""bT',
      'T""""....::...""""TT',
      'T........::.......%T',
      'T..%..S..::...F....T',
      '#########::#########',
      '++++++++++++++++++++',
      '#########::#########',
      'T....D...::........T',
      'T~~~.....::..""""""T',
      'T~~~~....::..""""""T',
      'T~~~~~...::..""""""T',
      'T~~~~~...::..""""""T',
      'T~~~~....::........T',
      'T~~~.....::....%...T',
      'T........::........T',
      'T"""""...::...qp...T',
      'T"""""...::........T',
      'T"""""...::...T.T..T',
      'T........::........T',
      'T..b.....:::::::...T',
      'T..b...........:...T',
      'T......"""""...:...T',
      'T..o...""""""..:...T',
      'T......""""""..:...T',
      'T.....,"""""...:...T',
      'T.......::::::::...T',
      'TTTTTTTT::::TTTTTTTT',
    ],
    warps: [
      { x: 8, y: 29, w: 4, to: 'park', tx: 10, ty: 1 },
      { x: 8, y: 0, w: 4, to: 'town', tx: 13, ty: 22 },
    ],
    npcs: [
      {
        id: 'tr_cletus2', x: 4, y: 21, look: 'hick', dir: 'right',
        trainer: { cls: 'REDNECK', name: 'JIMBO', team: [['JOE', 3], ['PAT', 3]], sight: 5, intro: ['Hey! You lookin\' at my crew?'], lose: 'Aw, shoot. Mama said I should\'ve been a plumber.', after: 'My crew\'s just tired. They had a big day of not working.', reward: 60 },
      },
      {
        id: 'tr_marge', x: 12, y: 16, look: 'nun', dir: 'left',
        trainer: { cls: 'CHURCH LADY', name: 'MARGE', team: [['GARY', 5]], sight: 3, intro: ['Young one! Have you accepted a free pamphlet?'], lose: 'Lord, give me patience. And a better fighter.', after: 'Gary is a project. We are all projects.', reward: 90 },
      },
      {
        id: 'tr_rusty', x: 14, y: 5, look: 'bum2', dir: 'left',
        trainer: { cls: 'SCRAPPER', name: 'RUSTY', team: [['STAN', 5], ['JOE', 4]], sight: 4, intro: ['This is MY stretch of track! All the copper here is mine!'], lose: 'Fine! Take the copper! There is no copper!', after: 'I already stripped this whole road. Twice.', reward: 80 },
      },
      { id: 'r1_barrel', x: 13, y: 6, look: 'bum', dir: 'right', talk: ['Cold out, huh? This barrel\'s been burning since 2009.', 'Nobody knows what\'s in it. It just keeps going.'] },
      { id: 'it_r1_sack', x: 1, y: 17, look: 'item', item: 'SACK' },
      { id: 'it_r1_burrito', x: 18, y: 1, look: 'item', item: 'BURRITO' },
      { id: 'it_r1_salts', x: 17, y: 25, look: 'item', item: 'SALTS' },
    ],
    signs: [{ x: 6, y: 6, text: 'RAIL YARD ROAD\nNorth: GRIMSBY\nSouth: PINE ACRES TRAILER PARK' }],
    enc: ROUTE1_ENC,
  },

  town: {
    id: 'town',
    name: 'GRIMSBY',
    indoor: false,
    music: 'town',
    bg: 'street',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T____________________________T',
      'T_hhhhhh___jjjjjj____ZZZZZ___T',
      'T_hhhhhh___jjjjjj____ZZZZZ___T',
      'T_NBkBNB___NBgBNB____HJHJH___T',
      'T_BNBEBN___BNBEBN____HJOJH___T',
      'T__l_________L__l______:____tT',
      'T____________________________T',
      'T__t___f_____________l_______T',
      'T____________________________T',
      '______________________________',
      '--------------------------X---',
      '==========================X===',
      '______________________________',
      'T.....DD.____=|=_____._""""".T',
      'T"""""..._t__=|=___..i"""""".T',
      'T""""""..____=|=___..""""""".T',
      'T"""""""%____=|=___.q.p""""..T',
      'T"""""""D____=|=___......""..T',
      'T%""""..._l__=|=___..,.......T',
      'T..%..x..____=|=___bb....,b..T',
      'TTTTTTTTT____=|=____TTTTTTTTTT',
      'TTTTTTTTT____=|=____TTTTTTTTTT',
      'TTTTTTTTTTTTT::::TTTTTTTTTTTTT',
    ],
    warps: [
      { x: 13, y: 23, w: 4, to: 'route1', tx: 8, ty: 1 },
      { x: 5, y: 5, to: 'soup', tx: 4, ty: 6, face: 'up' },
      { x: 14, y: 5, to: 'gas', tx: 4, ty: 6, face: 'up' },
      { x: 23, y: 5, to: 'trap', tx: 5, ty: 11, face: 'up' },
    ],
    npcs: [
      { id: 'cop', x: 25, y: 11, look: 'cop', dir: 'left', script: 'cop' },
      { id: 'cop2', x: 25, y: 12, look: 'cop', dir: 'left', script: 'cop' },
      { id: 't_preacher', x: 9, y: 8, look: 'preacher', dir: 'down', talk: ['THE END IS NEAR!', '...Not, like, today. But near. Ish.'] },
      { id: 't_skater', x: 18, y: 8, look: 'skater', dir: 'left', wander: true, talk: "Big Tony runs that trap house. Beat him and the whole block'll respect you." },
      { id: 't_granny', x: 4, y: 7, look: 'granny', dir: 'down', talk: ['The soup kitchen will patch your crew up for free.', "Sister Agnes doesn't ask questions. She's seen everything."] },
      {
        id: 'tr_dre', x: 7, y: 15, look: 'thug', dir: 'left',
        trainer: { cls: 'HUSTLER', name: 'DRE', team: [['MARV', 7]], sight: 3, intro: ["Five bucks says you can't find the queen."], lose: 'Man, you hustled the hustler.', after: 'Marv says the queen was in my pocket the whole time.', reward: 110 },
      },
      {
        id: 'tr_kyle', x: 24, y: 19, look: 'skater', dir: 'up',
        trainer: { cls: 'SKATE RAT', name: 'KYLE', team: [['DAVE', 6], ['PAT', 7]], sight: 4, intro: ['Duuude. This lot is OUR spot.'], lose: 'Gnarly. Bogus, but gnarly.', after: "We're not loitering, we're skating. Without boards.", reward: 100 },
      },
      { id: 'it_t_tape', x: 1, y: 20, look: 'item', item: 'TAPE' },
      { id: 'it_t_energy', x: 28, y: 14, look: 'item', item: 'ENERGY' },
    ],
    signs: [
      { x: 4, y: 4, text: 'ST. AGNES SOUP KITCHEN\nFree food! Free healing! No refunds.' },
      { x: 13, y: 4, text: 'GAS-N-GO\nOpen 24/7. Bathroom key on a hubcap.' },
      { x: 22, y: 5, text: 'Spray-painted on the porch: "NO COPS NO SOLICITORS NO JEHOVAH". Underneath: "BIG TONY".' },
      { x: 24, y: 5, text: 'Spray-painted on the porch: "NO COPS NO SOLICITORS NO JEHOVAH". Underneath: "BIG TONY".' },
    ],
    triggers: [],
    enc: ALLEY_ENC,
    enc2: { area: [19, 14, 29, 20], enc: LOT_ENC },
  },

  soup: {
    id: 'soup',
    name: 'ST. AGNES SOUP KITCHEN',
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w##w##w#',
      '.........',
      'zzzPzzzzL',
      '.........',
      '.t..t..t.',
      '.C..C..C.',
      '....M....',
    ],
    warps: [{ x: 4, y: 6, to: 'town', tx: 5, ty: 6, face: 'down' }],
    npcs: [
      { id: 'agnes', x: 3, y: 1, look: 'nun', dir: 'down', script: 'heal' },
      { id: 'soup_bum', x: 1, y: 3, look: 'bum2', dir: 'down', talk: "Wednesday is meatloaf day. Nobody knows what's in the meatloaf. Nobody asks." },
      { id: 'soup_lady', x: 7, y: 3, look: 'granny', dir: 'down', talk: 'That payphone in the corner connects to your STORAGE UNIT. Don\'t ask how. It\'s a very old payphone.' },
    ],
    signs: [{ x: 8, y: 2, text: '', script: 'storage' }],
    respawn: { map: 'soup', x: 4, y: 3 },
  },

  gas: {
    id: 'gas',
    name: 'GAS-N-GO',
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w##w##w#',
      'ZZZ...ZZZ',
      '.........',
      'zz$z.ZZ.Z',
      '.........',
      '.........',
      '....M....',
    ],
    warps: [{ x: 4, y: 6, to: 'town', tx: 14, ty: 6, face: 'down' }],
    npcs: [
      { id: 'clerk', x: 1, y: 2, look: 'clerk', dir: 'down', script: 'shop' },
      { id: 'gas_guy', x: 6, y: 5, look: 'hick', dir: 'up', wander: true, talk: "They got a hot dog roller in the back. Them dogs have been rollin' since the Super Bowl." },
    ],
    signs: [],
  },

  trap: {
    id: 'trap',
    name: "BIG TONY'S TRAP HOUSE",
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w#####w###',
      'm,,,c,,,,,x',
      ',,,,c,,,,,,',
      'x,,,,,,,,,m',
      ',,,,,,,,,,,',
      '###,,,,,###',
      ',,,,,,,,,,,',
      ',,m,,,,,x,,',
      ',,,,,,,,,,,',
      'xx,,,,,,,,x',
      ',,,,,,,,,,,',
      ',,,,,M,,,,,',
    ],
    warps: [{ x: 5, y: 11, to: 'town', tx: 23, ty: 6, face: 'down' }],
    npcs: [
      {
        id: 'tr_mikey', x: 3, y: 8, look: 'thug', dir: 'right',
        trainer: { cls: 'LOOKOUT', name: 'LIL MIKEY', team: [['LENNY', 9]], sight: 3, intro: ['Yo! Who let you in?! Lenny, get \'em!'], lose: 'Big Tony gon\' kill me.', after: "I'm not even supposed to be on this shift.", reward: 150 },
      },
      {
        id: 'tr_jay', x: 7, y: 6, look: 'thug2', dir: 'left',
        trainer: { cls: 'CORNER BOY', name: 'JAY', team: [['HANK', 8], ['LINDA', 9]], sight: 3, intro: ['You tryna see Tony? You gotta see ME first.'], lose: "A'ight, a'ight. Go 'head. Your funeral.", after: "Tony's in the back. He's been waiting for somebody like you. Or a pizza.", reward: 160 },
      },
      {
        id: 'tony', x: 5, y: 2, look: 'tony', dir: 'down',
        trainer: {
          cls: 'BOSS', name: 'BIG TONY', boss: true, team: [['MUMBLES', 10], ['LENNY', 11], ['TANK', 13]], sight: 0,
          intro: ['So. You\'re the kid from the trailer park bagging bums all over town.', 'This is MY block. Everybody on it works for me.', "Show me what your crew's got, and maybe I'll let you keep it."],
          lose: "...Hah! Okay, kid. Okay. You got real cred.",
          after: 'Take that CORNER CRED and get outta my house. Tell your Uncle Dale he still owes me forty bucks.',
          reward: 1300,
        },
      },
    ],
    signs: [{ x: 4, y: 1, text: 'A couch with no cushions. The cushions are in the walls, as insulation.' }],
  },
};

export function getMap(id: string): MapDef {
  const m = MAPS[id];
  if (!m) throw new Error('Unknown map ' + id);
  return m;
}
