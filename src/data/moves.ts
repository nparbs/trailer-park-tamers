import type { TypeId } from './types';

export type Stat = 'atk' | 'def' | 'spd' | 'acc';
export type Status = 'out' | 'sick' | 'wasted';

export interface MoveDef {
  name: string;
  type: TypeId;
  power: number; // 0 = status move
  acc: number; // 0..100, 0 = never misses
  pp: number;
  priority?: number;
  /** Stat change applied after the hit: target 'self' or 'foe'. */
  stat?: { who: 'self' | 'foe'; stat: Stat; stages: number; chance?: number };
  /** Status inflicted on the foe. */
  inflict?: { status: Status; chance: number };
  heal?: number; // fraction of max HP the user heals
  drain?: number; // fraction of damage dealt healed back
  recoil?: number; // fraction of damage dealt taken back
  highCrit?: boolean;
  text?: string; // extra flavour line after use
}

export const MOVES = {
  // STREET
  SHOVE: { name: 'Shove', type: 'STREET', power: 40, acc: 100, pp: 35 },
  PANHANDLE: { name: 'Panhandle', type: 'STREET', power: 0, acc: 100, pp: 30, stat: { who: 'foe', stat: 'def', stages: -1 }, text: '"Spare some change?"' },
  SPIT: { name: 'Spit', type: 'STREET', power: 0, acc: 100, pp: 30, stat: { who: 'foe', stat: 'acc', stages: -1 } },
  CURB_STOMP: { name: 'Curb Kick', type: 'STREET', power: 70, acc: 95, pp: 15 },
  BUM_RUSH: { name: 'Bum Rush', type: 'STREET', power: 90, acc: 90, pp: 10, recoil: 0.25 },
  SIGN_SLAP: { name: 'Sign Slap', type: 'STREET', power: 55, acc: 100, pp: 25 },
  NAP: { name: 'Bench Nap', type: 'STREET', power: 0, acc: 0, pp: 10, heal: 0.5 },

  // BOOZE
  BOTTLE_SMASH: { name: 'Bottle Smash', type: 'BOOZE', power: 50, acc: 95, pp: 25 },
  BEER_BREATH: { name: 'Beer Breath', type: 'BOOZE', power: 0, acc: 80, pp: 20, inflict: { status: 'wasted', chance: 100 } },
  LIQUID_COURAGE: { name: 'Liquid Courage', type: 'BOOZE', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'atk', stages: 2 } },
  PROJECTILE_PUKE: { name: 'Hurl', type: 'BOOZE', power: 80, acc: 90, pp: 10, inflict: { status: 'sick', chance: 20 } },
  BENDER: { name: 'Three-Day Bender', type: 'BOOZE', power: 110, acc: 85, pp: 5, recoil: 0.33 },

  // CHEM
  TWITCH: { name: 'Twitch Jab', type: 'CHEM', power: 45, acc: 100, pp: 30, priority: 1 },
  FUMES: { name: 'Fumes', type: 'CHEM', power: 0, acc: 85, pp: 25, inflict: { status: 'sick', chance: 100 } },
  TWEAK_OUT: { name: 'Tweak Out', type: 'CHEM', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'spd', stages: 2 } },
  BAD_TRIP: { name: 'Bad Trip', type: 'CHEM', power: 65, acc: 95, pp: 15, inflict: { status: 'wasted', chance: 30 } },
  CHEM_BURN: { name: 'Lab Fire', type: 'CHEM', power: 95, acc: 90, pp: 10, inflict: { status: 'sick', chance: 30 } },

  // HOLY
  SERMON: { name: 'Sermon', type: 'HOLY', power: 0, acc: 90, pp: 25, inflict: { status: 'out', chance: 100 }, text: 'It was a looong sermon.' },
  BIBLE_THUMP: { name: 'Bible Thump', type: 'HOLY', power: 50, acc: 100, pp: 25 },
  REPENT: { name: 'Repent!', type: 'HOLY', power: 0, acc: 100, pp: 20, stat: { who: 'foe', stat: 'atk', stages: -1 } },
  LAYING_HANDS: { name: 'Laying Hands', type: 'HOLY', power: 0, acc: 0, pp: 10, heal: 0.5 },
  BRIMSTONE: { name: 'Fire & Brimstone', type: 'HOLY', power: 90, acc: 95, pp: 10 },

  // PSYCHO
  RANT: { name: 'Rant', type: 'PSYCHO', power: 50, acc: 100, pp: 25 },
  STARE: { name: '1000-Yard Stare', type: 'PSYCHO', power: 0, acc: 100, pp: 30, stat: { who: 'foe', stat: 'spd', stages: -1 } },
  CONSPIRACY: { name: 'Conspiracy', type: 'PSYCHO', power: 65, acc: 100, pp: 15, inflict: { status: 'wasted', chance: 20 }, text: '"Birds aren\'t real!"' },
  SCREECH: { name: 'Screech', type: 'PSYCHO', power: 0, acc: 85, pp: 30, stat: { who: 'foe', stat: 'def', stages: -2 } },
  MELTDOWN: { name: 'Meltdown', type: 'PSYCHO', power: 100, acc: 90, pp: 10 },

  // TOUGH
  HEADBUTT: { name: 'Headbutt', type: 'TOUGH', power: 60, acc: 100, pp: 25 },
  TOUGH_IT_OUT: { name: 'Tough It Out', type: 'TOUGH', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'def', stages: 2 } },
  HAYMAKER: { name: 'Haymaker', type: 'TOUGH', power: 85, acc: 90, pp: 15, highCrit: true },
  DRILL_SGT: { name: 'Drill Sergeant', type: 'TOUGH', power: 0, acc: 90, pp: 20, stat: { who: 'foe', stat: 'atk', stages: -1 }, text: '"DROP AND GIMME TWENTY!"' },
  CHOKEHOLD: { name: 'Chokehold', type: 'TOUGH', power: 75, acc: 95, pp: 10, stat: { who: 'foe', stat: 'spd', stages: -1, chance: 30 } },

  // SLICK
  PICKPOCKET: { name: 'Pickpocket', type: 'SLICK', power: 40, acc: 100, pp: 30, priority: 1 },
  FAST_TALK: { name: 'Fast Talk', type: 'SLICK', power: 0, acc: 100, pp: 20, stat: { who: 'foe', stat: 'acc', stages: -1 } },
  THREE_CARD: { name: 'Three-Card Trick', type: 'SLICK', power: 65, acc: 100, pp: 15, highCrit: true },
  SUCKER_PUNCH: { name: 'Sucker Punch', type: 'SLICK', power: 70, acc: 100, pp: 10, priority: 1 },
  HUSTLE: { name: 'Hustle', type: 'SLICK', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'spd', stages: 2 } },

  // FERAL
  BITE: { name: 'Bite', type: 'FERAL', power: 55, acc: 100, pp: 25 },
  SCRATCH: { name: 'Dirty Nails', type: 'FERAL', power: 40, acc: 100, pp: 35, inflict: { status: 'sick', chance: 10 } },
  FLEAS: { name: 'Flea Swarm', type: 'FERAL', power: 0, acc: 90, pp: 20, inflict: { status: 'sick', chance: 100 } },
  PIGEON_STORM: { name: 'Pigeon Storm', type: 'FERAL', power: 80, acc: 95, pp: 10 },
  HOWL: { name: 'Howl at Moon', type: 'FERAL', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'atk', stages: 1 } },
  LEECH: { name: 'Mooch', type: 'FERAL', power: 50, acc: 100, pp: 15, drain: 0.5 },

  // SCRAP
  CAN_TOSS: { name: 'Can Toss', type: 'SCRAP', power: 45, acc: 100, pp: 30 },
  CART_RAM: { name: 'Cart Ram', type: 'SCRAP', power: 75, acc: 95, pp: 15 },
  HUBCAP: { name: 'Hubcap Fling', type: 'SCRAP', power: 60, acc: 95, pp: 20, highCrit: true },
  RUSTY_PIPE: { name: 'Rusty Pipe', type: 'SCRAP', power: 90, acc: 90, pp: 10, inflict: { status: 'sick', chance: 20 } },
  TARP_UP: { name: 'Tarp Up', type: 'SCRAP', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'def', stages: 1 } },
} satisfies Record<string, MoveDef>;

export type MoveId = keyof typeof MOVES;

export function move(id: MoveId): MoveDef {
  return MOVES[id] as MoveDef;
}

export const STATUS_NAME: Record<Status, string> = {
  out: 'OUT',
  sick: 'SICK',
  wasted: 'WSTD',
};
