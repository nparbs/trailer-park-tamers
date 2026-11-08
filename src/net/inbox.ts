// Queues fight updates from the server so none are missed while the battle scene starts.

import { net } from './client';
import type { ServerMsg } from './protocol';

export type BattleUpdate = Extract<ServerMsg, { t: 'b_events' }>;

export class BattleInbox {
  private q: BattleUpdate[] = [];
  private waiting: ((m: BattleUpdate) => void) | null = null;
  private offs: (() => void)[] = [];

  constructor() {
    this.offs.push(
      net.on('b_events', (m) => this.push(m)),
      net.on('online', () => {
        if (net.status === 'offline') {
          this.push({ t: 'b_events', events: [{ t: 'msg', text: 'Lost the connection to the server.' }], me: { active: 0, team: [] }, foe: { active: 0, team: [] }, need: 'over', seq: 0, result: 'lose' });
        }
      }),
    );
  }

  private push(m: BattleUpdate) {
    if (this.waiting) {
      const w = this.waiting;
      this.waiting = null;
      w(m);
    } else this.q.push(m);
  }

  next(): Promise<BattleUpdate> {
    const m = this.q.shift();
    if (m) return Promise.resolve(m);
    return new Promise((r) => (this.waiting = r));
  }

  close() {
    this.offs.forEach((o) => o());
    this.offs = [];
  }
}
