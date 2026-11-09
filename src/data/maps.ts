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

export type EncTime = 'day' | 'night';

export interface Encounters {
  rate: number;
  /** species, min level, max level, weight, and optionally only by day or only at night */
  table: [SpeciesId, number, number, number, EncTime?][];
}

/** The rows of an encounter table that can show up right now. */
export function encountersFor(enc: Encounters, night: boolean) {
  return enc.table.filter((r) => !r[4] || (r[4] === 'night') === night);
}

export interface MapDef {
  id: string;
  name: string;
  indoor: boolean;
  /** One track, or several to pick from each time you arrive. */
  music: string | string[];
  bg: 'park' | 'street' | 'indoor';
  rows: string[];
  warps: Warp[];
  npcs: NpcDef[];
  signs?: { x: number; y: number; text: string; script?: string }[];
  triggers?: Trigger[];
  enc?: Encounters;
  /** A second encounter table for certain areas of the map (x0,y0,x1,y1 inclusive). */
  enc2?: { area: [number, number, number, number]; enc: Encounters };
  /** Items buried in trash piles, dumpsters and bins. Press A facing the spot. */
  hidden?: { x: number; y: number; item: ItemId; n?: number }[];
  /** Heals and respawns here count as this map's "last safe place". */
  respawn?: { map: string; x: number; y: number };
}

const ROUTE1_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['JOE', 2, 4, 25],
    ['GARY', 2, 4, 20, 'day'],
    ['TERRY', 3, 5, 12, 'night'],
    ['LARRY', 4, 5, 3, 'night'],
    ['MO', 2, 4, 15],
    ['PAT', 3, 4, 12],
    ['KENNY', 3, 4, 10],
    ['KYLE', 3, 4, 8],
    ['STAN', 3, 5, 6],
    ['DAVE', 4, 5, 4],
  ],
};

const CAMP_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['MUMBLES', 5, 7, 15],
    ['KENNY', 5, 7, 15],
    ['CAROL', 5, 7, 12],
    ['LISA', 5, 7, 12],
    ['NED', 5, 7, 12],
    ['BEV', 5, 7, 10, 'day'],
    ['MARV', 6, 8, 10, 'night'],
    ['MO', 5, 7, 10],
    ['TERRY', 6, 8, 8],
    ['BETTY', 7, 8, 6],
  ],
};

const LOT_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['DAVE', 6, 8, 15],
    ['CARL', 6, 8, 15],
    ['HANK', 6, 8, 12],
    ['LINDA', 6, 8, 12],
    ['LYLE', 6, 8, 12],
    ['CAL', 6, 8, 10],
    ['DEZ', 6, 8, 10],
    ['PHYLLIS', 7, 8, 6],
    ['SARGE', 7, 8, 4],
    ['GLEN', 7, 8, 4],
    ['LENNY', 7, 8, 9, 'night'],
  ],
};

const UNDERPASS_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['SID', 10, 12, 15],
    ['CLIFF', 10, 13, 12],
    ['MEL', 10, 12, 12],
    ['JUGGALO', 10, 13, 16, 'night'],
    ['PAM', 10, 12, 12],
    ['TRUDY', 11, 13, 10],
    ['STEVE', 11, 13, 10],
    ['KENNY', 11, 13, 8],
    ['NED', 11, 13, 6],
  ],
};

