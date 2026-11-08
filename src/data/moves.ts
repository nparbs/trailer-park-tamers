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

  // STRAPPED
  PISTOL_WHIP: { name: 'Pistol Whip', type: 'STRAPPED', power: 60, acc: 100, pp: 25 },
  WARNING_SHOT: { name: 'Warning Shot', type: 'STRAPPED', power: 0, acc: 100, pp: 20, stat: { who: 'foe', stat: 'atk', stages: -1 }, text: 'BLAM! Into the air. Everyone flinched.' },
  SPRAY_PRAY: { name: 'Spray & Pray', type: 'STRAPPED', power: 95, acc: 70, pp: 10 },
  CELEBRATORY: { name: 'Celebratory Fire', type: 'STRAPPED', power: 75, acc: 90, pp: 15, highCrit: true },
  TACTICAL: { name: 'Tactical Reload', type: 'STRAPPED', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'acc', stages: 2 } },

  // More vice
  HOTBOX: { name: 'Hotbox', type: 'CHEM', power: 0, acc: 75, pp: 15, inflict: { status: 'out', chance: 100 }, text: 'The air got real thick in here.' },
  MUNCHIES: { name: 'Munchies', type: 'CHEM', power: 0, acc: 0, pp: 10, heal: 0.5, text: 'Ate a whole sleeve of crackers.' },
  HIT_PIPE: { name: 'Hit the Pipe', type: 'CHEM', power: 0, acc: 0, pp: 15, stat: { who: 'self', stat: 'atk', stages: 2 } },
  LAB_BLAST: { name: 'Lab Explosion', type: 'CHEM', power: 130, acc: 85, pp: 5, recoil: 0.4, text: 'KA-BOOM! Somebody forgot to open a window.' },
  NOD_OFF: { name: 'Nod Off', type: 'CHEM', power: 0, acc: 0, pp: 10, heal: 0.5 },
  FORTY_SMASH: { name: '40oz Smash', type: 'BOOZE', power: 75, acc: 95, pp: 15 },
  LOKO_RAGE: { name: 'Loko Rage', type: 'BOOZE', power: 85, acc: 90, pp: 10, inflict: { status: 'wasted', chance: 30 } },
  HANDLE: { name: 'Pull from the Handle', type: 'BOOZE', power: 0, acc: 0, pp: 10, heal: 0.5 },
  MAD_SHIT: { name: 'Talk Mad Shit', type: 'SLICK', power: 0, acc: 100, pp: 20, stat: { who: 'foe', stat: 'def', stages: -2 } },
  SLAP_FIGHT: { name: 'Slap Fight', type: 'FERAL', power: 55, acc: 100, pp: 20, priority: 1 },
  MOG: { name: 'Mog', type: 'SLICK', power: 0, acc: 100, pp: 20, stat: { who: 'foe', stat: 'atk', stages: -2 }, text: 'Got absolutely mogged.' },
  MEWING: { name: 'Mewing', type: 'SLICK', power: 0, acc: 0, pp: 20, stat: { who: 'self', stat: 'def', stages: 2 } },
  BONE_SMASH: { name: 'Bone Smash', type: 'PSYCHO', power: 120, acc: 85, pp: 5, recoil: 0.33 },
  SAWZALL: { name: 'Sawzall', type: 'SCRAP', power: 80, acc: 95, pp: 15, highCrit: true },
  RE_UP: { name: 'Re-Up', type: 'SLICK', power: 0, acc: 0, pp: 10, heal: 0.5 },

  // The Bottoms
  SQUAT: { name: 'Squat', type: 'TOUGH', power: 0, acc: 0, pp: 15, stat: { who: 'self', stat: 'def', stages: 2 }, text: 'Changed the locks. This is home now.' },
  EVICT: { name: 'Eviction Notice', type: 'TOUGH', power: 80, acc: 95, pp: 10, text: 'Taped right to their forehead.' },
  MOONSHINE: { name: 'Moonshine', type: 'BOOZE', power: 90, acc: 90, pp: 10, inflict: { status: 'wasted', chance: 30 }, text: 'Blindingly strong. Possibly literally.' },
  NO_CONSENT: { name: 'I Do Not Consent', type: 'PSYCHO', power: 0, acc: 0, pp: 15, stat: { who: 'self', stat: 'def', stages: 2 }, text: '"I am TRAVELING, not FIGHTING."' },
  FAYGO: { name: 'Faygo Spray', type: 'PSYCHO', power: 60, acc: 100, pp: 20, stat: { who: 'foe', stat: 'acc', stages: -1, chance: 30 } },
  COPPER_STRIP: { name: 'Copper Strip', type: 'SCRAP', power: 70, acc: 95, pp: 15, drain: 0.25, text: 'Ripped the wiring right out of the wall.' },
  TROLL_TOLL: { name: 'Troll Toll', type: 'FERAL', power: 65, acc: 100, pp: 15, stat: { who: 'foe', stat: 'spd', stages: -1, chance: 50 }, text: '"Gotta pay the troll toll!"' },
  PORCH_GRAB: { name: 'Porch Grab', type: 'SLICK', power: 55, acc: 100, pp: 20, priority: 1 },

  // Taught by tutors (src/data/tutors.ts), not learned by levelling.
  BONG_CLEAR: { name: 'Bong Clear', type: 'CHEM', power: 70, acc: 95, pp: 15, inflict: { status: 'out', chance: 20 }, text: 'Cleared the whole bowl and coughed it in their face.' },
  COUCH_LOCK: { name: 'Couch Lock', type: 'CHEM', power: 0, acc: 90, pp: 20, stat: { who: 'foe', stat: 'spd', stages: -2 }, text: "They sank into the cushions. They live there now." },
  SMOKE_METH: { name: 'Smoke Meth', type: 'CHEM', power: 80, acc: 90, pp: 10, stat: { who: 'self', stat: 'spd', stages: 1 }, text: 'Eyes like dinner plates. Not sleeping till Thursday.' },
  SHOTGUN_BEER: { name: 'Shotgun a Beer', type: 'BOOZE', power: 40, acc: 100, pp: 30, priority: 1, text: 'Cracked it, chugged it, threw the can.' },
  KEG_STAND: { name: 'Keg Stand', type: 'BOOZE', power: 0, acc: 0, pp: 10, heal: 0.5, text: 'Upside down and chugging. The crowd went wild.' },
  SMASH_GRAB: { name: 'Smash & Grab', type: 'SLICK', power: 80, acc: 90, pp: 10 },
  FIVE_FINGER: { name: 'Five-Finger Discount', type: 'SLICK', power: 50, acc: 100, pp: 20, drain: 0.5, text: 'Helped themselves to a little something.' },
  SNITCH: { name: 'Snitch', type: 'SLICK', power: 0, acc: 85, pp: 10, stat: { who: 'foe', stat: 'acc', stages: -2 }, text: '"Officer, it was HIM!"' },
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
