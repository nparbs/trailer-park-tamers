// Everyone who is connected: where they stand, what they say, and who they're fighting or trading with.

import type { WebSocket } from 'ws';
import { MAPS } from '../src/data/maps';
import { healFully, type Drifter } from '../src/game/creature';
import type { Dir } from '../src/game/state';
import {
  cleanChat, cleanName, cleanTeam, OUTFITS, PROTOCOL_VERSION,
  type ClientMsg, type PlayerInfo, type ServerMsg,
} from '../src/net/protocol';
import { normalizeToken, type Store } from './db';
import { PvpRoom } from './pvp';
import { TradeRoom } from './trade';

const ASK_TTL = 30_000;
const CHAT_GAP = 900;
const MAX_SAVE = 400_000;
const DIRS: Dir[] = ['up', 'down', 'left', 'right'];
const WHO_GAP = 1500;
const WHO_MAX = 200;

export class Client {
  id = '';
  name = 'KID';
  outfit = 0;
  map = '';
  x = 0;
  y = 0;
  dir: Dir = 'down';
  busy = false;
  lastChat = 0;
  lastWho = 0;
  /** Someone asked this player for a fight or trade. */
  incoming = new Map<string, { kind: 'battle' | 'trade'; team?: Drifter[]; at: number }>();
  pvp: PvpRoom | null = null;
  trade: TradeRoom | null = null;

  constructor(public ws: WebSocket, public ip: string) {}

  send(m: ServerMsg) {
    if (this.ws.readyState === this.ws.OPEN) this.ws.send(JSON.stringify(m));
  }

  info(): PlayerInfo {
    return { id: this.id, name: this.name, outfit: this.outfit, x: this.x, y: this.y, dir: this.dir, busy: this.busy || !!this.pvp || !!this.trade };
  }

  get inRoom() {
    return !!this.pvp || !!this.trade;
  }
}

export class World {
  private byId = new Map<string, Client>();
  private maps = new Map<string, Set<Client>>();

  constructor(private store: Store) {}

  get online() {
    return this.byId.size;
  }

  private onMap(map: string) {
    let s = this.maps.get(map);
    if (!s) this.maps.set(map, (s = new Set()));
    return s;
  }

  private toMap(map: string, m: ServerMsg, except?: Client) {
    for (const c of this.maps.get(map) ?? []) if (c !== except) c.send(m);
  }

  private broadcastOnline() {
    const m: ServerMsg = { t: 'online', count: this.online };
    for (const c of this.byId.values()) c.send(m);
  }

  handle(c: Client, m: ClientMsg) {
    if (!c.id && m.t !== 'hello') return;
    switch (m.t) {
      case 'hello':
        return this.hello(c, m);
      case 'save':
        return this.save(c, m.state);
      case 'enter':
        return this.enter(c, m.map, m.x, m.y, m.dir);
      case 'leave':
        if (c.map) {
          this.maps.get(c.map)?.delete(c);
          this.toMap(c.map, { t: 'leave', id: c.id });
          c.map = '';
        }
        return;
      case 'move':
        if (!c.map) return;
        c.x = int(m.x);
        c.y = int(m.y);
        c.dir = DIRS.includes(m.dir) ? m.dir : 'down';
        return this.toMap(c.map, { t: 'moved', id: c.id, x: c.x, y: c.y, dir: c.dir }, c);
      case 'busy':
        c.busy = !!m.busy;
        if (c.map) this.toMap(c.map, { t: 'pbusy', id: c.id, busy: c.info().busy! }, c);
        return;
      case 'chat': {
        const text = cleanChat(m.text);
        const now = Date.now();
        if (!text || !c.map || now - c.lastChat < CHAT_GAP) return;
        c.lastChat = now;
        return this.toMap(c.map, { t: 'chat', id: c.id, name: c.name, text });
      }
      case 'who': {
        const now = Date.now();
        if (now - c.lastWho < WHO_GAP) return;
        c.lastWho = now;
        const list = [...this.byId.values()]
          .slice(0, WHO_MAX)
          .map((o) => ({ id: o.id, name: o.name, map: o.map, busy: !!o.info().busy }));
        return c.send({ t: 'who', list });
      }
      case 'profile': {
        if (m.name !== undefined) c.name = cleanName(m.name) || c.name;
        if (m.outfit !== undefined) c.outfit = clampOutfit(m.outfit);
        this.store.profile(c.id, c.name, c.outfit);
        if (c.map) this.toMap(c.map, { t: 'join', p: c.info() }, c);
        return;
      }
      case 'ask':
        return this.ask(c, m.to, m.kind, m.team);
      case 'answer':
        return this.answer(c, m.to, m.kind, m.accept, m.team);
      case 'b_action':
        return c.pvp?.action(c, m.action);
      case 'b_forfeit':
        return c.pvp?.forfeit(c);
      case 'tr_offer':
        return c.trade?.offer(c, m.index);
      case 'tr_confirm':
        return c.trade?.confirm(c, m.state);
      case 'tr_cancel':
        return c.trade?.cancel(`${c.name} backed out.`);
    }
  }