const LOT2_ENC: Encounters = {
  rate: 0.1,
  table: [
    ['BENNY', 10, 12, 15],
    ['DWIGHT', 10, 12, 15],
    ['PAM', 10, 12, 12],
    ['SID', 10, 12, 12],
    ['MO', 10, 12, 10],
    ['LISA', 10, 12, 10],
    ['DWAYNE', 11, 13, 8],
    ['MEL', 11, 13, 6],
    ['TERRY', 11, 13, 8, 'night'],
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
    music: ['park', 'park2'],
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
      'T#qp....::...P..QQQQQ..T',
      'T..#....::......yYeYy..T',
      'T..5....::.....,.......T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 4, y: 3, to: 'home', tx: 4, ty: 6, face: 'up' },
      { x: 19, y: 3, to: 'dale', tx: 4, ty: 6, face: 'up' },
      { x: 4, y: 10, to: 'granny', tx: 3, ty: 5, face: 'up' },
      { x: 14, y: 10, to: 'hick', tx: 3, ty: 5, face: 'up' },
      { x: 18, y: 13, to: 'lab', tx: 3, ty: 5, face: 'up' },
      { x: 10, y: 0, w: 4, to: 'route1', tx: 8, ty: 28 },
    ],
    npcs: [
      { id: 'park_kid', x: 7, y: 13, look: 'kid', dir: 'up', wander: true, talk: "My mom says if I don't stop running around she's gonna sell me to Uncle Dale for scrap." },
      { id: 'park_hick', x: 16, y: 7, look: 'hick', dir: 'left', wander: true, talk: ['Them people out on Rail Yard Road?', "Hang out in the weeds long enough and one'll jump right out at ya.", "Wear 'em down first, THEN bag 'em. That's just manners."] },
      { id: 'park_bum', x: 21, y: 12, look: 'bum', dir: 'down', talk: "I'm not homeless, I'm house-optional." },
      { id: 'it_p_van', x: 1, y: 14, look: 'item', item: 'VAN' },
    ],
    hidden: [{ x: 19, y: 9, item: 'SACK', n: 2 }],
    signs: [
      { x: 5, y: 4, text: 'Mailbox: "OCCUPANT". Also a court summons. Also a Little Caesars coupon.' },
      { x: 13, y: 12, text: 'A pink lawn flamingo. Somebody gave it a cigarette.' },
      { x: 17, y: 13, text: 'The windows are covered in tinfoil and the trailer is hissing. A sign says "NOT A METH LAB".' },
    ],
    triggers: [{ x: 10, y: 1, w: 4, script: 'need_starter', when: (f) => !f.starter }],
  },

  lab: {
    id: 'lab',
    name: 'NOT A METH LAB',
    indoor: true,
    music: 'lab',
    bg: 'indoor',
    rows: [
      '#w###w##',
      'HH,,,,HI',
      ',,,,,,,,',
      ',m,,,,x,',
      ',,,,,,,,',
      ',,,M,,,,',
    ],
    warps: [{ x: 3, y: 5, to: 'park', tx: 18, ty: 14, face: 'down' }],
    npcs: [
      {
        id: 'tr_cook', x: 4, y: 1, look: 'dale', dir: 'down',
        trainer: { cls: 'COOK', name: 'LARRY', team: [['KENNY', 5], ['LARRY', 5]], sight: 3, intro: ['WHOA. Shut the door! Do you have ANY idea how volatile this is?!'], lose: 'Fine. Fine! Just do not touch the blue stuff.', after: "This is a perfectly legal chemistry hobby. I'm making... soap.", reward: 200 },
      },
      { id: 'tut_tweaker', x: 6, y: 4, look: 'bum', dir: 'left', script: 'tutor' },
    ],
    signs: [
      { x: 0, y: 1, text: 'Beakers, tubes and a hot plate. Everything is labelled "SOAP".' },
      { x: 7, y: 1, text: 'A propane tank with a smiley face drawn on it. It is not smiling back.' },
    ],
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
    npcs: [
      { id: 'cletus', x: 4, y: 2, look: 'hick', dir: 'down', script: 'cletus' },
      { id: 'tut_drunk', x: 3, y: 3, look: 'bum', dir: 'left', script: 'tutor' },
    ],
  },

  route1: {
    id: 'route1',
    name: 'RAIL YARD ROAD',
    indoor: false,
    music: ['route', 'route2', 'camp'],
    bg: 'park',
    rows: [
      'TTTTTTTT::::TTTTTTTT',
      'T"""....::::...""".T',
      'T""""...::::..""""bT',
      'T""""...::::..""""bT',
      'T""""....::...""""TT',
      'T.u..v...::.......%T',
      'T..%..S..::...F....T',
      '#########::#########',
      '++++++++++++++++++++',
      '#########::#########',
      'T..5.D...::........T',
      'T~~~.....::..""""""T',
      'T~~~~....::..""""""T',
      'T~~~~~...::..""""""T',
      'T~~~~~...::..""""""T',
      'T~~~~....::........T',
      'T~~~.....::....%...T',
      'T.....a..::.444444.T',
      'T"""""...::...qp...T',
      'T"""""...::........T',
      'T"""""...::...T.T..T',
      'T........::........T',
      'T44b4444.:::::::...T',
      'T..b..u....v...:...T',
      'T......"""""...:...T',
      'T..o...""""""..:...T',
      'T......""""""..:...T',
      'T.....,"""""...:...T',
      'T.......::::::::...T',
      'TTTTTTTT::::TTTTTTTT',
    ],
    warps: [
      { x: 8, y: 29, w: 4, to: 'park', tx: 10, ty: 1 },
      { x: 8, y: 0, w: 4, to: 'town', tx: 14, ty: 24 },
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
      { id: 'it_r1_scratch', x: 1, y: 10, look: 'item', item: 'SCRATCHER' },
    ],
    hidden: [
      { x: 3, y: 6, item: 'SACK', n: 3 },
      { x: 15, y: 16, item: 'ENERGY' },
      { x: 5, y: 10, item: 'FORTY', n: 2 },
    ],
    signs: [{ x: 6, y: 6, text: 'RAIL YARD ROAD\nNorth: GRIMSBY\nSouth: PINE ACRES TRAILER PARK' }],
    enc: ROUTE1_ENC,
  },

  town: {
    id: 'town',
    name: 'GRIMSBY',
    indoor: false,
    music: ['town', 'town2', 'corner'],
    bg: 'street',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T______________________________T',
      'T_hhhhhh__jjjjjj__MMMMM__ZZZZZ_T',
      'T_hhhhhh__jjjjjj__MMMMM__ZZZZZ_T',
      'T_NBkBNB__NBgBNB__BNGNB__HJHJH_T',
      'T_BNBEBN__BNBEBN__BBEBB__HJOJH_T',
      'T__l________L___l______t______lT',
      'T_______f______________________T',
      '------CC------------------------',
      '======CC========================',
      'T______________II______________T',
      'T:::::::::::::_|=_=============T',
      'Tu"""""v""""":_|=_=nnnnnDDnnnn=T',
      'T:""""":""""":_|=_=nnnnn==nnnn=T',
      'T:""""":""""":_|=_=nnnnn==nnnn=T',
      'T:"""""::::::u_|=_=============T',
      'Ta:::::F::::F:_|=_nnnnn=xD====DT',
      'T:"""""":"""":_|=_nnnnn========T',
      'T:"""""":"""":_|=_nnnnnDZZZZZ==T',
      'T:"""""":"""":_|=_nnnnn=ZZZZZ==T',
      'T:"""""":"""":_|=_nnnnn=HJHJH==T',
      'T##"""""v::::x_|=_nnnnn=HJOJH==T',
      'T.5:::::::::::_|=______________T',
      'TTTTTTTTTTTTTT_|=_TTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTT_|=_TTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTT_|=_TTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 14, y: 25, w: 4, to: 'route1', tx: 8, ty: 1 },
      { x: 5, y: 5, to: 'soup', tx: 4, ty: 6, face: 'up' },
      { x: 13, y: 5, to: 'gas', tx: 4, ty: 6, face: 'up' },
      { x: 20, y: 5, to: 'skate', tx: 4, ty: 6, face: 'up' },
      { x: 27, y: 5, to: 'trap', tx: 5, ty: 11, face: 'up' },
      { x: 26, y: 21, to: 'grow', tx: 4, ty: 6, face: 'up' },
      { x: 31, y: 8, h: 2, to: 'bottoms', tx: 1, ty: 8 },
    ],
    npcs: [
      { id: 'cop', x: 28, y: 8, look: 'cop', dir: 'left', script: 'cop', when: (f) => !f.badge1 },
      { id: 'cop2', x: 28, y: 9, look: 'cop', dir: 'left', script: 'cop', when: (f) => !f.badge1 },
      { id: 'cop3', x: 28, y: 7, look: 'cop', dir: 'down', script: 'cop', when: (f) => !!f.badge1 },
      { id: 't_preacher', x: 9, y: 6, look: 'preacher', dir: 'down', talk: ['THE END IS NEAR!', '...Not, like, today. But near. Ish.'] },
      { id: 't_skater', x: 22, y: 7, look: 'skater', dir: 'left', wander: true, talk: ["Big Tony runs that trap house. Beat him and the whole block'll respect you.", 'Pawn & Skate sells boards. Hold on, you walk EVERYWHERE? Gross.'] },
      { id: 't_granny', x: 4, y: 7, look: 'granny', dir: 'down', talk: ['The soup kitchen will patch your crew up for free.', "Sister Agnes doesn't ask questions. She's seen everything."] },
      { id: 'dealer', x: 13, y: 11, look: 'thug', dir: 'right', script: 'dealer' },
      { id: 't_camp', x: 4, y: 16, look: 'bum', dir: 'right', wander: true, talk: ["Welcome to Tent City. Population: depends who's awake.", "Walk through the camp and somebody's gonna get in your face. That's how you meet people here."] },
      {
        id: 'tr_dre', x: 8, y: 15, look: 'thug', dir: 'left',
        trainer: { cls: 'HUSTLER', name: 'DRE', team: [['MARV', 7], ['KENNY', 7]], sight: 4, intro: ["Five bucks says you can't find the queen."], lose: 'Man, you hustled the hustler.', after: 'Marv says the queen was in my pocket the whole time.', reward: 120 },
      },
      {
        id: 'tr_corner', x: 18, y: 11, look: 'thug2', dir: 'down',
        trainer: { cls: 'CORNER BOY', name: 'TRAY', team: [['DEZ', 8], ['GLEN', 8]], sight: 3, intro: ["This my corner. You buyin' or you leavin'?"], lose: "Aight. Aight. You can stand here.", after: "Dez is the one sellin'. I'm just the one standin'.", reward: 150 },
      },
      {
        id: 'tr_kyle', x: 27, y: 15, look: 'skater', dir: 'left',
        trainer: { cls: 'SKATE RAT', name: 'KYLE', team: [['DAVE', 6], ['CARL', 6]], sight: 4, intro: ['Duuude. This lot is OUR spot.'], lose: 'Gnarly. Bogus, but gnarly.', after: "We're not loitering, we're skating. Without boards.", reward: 110 },
      },
      { id: 'it_t_tape', x: 5, y: 22, look: 'item', item: 'TAPE' },
      { id: 'it_t_shiv', x: 1, y: 22, look: 'item', item: 'SHIV' },
      { id: 'it_t_energy', x: 30, y: 21, look: 'item', item: 'ENERGY' },
      { id: 'it_t_seed', x: 12, y: 17, look: 'item', item: 'SEED' },
    ],
    signs: [
      { x: 4, y: 5, text: 'ST. AGNES SOUP KITCHEN\nFree food! Free healing! No refunds.' },
      { x: 6, y: 5, text: 'ST. AGNES SOUP KITCHEN\nFree food! Free healing! No refunds.' },
      { x: 12, y: 5, text: 'GAS-N-GO\nOpen 24/7. Bathroom key on a hubcap.' },
      { x: 14, y: 5, text: 'GAS-N-GO\nOpen 24/7. Bathroom key on a hubcap.' },
      { x: 19, y: 5, text: 'PAWN & SKATE\nWe buy gold. We sell boards. We ask nothing.' },
      { x: 21, y: 5, text: 'PAWN & SKATE\nWe buy gold. We sell boards. We ask nothing.' },
      { x: 26, y: 5, text: 'Spray-painted on the porch: "NO COPS NO SOLICITORS NO JEHOVAH". Underneath: "BIG TONY".' },
      { x: 28, y: 5, text: 'Spray-painted on the porch: "NO COPS NO SOLICITORS NO JEHOVAH". Underneath: "BIG TONY".' },
      { x: 25, y: 21, text: 'The windows are blacked out and the house is humming. It smells like a skunk got into a Grateful Dead concert.' },
      { x: 27, y: 21, text: 'The windows are blacked out and the house is humming. It smells like a skunk got into a Grateful Dead concert.' },
    ],
    triggers: [],
    hidden: [
      { x: 23, y: 6, item: 'SEED' },
      { x: 25, y: 12, item: 'JOINT', n: 2 },
      { x: 30, y: 16, item: 'LOKO' },
    ],
    enc: CAMP_ENC,
    enc2: { area: [18, 11, 30, 22], enc: LOT_ENC },
  },

  skate: {
    id: 'skate',
    name: 'PAWN & SKATE',
    indoor: true,
    music: 'shop',
    bg: 'indoor',
    rows: [
      '#U#w#U#w#',
      '.........',
      'zz$zzZ.Z.',
      '.........',
      '.c.....p.',
      '.........',
      '....M....',
    ],
    warps: [{ x: 4, y: 6, to: 'town', tx: 20, ty: 6, face: 'down' }],
    npcs: [
      { id: 'skateclerk', x: 2, y: 1, look: 'skater', dir: 'down', script: 'skateshop' },
      { id: 'skate_guy', x: 6, y: 4, look: 'hick', dir: 'left', wander: true, talk: "I pawned my wedding ring here. Then I bought it back. Then I pawned it again. It's like a savings account." },
      { id: 'tut_fence', x: 8, y: 5, look: 'thug2', dir: 'left', script: 'tutor' },
    ],
    signs: [
      { x: 1, y: 0, text: 'A wall of skateboards. Three of them still have the price tag from 1997.' },
      { x: 5, y: 0, text: 'A wall of skateboards. Three of them still have the price tag from 1997.' },
      { x: 5, y: 2, text: 'A glass case of rings, watches and a single prosthetic leg.' },
    ],
  },

  grow: {
    id: 'grow',
    name: 'THE GROW HOUSE',
    indoor: true,
    music: 'grow',
    bg: 'indoor',
    rows: [
      '#w#####w#',
      'G,G,G,G,G',
      ',,,,,,,,,',
      'g,g,g,,,,',
      ',,,,,,,,x',
      ',,,,,,,,,',
      ',,,,M,,,,',
    ],
    warps: [{ x: 4, y: 6, to: 'town', tx: 26, ty: 22, face: 'down' }],
    npcs: [
      {
        id: 'tr_grower', x: 7, y: 3, look: 'hick', dir: 'left',
        trainer: { cls: 'GROWER', name: 'SKUNK', team: [['KYLE', 8], ['NED', 9]], sight: 3, intro: ["Whoa whoa whoa. Close the door, you're letting the vibes out."], lose: "Heavy, man. Okay. Use the empty pots, I don't care.", after: 'Drop a BAG SEED in one of those empty pots. Come back in a bit and boom: joints.', reward: 140 },
      },
      { id: 'tut_stoner', x: 7, y: 5, look: 'skater', dir: 'left', script: 'tutor' },
    ],
    signs: [
      { x: 0, y: 3, text: '', script: 'pot0' },
      { x: 2, y: 3, text: '', script: 'pot1' },
      { x: 4, y: 3, text: '', script: 'pot2' },
      { x: 0, y: 1, text: 'A very healthy plant under a very hot lamp. It is not a tomato.' },
      { x: 8, y: 4, text: 'Pizza boxes and a fan pointed at nothing.' },
    ],
  },

  soup: {
    id: 'soup',
    name: 'ST. AGNES SOUP KITCHEN',
    indoor: true,
    music: 'soup',
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
    music: 'shop',
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
    warps: [{ x: 4, y: 6, to: 'town', tx: 13, ty: 6, face: 'down' }],
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
    music: 'trap',
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
    warps: [{ x: 5, y: 11, to: 'town', tx: 27, ty: 6, face: 'down' }],
    npcs: [
      {
        id: 'tr_mikey', x: 3, y: 8, look: 'thug', dir: 'right',
        trainer: { cls: 'LOOKOUT', name: 'LIL MIKEY', team: [['LENNY', 9]], sight: 3, intro: ['Yo! Who let you in?! Lenny, get \'em!'], lose: 'Big Tony gon\' kill me.', after: "I'm not even supposed to be on this shift.", reward: 150 },
      },
      {
        id: 'tr_jay', x: 7, y: 6, look: 'thug2', dir: 'left',
        trainer: { cls: 'CORNER BOY', name: 'JAY', team: [['KENNY', 8], ['LISA', 9]], sight: 3, intro: ['You tryna see Tony? You gotta see ME first.'], lose: "A'ight, a'ight. Go 'head. Your funeral.", after: "Tony's in the back. He's been waiting for somebody like you. Or a pizza.", reward: 160 },
      },
      {
        id: 'tony', x: 5, y: 2, look: 'tony', dir: 'down',
        trainer: {
          cls: 'BOSS', name: 'BIG TONY', boss: true, team: [['DEZ', 9], ['GLEN', 9], ['TANK', 11]], sight: 0,
          intro: ['So. You\'re the kid from the trailer park bagging bums all over town.', 'This is MY block. Everybody on it works for me.', "Show me what your crew's got, and maybe I'll let you keep it."],
          lose: "...Hah! Okay, kid. Okay. You got real cred.",
          after: 'Take that CORNER CRED and get outta my house. Tell your Uncle Dale he still owes me forty bucks.',
          reward: 1300,
        },
      },
    ],
    signs: [{ x: 4, y: 1, text: 'A couch with no cushions. The cushions are in the walls, as insulation.' }],
  },
  bottoms: {
    id: 'bottoms',
    name: 'THE BOTTOMS',
    indoor: false,
    music: ['bottoms', 'corner'],
    bg: 'street',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T______________________________T',
      'T_rrrrr_rrrrr_rrrrrrr_AAAAA_%D_T',
      'T_rrrrr_rrrrr_rrrrrrr_AAAAA____T',
      'T_BNBNB_BJBJB_BNBNBNB_sssss____T',
      'T_NBEBN_BJBJB_NBBEBBN_NNENN_m__T',
      'T__l_________f___________l_____T',
      'T______________________________T',
      '-------------------------------X',
      '===============================X',
      'T______________________________T',
      'T_AAAAA_AAAAA_VVVVVVVVVVVVVVVVVT',
      'T_AAAAA_AAAAA_VVVVVVVVVVVVVVVVVT',
      'T_BzBzB_BNBNB_UUUUUUUUUUUUUUUU#T',
      'T_NBEBN_NBEBN_UUKU11UUKUU11UKU#T',
      'T_____________UUU112UUU1UU2U1U#T',
      'T.:::::o:::.._U1UUUU3UU11UUUUU#T',
      'T.:c""""::%.._UUKU1UUUKUUU1UKU#T',
      'T.."""F""::.._UUU11UUUU12UUU1U#T',
      'T.o:"""""::.b_1UUUUU211UUUU3UU#T',
      'T#.::""""::.._UUKU1UUUKU1UUUK1#T',
      'T.%:::o:::::._U1UUU21UUUU11UUU#T',
      'T.5.........._UUU11UUUUUUUUU1x#T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 0, y: 8, h: 2, to: 'town', tx: 30, ty: 8 },
      { x: 4, y: 5, to: 'row1', tx: 3, ty: 5, face: 'up' },
      { x: 17, y: 5, to: 'slum', tx: 5, ty: 11, face: 'up' },
      { x: 24, y: 5, to: 'bodega', tx: 4, ty: 6, face: 'up' },
      { x: 4, y: 14, to: 'tattoo', tx: 3, ty: 5, face: 'up' },
      { x: 10, y: 14, to: 'clinic', tx: 4, ty: 6, face: 'up' },
    ],
    npcs: [
      { id: 'b_greeter', x: 3, y: 7, look: 'bum2', dir: 'right', talk: ["Welcome to THE BOTTOMS. Lowest point in the county. Water runs downhill, and so does everything else.", 'The guy who owns all the row houses is a slumlord named SAL. Rent is due every day. Nothing ever gets fixed.'] },
      { id: 'b_porch', x: 12, y: 6, look: 'granny', dir: 'down', talk: ["Somebody stole my packages again. All four of 'em. I didn't even order anything."] },
      { id: 'b_moped', x: 25, y: 7, look: 'hick', dir: 'left', wander: true, talk: ["They say there's a whole camp under the overpass. You hear 'em at night, singing. Badly."] },
      {
        id: 'tr_ricky', x: 8, y: 7, look: 'bum', dir: 'down',
        trainer: { cls: 'SQUATTER', name: 'RICKY', team: [['SID', 12], ['PAM', 12]], sight: 3, intro: ['This sidewalk is occupied! I been standin\' here thirty days. That makes it MINE.'], lose: "Fine. I'll go squat somewhere else. Like that other spot right there.", after: "Possession is nine tenths of the law. I'm workin' on the other tenth.", reward: 240 },
      },
      {
        id: 'tr_gus', x: 22, y: 15, look: 'bum2', dir: 'left',
        trainer: { cls: 'BRIDGE TROLL', name: 'GUS', team: [['TRUDY', 13], ['CLIFF', 13]], sight: 4, intro: ['Nobody crosses under MY bridge without payin\' the toll!'], lose: 'Okay, okay. Toll waived. This one time.', after: 'Trudy taught me the troll toll. Trudy taught me everything.', reward: 260 },
      },
      {
        id: 'tr_doobie', x: 26, y: 19, look: 'juggalo', dir: 'left',
        trainer: { cls: 'JUGGALO', name: 'DOOBIE', team: [['JUGGALO', 13], ['JUGGALO', 14]], sight: 3, intro: ['WHOOP WHOOP! You wanna get sprayed, ninja?! ...I mean, with soda.'], lose: 'Magic. Absolute magic. How did you even DO that.', after: 'Me and my cousin are family. Like, actually. We are cousins.', reward: 250 },
      },
      { id: 'rival2', x: 16, y: 16, look: 'rival', dir: 'left', script: 'rival2', when: (f) => !!f.badge1 && !f.rival2 },
      { id: 'it_b_flask', x: 12, y: 22, look: 'item', item: 'FLASK' },
      { id: 'it_b_energy', x: 29, y: 13, look: 'item', item: 'ENERGY' },
      { id: 'it_b_van', x: 1, y: 16, look: 'item', item: 'VAN' },
      { id: 'it_b_casserole', x: 1, y: 22, look: 'item', item: 'CASSEROLE' },
    ],
    hidden: [
      { x: 10, y: 17, item: 'DEFIB' },
      { x: 29, y: 2, item: 'CASSEROLE' },
    ],
    signs: [
      { x: 31, y: 8, text: 'ROAD CLOSED. BRIDGE OUT.\nA second sign under it says "BRIDGE WAS NEVER IN".' },
      { x: 31, y: 9, text: 'ROAD CLOSED. BRIDGE OUT.\nA second sign under it says "BRIDGE WAS NEVER IN".' },
      { x: 9, y: 5, text: 'CONDEMNED. Someone has crossed it out and written "NEGOTIABLE".' },
      { x: 11, y: 5, text: 'CONDEMNED. Someone has crossed it out and written "NEGOTIABLE".' },
      { x: 15, y: 5, text: "SAL'S PROPERTIES\nRent due: today. And tomorrow. No pets, no guests, no complaints." },
      { x: 19, y: 5, text: "SAL'S PROPERTIES\nRent due: today. And tomorrow. No pets, no guests, no complaints." },
      { x: 23, y: 5, text: 'LUCKY STAR DELI & GROCERY\nCold beer. Hot sandwiches. Mean cat.' },
      { x: 25, y: 5, text: 'LUCKY STAR DELI & GROCERY\nCold beer. Hot sandwiches. Mean cat.' },
      { x: 3, y: 13, text: 'INK HOLE TATTOO\nWalk-ins welcome. Spelling not guaranteed.' },
      { x: 5, y: 13, text: 'INK HOLE TATTOO\nWalk-ins welcome. Spelling not guaranteed.' },
      { x: 9, y: 14, text: 'BOTTOMS FREE CLINIC\nNo insurance? No problem. No doctor? Also no problem.' },
      { x: 11, y: 14, text: 'BOTTOMS FREE CLINIC\nNo insurance? No problem. No doctor? Also no problem.' },
    ],
    triggers: [{ x: 14, y: 13, h: 10, script: 'rival2', when: (f) => !!f.badge1 && !f.rival2 }],
    enc: UNDERPASS_ENC,
    enc2: { area: [1, 16, 12, 22], enc: LOT2_ENC },
  },

  row1: {
    id: 'row1',
    name: 'ROW HOUSE',
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w###w#',
      'V,,,,,B',
      ',,,,,,,',
      ',cc,,,t',
      ',,,,,,,',
      ',,,M,,,',
    ],
    warps: [{ x: 3, y: 5, to: 'bottoms', tx: 4, ty: 6, face: 'down' }],
    npcs: [{ id: 'miss_dot', x: 4, y: 2, look: 'granny', dir: 'down', script: 'miss_dot' }],
    signs: [{ x: 0, y: 1, text: 'A TV with a coat hanger for an antenna. It only gets the weather channel and one preacher.' }],
  },

  slum: {
    id: 'slum',
    name: "SAL'S PROPERTIES",
    indoor: true,
    music: 'trap',
    bg: 'indoor',
    rows: [
      '#w###w###w#',
      'Z,,,,,,,,,Z',
      ',,,,,,,,,,,',
      'B,,,,,,,,,B',
      '###,,,,,###',
      ',,,,,,,,,,,',
      'c,,,,,,,,,t',
      '###,,,,,###',
      ',,,,,,,,,,,',
      'x,,,,,,,,,K',
      ',,,,,,,,,,,',
      ',,,,,M,,,,,',
    ],
    warps: [{ x: 5, y: 11, to: 'bottoms', tx: 17, ty: 6, face: 'down' }],
    npcs: [
      {
        id: 'tr_darnell', x: 3, y: 8, look: 'thug', dir: 'right',
        trainer: { cls: 'TENANT', name: 'DARNELL', team: [['DWIGHT', 14], ['BENNY', 14]], sight: 3, intro: ["You here to fix the sink? No? Then you're here to fight."], lose: "Figures. Nothin' in this building works. Including me.", after: "The sink's been dripping since 2015. Sal says it's 'a water feature'.", reward: 280 },
      },
      {
        id: 'tr_pearl', x: 7, y: 5, look: 'granny', dir: 'left',
        trainer: { cls: 'TENANT', name: 'MS. PEARL', team: [['DWAYNE', 15], ['STEVE', 14]], sight: 3, intro: ['Forty years in this building, child. I have outlived three landlords. Sal is next.'], lose: 'Mm-hm. You got spirit. Go give that man a piece of it.', after: 'Tell Sal I want my security deposit. From 1984.', reward: 300 },
      },
      {
        id: 'tr_hector', x: 8, y: 9, look: 'super', dir: 'left',
        trainer: { cls: 'SUPER', name: 'HECTOR', team: [['CLIFF', 14], ['SID', 15]], sight: 2, intro: ["I'm the super. I don't fix things. I fight people who want things fixed."], lose: 'Okay. I will put in a work order. It will be ignored.', after: 'The boiler is held together with duct tape and prayer. Mostly duct tape.', reward: 280 },
      },
      {
        id: 'sal', x: 5, y: 2, look: 'slumlord', dir: 'down',
        trainer: {
          cls: 'SLUMLORD', name: 'SAL', boss: true, team: [['TRUDY', 16], ['CLIFF', 16], ['STEVE', 17], ['ADVERSE', 19]], sight: 0,
          intro: ["Well, well. A new tenant. Rent's due.", 'Everything in the Bottoms belongs to me. The houses, the bridge, the rats. Especially the rats.', "You want respect down here? You're gonna have to EVICT me."],
          lose: '...You beat me? In MY building? That is a lease violation.',
          after: "Take the SECURITY DEPOSIT and get out. You'll never get the real one back. Nobody ever does.",
          reward: 2200,
        },
      },
    ],
    signs: [
      { x: 0, y: 1, text: 'A shelf of binders labelled EVICTIONS A-M, EVICTIONS N-Z and EVICTIONS (FUN).' },
      { x: 10, y: 1, text: 'A framed photo of SAL shaking hands with SAL.' },
    ],
  },

  bodega: {
    id: 'bodega',
    name: 'LUCKY STAR DELI',
    indoor: true,
    music: 'shop',
    bg: 'indoor',
    rows: [
      '#I#w#I#w#',
      '.........',
      'zz$zz.I.I',
      '.........',
      '.p.....I.',
      '.........',
      '....M....',
    ],
    warps: [{ x: 4, y: 6, to: 'bottoms', tx: 24, ty: 6, face: 'down' }],
    npcs: [
      { id: 'deli', x: 2, y: 1, look: 'clerk2', dir: 'down', script: 'bodega' },
      { id: 'deli_guy', x: 6, y: 4, look: 'bum', dir: 'left', wander: true, talk: ["The cat runs this store. The guy at the counter just works for the cat."] },
    ],
    signs: [
      { x: 6, y: 2, text: 'A cooler of tallboys. One door is held shut with a bungee cord.' },
      { x: 8, y: 2, text: 'A cooler of tallboys. One door is held shut with a bungee cord.' },
      { x: 1, y: 4, text: 'The bodega cat is asleep on the bread. Nobody is moving the cat.' },
    ],
  },

  tattoo: {
    id: 'tattoo',
    name: 'INK HOLE TATTOO',
    indoor: true,
    music: 'inside',
    bg: 'indoor',
    rows: [
      '#w###w#',
      'C,,,,,x',
      ',,,,,,,',
      'p,,,,,C',
      ',,,,,,,',
      ',,,M,,,',
    ],
    warps: [{ x: 3, y: 5, to: 'bottoms', tx: 4, ty: 15, face: 'down' }],
    npcs: [
      { id: 'inky', x: 3, y: 1, look: 'tattoo', dir: 'down', script: 'tattoo' },
      { id: 'ink_guy', x: 5, y: 3, look: 'thug2', dir: 'left', talk: ['I got my ex\'s name tattooed on my neck. Then I got a new ex. Then I got a neck scarf.'] },
    ],
    signs: [{ x: 6, y: 1, text: 'Flash art on the wall: a skull, a rose, a skull holding a rose, and a rose holding a skull.' }],
  },

  clinic: {
    id: 'clinic',
    name: 'BOTTOMS FREE CLINIC',
    indoor: true,
    music: 'soup',
    bg: 'indoor',
    rows: [
      '#w##w##w#',
      '.........',
      'zzzPzzzzL',
      '.........',
      'B..C.C..B',
      '.........',
      '....M....',
    ],
    warps: [{ x: 4, y: 6, to: 'bottoms', tx: 10, ty: 15, face: 'down' }],
    npcs: [
      { id: 'nurse', x: 3, y: 1, look: 'nurse', dir: 'down', script: 'clinic' },
      { id: 'clinic_guy', x: 6, y: 5, look: 'bum2', dir: 'up', talk: ["I've been in the waiting room since Tuesday. I came in for a splinter. I have two now."] },
    ],
    signs: [{ x: 8, y: 2, text: '', script: 'storage' }],
    respawn: { map: 'clinic', x: 4, y: 3 },
  },
};

export function getMap(id: string): MapDef {
  const m = MAPS[id];
  if (!m) throw new Error('Unknown map ' + id);
  return m;
}

/** Your cousin's crew under the overpass: two new guys and his starter, evolved. */
export function rival2Team(evolvedStarter: SpeciesId): [SpeciesId, number][] {
  return [['DAVE', 11], ['KENNY', 11], [evolvedStarter, 14]];
}
