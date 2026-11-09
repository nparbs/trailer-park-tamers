export type ItemKind = 'catch' | 'heal' | 'cure' | 'revive' | 'key' | 'seed' | 'held';

export interface ItemDef {
  name: string;
  kind: ItemKind;
  price: number;
  desc: string;
  catchBonus?: number;
  heal?: number; // HP restored (9999 = full)
  cures?: boolean;
  revive?: number; // fraction of HP when revived
}

export const ITEMS = {
  SACK: { name: 'Burlap Sack', kind: 'catch', price: 100, catchBonus: 1, desc: 'Throw it over their head. Classic.' },
  TAPE: { name: 'Duct Tape', kind: 'catch', price: 350, catchBonus: 1.5, desc: 'Fixes anything, holds anyone.' },
  VAN: { name: 'Van Keys', kind: 'catch', price: 900, catchBonus: 2.5, desc: 'Keys to a white van with no windows. Smells like old fries.' },
  BURRITO: { name: 'Gas Stn Burrito', kind: 'heal', price: 150, heal: 25, desc: 'Restores 25 HP. Microwave not included.' },
  ENERGY: { name: 'Energy Drink', kind: 'heal', price: 400, heal: 60, desc: 'Restores 60 HP. Heart rate not guaranteed.' },
  CASSEROLE: { name: 'Church Casserole', kind: 'heal', price: 1000, heal: 9999, desc: 'Fully restores HP. Made with love and cream of mushroom.' },
  SALTS: { name: 'Smelling Salts', kind: 'cure', price: 120, cures: true, desc: 'Cures OUT, SICK and WASTED.' },
  FORTY: { name: '40oz Malt Liquor', kind: 'heal', price: 200, heal: 40, desc: 'Restores 40 HP. Comes in a paper bag for dignity.' },
  LOKO: { name: 'Four Loko', kind: 'heal', price: 300, heal: 50, cures: true, desc: 'Restores 50 HP and cures status. Banned in some states.' },
  JOINT: { name: 'Joint', kind: 'heal', price: 250, heal: 30, cures: true, desc: 'Restores 30 HP and calms them down. Puff puff pass.' },
  PILLS: { name: 'Bootleg Pills', kind: 'heal', price: 700, heal: 9999, desc: 'Fully restores HP. Pressed in a garage. Probably fine.' },
  SEED: { name: 'Bag Seed', kind: 'seed', price: 150, desc: 'Plant it in a pot at the grow house. Harvest JOINTS later.' },
  SKATEBOARD: { name: 'Skateboard', kind: 'key', price: 1000, desc: 'Use it, or press SELECT/Shift, to skate around twice as fast.' },
  BOLT: { name: 'Bolt Cutters', kind: 'key', price: 0, desc: "Uncle Dale's. Face a zip-tied weak spot in a fence and press A to cut through." },
  // Held items: give one to a crew member and it works on its own in fights.
  SCRATCHER: { name: 'Lucky Scratcher', kind: 'held', price: 1200, desc: 'Held: doubles the odds of a critical hit. Not a winner yet, but due.' },
  FLASK: { name: 'Hip Flask', kind: 'held', price: 800, desc: 'Held: under half HP, they take a pull and heal a quarter. One use.' },
  SHIV: { name: 'Toothbrush Shiv', kind: 'held', price: 1500, desc: 'Held: attacks hit 20% harder. Made in county lockup.' },
  DEFIB: { name: 'Jumper Cables', kind: 'revive', price: 1500, revive: 0.5, desc: 'Brings a knocked-out crew member back with half HP.' },
} satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

export function item(id: ItemId): ItemDef {
  return ITEMS[id] as ItemDef;
}
