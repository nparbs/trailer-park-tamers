// Messages between the game page and the server. Both sides import this file.

import type { Action, BattleEvent, BattleResult } from '../game/battle';
import type { Drifter } from '../game/creature';
import type { Dir } from '../game/state';
import { MOVES, type MoveId } from '../data/moves';
import { SPECIES, type SpeciesId } from '../data/species';

/** Bump when the page and server can no longer talk to each other. */
export const PROTOCOL_VERSION = 1;

export const MAX_NAME = 10;
export const MAX_CHAT = 90;
export const OUTFITS = 6;

export interface PlayerInfo {
  id: string;
  name: string;
  outfit: number;
  x: number;
  y: number;
  dir: Dir;
  /** In a fight or trade, so can't be challenged. */
  busy?: boolean;
}

/** Health of each crew member in a PvP fight, sent after every batch of events. */
export interface SideSnap {
  active: number;
  team: { hp: number; status: Drifter['status']; pp: number[] }[];
}

export type ClientMsg =
  | { t: 'hello'; v: number; token?: string; name?: string; outfit?: number }
  | { t: 'save'; state: unknown }
  | { t: 'enter'; map: string; x: number; y: number; dir: Dir }
  | { t: 'leave' }
  | { t: 'move'; x: number; y: number; dir: Dir }
  | { t: 'busy'; busy: boolean }
  | { t: 'chat'; text: string }
  /** Ask for everyone who's online and where they are. */
  | { t: 'who' }
  | { t: 'profile'; name?: string; outfit?: number }
  // Challenges and trades start the same way: ask, then the other player answers.
  | { t: 'ask'; to: string; kind: 'battle' | 'trade'; team?: Drifter[] }
  | { t: 'answer'; to: string; kind: 'battle' | 'trade'; accept: boolean; team?: Drifter[] }
  | { t: 'b_action'; action: Action }
  | { t: 'b_forfeit' }
  | { t: 'tr_offer'; index: number }
  | { t: 'tr_confirm'; state: unknown }
  | { t: 'tr_cancel' };

export type ServerMsg =
  | { t: 'welcome'; id: string; token: string; name: string; outfit: number; save: unknown | null; online: number }
  | { t: 'refused'; reason: string }
  | { t: 'players'; map: string; list: PlayerInfo[] }
  | { t: 'join'; p: PlayerInfo }
  | { t: 'leave'; id: string }
  | { t: 'moved'; id: string; x: number; y: number; dir: Dir }
  | { t: 'pbusy'; id: string; busy: boolean }
  | { t: 'chat'; id: string; name: string; text: string }
  | { t: 'online'; count: number }
  /** map is a map id, or '' for someone on the title screen. */
  | { t: 'who'; list: { id: string; name: string; map: string; busy: boolean }[] }
  | { t: 'asked'; from: string; name: string; kind: 'battle' | 'trade' }
  | { t: 'declined'; from: string; name: string; kind: 'battle' | 'trade'; reason?: string }
  | { t: 'b_start'; foe: { name: string; outfit: number; team: Drifter[] }; you: Drifter[] }
  /** seq numbers each decision a side is asked for, so a repeated prompt can be ignored. */
  | { t: 'b_events'; events: BattleEvent[]; me: SideSnap; foe: SideSnap; need: 'action' | 'switch' | 'wait' | 'over'; seq: number; result?: BattleResult }
  | { t: 'tr_start'; foe: { name: string; team: Drifter[] } }
  | { t: 'tr_offered'; index: number | null }
  | { t: 'tr_done'; state: unknown; got: Drifter }
  | { t: 'tr_cancelled'; reason: string }
  | { t: 'saved' }
  | { t: 'error'; text: string };

export function cleanName(s: unknown): string {
  return String(s ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .'-]/g, '')
    .trim()
    .slice(0, MAX_NAME);
}

export function cleanChat(s: unknown): string {
  return String(s ?? '')
    .replace(/[^\x20-\x7e]/g, '')
    .trim()
    .slice(0, MAX_CHAT);
}

/**
 * Check a drifter sent by a client before using it in a fight or trade.
 * Returns a cleaned copy, or null if it couldn't be real.
 */
export function cleanDrifter(raw: unknown): Drifter | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, any>;
  if (typeof d.sp !== 'string' || !(d.sp in SPECIES)) return null;
  const level = Math.floor(Number(d.level));
  if (!(level >= 1 && level <= 100)) return null;
  if (!Array.isArray(d.moves) || d.moves.length < 1 || d.moves.length > 4) return null;
  const moves: { id: MoveId; pp: number }[] = [];
  for (const m of d.moves) {
    if (!m || typeof m.id !== 'string' || !(m.id in MOVES)) return null;
    const max = (MOVES as Record<string, { pp: number }>)[m.id].pp;
    moves.push({ id: m.id as MoveId, pp: Math.max(0, Math.min(max, Math.floor(Number(m.pp) || 0))) });
  }
  const iv = (v: unknown) => Math.max(0, Math.min(31, Math.floor(Number(v) || 0)));
  const ivs = d.ivs ?? {};
  const status = d.status === 'out' || d.status === 'sick' || d.status === 'wasted' ? d.status : null;
  return {
    sp: d.sp as SpeciesId,
    nick: typeof d.nick === 'string' ? cleanName(d.nick) || undefined : undefined,
    level,
    exp: Math.max(0, Math.floor(Number(d.exp) || 0)),
    hp: Math.max(0, Math.floor(Number(d.hp) || 0)),
    moves,
    status,
    statusTurns: Math.max(0, Math.min(5, Math.floor(Number(d.statusTurns) || 0))),
    ivs: { hp: iv(ivs.hp), atk: iv(ivs.atk), def: iv(ivs.def), spd: iv(ivs.spd) },
    caughtWith: typeof d.caughtWith === 'string' ? d.caughtWith.slice(0, 20) : undefined,
  };
}

export function cleanTeam(raw: unknown): Drifter[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 6) return null;
  const out: Drifter[] = [];
  for (const r of raw) {
    const d = cleanDrifter(r);
    if (!d) return null;
    out.push(d);
  }
  return out;
}
