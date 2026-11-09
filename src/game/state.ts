import type { ItemId } from '../data/items';
import { healFully, type Drifter } from './creature';

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface GameState {
  version: 1;
  name: string;
  /** Which player look (0-5) you picked. */
  outfit: number;
  rival: string;
  map: string;
  x: number;
  y: number;
  facing: Dir;
  party: Drifter[];
  storage: Drifter[];
  bag: Partial<Record<ItemId, number>>;
  money: number;
  flags: Record<string, boolean>;
  badges: string[];
  /** Where you wake up after your crew gets knocked out. */
  respawn: { map: string; x: number; y: number };
  seen: string[];
  caught: string[];
  playMs: number;
  /** Grow house pots: play time (ms) when a seed went in. */
  grow: Record<string, number>;
  /** Trash piles already dug through: the day number they were searched. */
  scav: Record<string, number>;
}

const KEY = 'tpt-save-v1';
export type Slot = 1 | 2;
/** The slot the current game saves into. */
export let slot: Slot = 1;
export function setSlot(s: Slot) {
  slot = s;
}
const keyFor = (s: Slot) => (s === 2 ? KEY + '-s2' : KEY);

export function newGame(): GameState {
  return {
    version: 1,
    name: 'KID',
    outfit: 0,
    rival: 'BOBBY RAY',
    map: 'home',
    x: 1,
    y: 2,
    facing: 'down',
    party: [],
    storage: [],
    bag: { BURRITO: 1 },
    money: 300,
    flags: {},
    badges: [],
    respawn: { map: 'home', x: 4, y: 5 },
    seen: [],
    caught: [],
    playMs: 0,
    grow: {},
    scav: {},
  };
}

/** The running game. Scenes read and write this directly. */
export let G: GameState = newGame();

export function setState(s: GameState) {
  G = s;
}

export function hasSave(s: Slot = slot) {
  try {
    return !!localStorage.getItem(keyFor(s));
  } catch {
    return false;
  }
}

export function save(): boolean {
  try {
    localStorage.setItem(keyFor(slot), JSON.stringify(G));
    return true;
  } catch {
    return false;
  }
}

export function load(s: Slot = slot): boolean {
  try {
    const raw = localStorage.getItem(keyFor(s));
    if (!raw) return false;
    return loadFrom(JSON.parse(raw));
  } catch {
    return false;
  }
}

/** The raw save in a slot on this browser, or null. */
export function peekLocal(s: Slot): GameState | null {
  try {
    const raw = localStorage.getItem(keyFor(s));
    const v = raw ? JSON.parse(raw) : null;
    return v && v.version === 1 ? v : null;
  } catch {
    return null;
  }
}

/** Load a save that came from somewhere else (the server). */
export function loadFrom(s: unknown): boolean {
  if (!s || typeof s !== 'object' || (s as GameState).version !== 1) return false;
  G = { ...newGame(), ...(s as GameState) };
  return true;
}

export function addItem(id: ItemId, n = 1) {
  G.bag[id] = (G.bag[id] ?? 0) + n;
}

export function healParty() {
  for (const d of G.party) healFully(d);
}

export function markSeen(sp: string) {
  if (!G.seen.includes(sp)) G.seen.push(sp);
}

export function markCaught(sp: string) {
  markSeen(sp);
  if (!G.caught.includes(sp)) G.caught.push(sp);
}

/** Add a new drifter to the crew, or to storage if the crew is full. Returns where it went. */
export function recruit(d: Drifter): 'party' | 'storage' {
  markCaught(d.sp);
  if (G.party.length < 6) {
    G.party.push(d);
    return 'party';
  }
  G.storage.push(d);
  return 'storage';
}