  private hello(c: Client, m: Extract<ClientMsg, { t: 'hello' }>) {
    if (c.id) return;
    if (m.v !== PROTOCOL_VERSION) {
      c.send({ t: 'refused', reason: 'The game was updated. Refresh the page to get the new version.' });
      c.ws.close();
      return;
    }
    let token = typeof m.token === 'string' ? normalizeToken(m.token) : '';
    let acc = token ? this.store.byToken(token) : null;
    if (token && !acc) {
      c.send({ t: 'refused', reason: "That code doesn't match any player." });
      c.ws.close();
      return;
    }
    if (!acc) {
      const made = this.store.create(cleanName(m.name) || 'KID', clampOutfit(m.outfit ?? 0));
      acc = made.account;
      token = made.token;
    }
    // One connection per account: the newest wins.
    const old = this.byId.get(acc.id);
    if (old) {
      old.send({ t: 'refused', reason: 'You logged in somewhere else.' });
      this.drop(old);
      old.ws.close();
    }
    c.id = acc.id;
    c.name = acc.name;
    c.outfit = acc.outfit;
    this.byId.set(c.id, c);
    let save: unknown = null;
    try {
      save = acc.save ? JSON.parse(acc.save) : null;
    } catch {
      save = null;
    }
    c.send({ t: 'welcome', id: c.id, token, name: c.name, outfit: c.outfit, save, online: this.online });
    this.broadcastOnline();
  }

  private save(c: Client, state: unknown) {
    const json = JSON.stringify(state ?? null);
    if (json.length > MAX_SAVE || !state || typeof state !== 'object' || (state as any).version !== 1) {
      c.send({ t: 'error', text: "Couldn't save: that save file looks wrong." });
      return;
    }
    this.store.save(c.id, json);
    c.send({ t: 'saved' });
  }

  private enter(c: Client, map: string, x: number, y: number, dir: Dir) {
    if (!(map in MAPS)) return;
    if (c.map) {
      this.maps.get(c.map)?.delete(c);
      this.toMap(c.map, { t: 'leave', id: c.id });
    }
    c.map = map;
    c.x = int(x);
    c.y = int(y);
    c.dir = DIRS.includes(dir) ? dir : 'down';
    const here = this.onMap(map);
    c.send({ t: 'players', map, list: [...here].map((o) => o.info()) });
    here.add(c);
    this.toMap(map, { t: 'join', p: c.info() }, c);
  }

  private ask(c: Client, to: string, kind: 'battle' | 'trade', team: unknown) {
    const t = this.byId.get(to);
    const refuse = (reason: string) => c.send({ t: 'declined', from: to, name: t?.name ?? '?', kind, reason });
    if (!t || t.map !== c.map) return refuse("They're not around anymore.");
    if (t.inRoom || t.busy) return refuse("They're busy right now.");
    if (c.inRoom) return refuse("You're already busy.");
    let clean: Drifter[] | undefined;
    if (kind === 'battle') {
      const tm = cleanTeam(team);
      if (!tm) return refuse("Your crew doesn't look right.");
      clean = tm;
    }
    t.incoming.set(c.id, { kind, team: clean, at: Date.now() });
    t.send({ t: 'asked', from: c.id, name: c.name, kind });
  }

  private answer(c: Client, to: string, kind: 'battle' | 'trade', accept: boolean, team: unknown) {
    const req = c.incoming.get(to);
    c.incoming.delete(to);
    const asker = this.byId.get(to);
    if (!req || req.kind !== kind || Date.now() - req.at > ASK_TTL || !asker) return;
    if (!accept) {
      asker.send({ t: 'declined', from: c.id, name: c.name, kind });
      return;
    }
    if (asker.inRoom || c.inRoom || asker.map !== c.map) {
      c.send({ t: 'declined', from: asker.id, name: asker.name, kind, reason: "They're busy now." });
      return;
    }
    if (kind === 'battle') {
      const mine = cleanTeam(team);
      if (!mine || !req.team) return;
      // Friendly fights: everyone starts fresh and nothing carries over.
      for (const d of [...mine, ...req.team]) healFully(d);
      new PvpRoom(asker, req.team, c, mine, () => this.roomChanged([asker, c]));
    } else {
      new TradeRoom(asker, c, this.store, () => this.roomChanged([asker, c]));
    }
    this.roomChanged([asker, c]);
  }

  /** Tell each map whether these players are free. */
  private roomChanged(cs: Client[]) {
    for (const c of cs) if (c.map) this.toMap(c.map, { t: 'pbusy', id: c.id, busy: c.info().busy! }, c);
  }

  drop(c: Client) {
    if (!c.id) return;
    c.pvp?.forfeit(c, true);
    c.trade?.cancel(`${c.name} left.`);
    if (c.map) {
      this.maps.get(c.map)?.delete(c);
      this.toMap(c.map, { t: 'leave', id: c.id });
    }
    if (this.byId.get(c.id) === c) this.byId.delete(c.id);
    c.map = '';
    this.broadcastOnline();
  }
}

function int(v: unknown) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(999, n)) : 0;
}

function clampOutfit(v: unknown) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(OUTFITS - 1, n)) : 0;
}
