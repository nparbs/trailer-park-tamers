export type ItemKind = 'catch' | 'heal' | 'cure' | 'revive';

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
  DEFIB: { name: 'Jumper Cables', kind: 'revive', price: 1500, revive: 0.5, desc: 'Brings a knocked-out crew member back with half HP.' },
} satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

export function item(id: ItemId): ItemDef {
  return ITEMS[id] as ItemDef;
}
