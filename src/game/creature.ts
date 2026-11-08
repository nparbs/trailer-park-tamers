import { move, type MoveId, type Status } from '../data/moves';
import { species, type SpeciesId } from '../data/species';
import type { ItemId } from '../data/items';

export interface MoveSlot {
  id: MoveId;
  pp: number;
}

/** A single drifter, either in your crew, in storage, or on the other side of a fight. */
export interface Drifter {
  sp: SpeciesId;
  nick?: string;
  level: number;
  exp: number;
  hp: number;
  moves: MoveSlot[];
  status: Status | null;
  statusTurns: number;
  ivs: { hp: number; atk: number; def: number; spd: number };
  caughtWith?: string;
  /** A held item (kind 'held') that works by itself in fights. */
  held?: ItemId;
}

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export type Rng = () => number;

export const MAX_LEVEL = 100;

export function displayName(d: Drifter) {
  return d.nick ?? species(d.sp).name;
}

export function stats(d: Drifter): Stats {
  const b = species(d.sp).base;
  const L = d.level;
  const s = (base: number, iv: number) => Math.floor(((2 * base + iv) * L) / 100) + 5;
  return {
    hp: Math.floor(((2 * b.hp + d.ivs.hp) * L) / 100) + L + 10,
    atk: s(b.atk, d.ivs.atk),
    def: s(b.def, d.ivs.def),
    spd: s(b.spd, d.ivs.spd),
  };
}

export function maxHp(d: Drifter) {
  return stats(d).hp;
}

/** Total experience needed to reach a level (the "medium fast" curve). */
export function expForLevel(level: number) {
  return level <= 1 ? 0 : level ** 3;
}

/** The last four moves a species knows by this level. */
export function movesAtLevel(sp: SpeciesId, level: number): MoveId[] {
  const known: MoveId[] = [];
  for (const [lv, id] of species(sp).learnset) {
    if (lv > level) break;
    if (!known.includes(id)) known.push(id);
  }
  return known.slice(-4);
}

export function makeDrifter(sp: SpeciesId, level: number, rng: Rng = Math.random): Drifter {
  const iv = () => Math.floor(rng() * 32);
  const d: Drifter = {
    sp,
    level,
    exp: expForLevel(level),
    hp: 0,
    moves: movesAtLevel(sp, level).map((id) => ({ id, pp: move(id).pp })),
    status: null,
    statusTurns: 0,
    ivs: { hp: iv(), atk: iv(), def: iv(), spd: iv() },
  };
  d.hp = maxHp(d);
  return d;
}

export function healFully(d: Drifter) {
  d.hp = maxHp(d);
  d.status = null;
  d.statusTurns = 0;
  for (const m of d.moves) m.pp = move(m.id).pp;
}

export interface LevelUpResult {
  level: number;
  newMoves: MoveId[];
}

/**
 * Add experience and return each level gained, with any moves learned at that level.
 * HP rises by the same amount as max HP, as in the handheld games.
 */
export function addExp(d: Drifter, amount: number): LevelUpResult[] {
  const out: LevelUpResult[] = [];
  d.exp += amount;
  while (d.level < MAX_LEVEL && d.exp >= expForLevel(d.level + 1)) {
    const before = maxHp(d);
    d.level++;
    d.hp += maxHp(d) - before;
    const newMoves = species(d.sp)
      .learnset.filter(([lv]) => lv === d.level)
      .map(([, id]) => id)
      .filter((id) => !d.moves.some((m) => m.id === id));
    out.push({ level: d.level, newMoves });
  }
  return out;
}

export function canEvolve(d: Drifter): SpeciesId | null {
  const evo = species(d.sp).evolves;
  return evo && d.level >= evo.level ? (evo.into as SpeciesId) : null;
}

export function evolve(d: Drifter, into: SpeciesId) {
  const before = maxHp(d);
  d.sp = into;
  d.hp = Math.max(1, d.hp + maxHp(d) - before);
}

/** Learn a move into a free slot. Returns false if all four slots are full. */
export function learnMove(d: Drifter, id: MoveId): boolean {
  if (d.moves.some((m) => m.id === id)) return true;
  if (d.moves.length >= 4) return false;
  d.moves.push({ id, pp: move(id).pp });
  return true;
}

export function replaceMove(d: Drifter, slot: number, id: MoveId) {
  d.moves[slot] = { id, pp: move(id).pp };
}
