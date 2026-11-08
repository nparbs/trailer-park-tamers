// Swapping one crew member each. Both players send their full save when they
// confirm, so the swap uses up-to-date crews, and the server stores both results.

import { cleanDrifter } from '../src/net/protocol';
import type { Drifter } from '../src/game/creature';
import type { Store } from './db';
import type { Client } from './world';

interface Save {
  version: 1;
  party: unknown[];
  seen?: string[];
  caught?: string[];
  [k: string]: unknown;
}

export class TradeRoom {
  private offers = new Map<Client, number | null>();
  private confirmed = new Map<Client, Save>();
  private done = false;

  constructor(private a: Client, private b: Client, private store: Store, private onEnd: () => void) {
    a.trade = this;
    b.trade = this;
    this.offers.set(a, null);
    this.offers.set(b, null);
    const load = (c: Client) => {
      try {
        const s = JSON.parse(store.load(c.id) ?? 'null');
        return (Array.isArray(s?.party) ? s.party : []).map(cleanDrifter).filter(Boolean) as Drifter[];
      } catch {
        return [];
      }
    };
    a.send({ t: 'tr_start', foe: { name: b.name, team: load(b) } });
    b.send({ t: 'tr_start', foe: { name: a.name, team: load(a) } });
  }

  private other(c: Client) {
    return c === this.a ? this.b : this.a;
  }

  offer(c: Client, index: number) {
    if (this.done || !Number.isInteger(index) || index < 0 || index > 5) return;
    this.offers.set(c, index);
    this.confirmed.clear();
    this.other(c).send({ t: 'tr_offered', index });
  }

  confirm(c: Client, state: unknown) {
    if (this.done) return;
    const s = state as Save;
    if (!s || s.version !== 1 || !Array.isArray(s.party)) return this.cancel('A save file looked wrong.');
    this.confirmed.set(c, s);
    if (this.confirmed.size < 2) return;

    const sa = this.confirmed.get(this.a)!;
    const sb = this.confirmed.get(this.b)!;
    const ia = this.offers.get(this.a);
    const ib = this.offers.get(this.b);
    if (ia == null || ib == null) return this.cancel('Both players need to offer someone.');
    const da = cleanDrifter(sa.party[ia]);
    const db = cleanDrifter(sb.party[ib]);
    if (!da || !db) return this.cancel('One of the offered crew members looked wrong.');

    sa.party[ia] = db;
    sb.party[ib] = da;
    for (const [s, d] of [[sa, db], [sb, da]] as const) {
      s.seen = Array.from(new Set([...(s.seen ?? []), d.sp]));
      s.caught = Array.from(new Set([...(s.caught ?? []), d.sp]));
    }
    this.store.save(this.a.id, JSON.stringify(sa), this.a.slot);
    this.store.save(this.b.id, JSON.stringify(sb), this.b.slot);
    this.a.send({ t: 'tr_done', state: sa, got: db });
    this.b.send({ t: 'tr_done', state: sb, got: da });
    this.end();
  }

  cancel(reason: string) {
    if (this.done) return;
    this.a.send({ t: 'tr_cancelled', reason });
    this.b.send({ t: 'tr_cancelled', reason });
    this.end();
  }

  private end() {
    this.done = true;
    this.a.trade = null;
    this.b.trade = null;
    this.onEnd();
  }
}
