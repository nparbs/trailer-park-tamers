// The page's connection to the shared world. Everything still works offline;
// this just adds other players, chat, fights, trades and cloud saves when the server is there.

import { PROTOCOL_VERSION, type ClientMsg, type ServerMsg } from './protocol';

type Handler<T extends ServerMsg['t']> = (m: Extract<ServerMsg, { t: T }>) => void;

const TOKEN_KEY = 'tpt-token';

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeToken(t: string) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: the account lasts for this tab only */
  }
}

export type NetStatus = 'offline' | 'connecting' | 'online';

class Net {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<(m: any) => void>>();
  private retry = 0;
  private retryTimer: number | null = null;
  private wantOnline = false;
  status: NetStatus = 'offline';
  id = '';
  token = readToken();
  name = '';
  outfit = 0;
  online = 0;
  /** The save that was on the server when we connected. */
  serverSave: unknown | null = null;
  serverSave2: unknown | null = null;
  refusedReason = '';
  /** Called after every (re)connect, so the overworld can re-announce where it is. */
  onReady: (() => void) | null = null;

  get url() {
    const env = (import.meta as any).env?.VITE_SERVER_URL as string | undefined;
    if (env) return env;
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  }

  on<T extends ServerMsg['t']>(t: T, fn: Handler<T>): () => void {
    let s = this.handlers.get(t);
    if (!s) this.handlers.set(t, (s = new Set()));
    s.add(fn);
    return () => s!.delete(fn);
  }

  /** Resolve with the first matching message, or null after the timeout. */
  waitFor<T extends ServerMsg['t']>(types: T[], ms: number): Promise<Extract<ServerMsg, { t: T }> | null> {
    return new Promise((resolve) => {
      const offs: (() => void)[] = [];
      const done = (m: any) => {
        offs.forEach((o) => o());
        clearTimeout(timer);
        resolve(m);
      };
      for (const t of types) offs.push(this.on(t, done));
      const timer = setTimeout(() => done(null), ms);
    });
  }

  send(m: ClientMsg) {
    if (this.ws?.readyState === WebSocket.OPEN && (this.status === 'online' || m.t === 'hello')) this.ws.send(JSON.stringify(m));
  }

  get isOnline() {
    return this.status === 'online';
  }

  /** Connect and log in. Resolves true once logged in, false if the server can't be reached. */
  connect(name?: string, outfit?: number): Promise<boolean> {
    this.wantOnline = true;
    return new Promise((resolve) => {
      let settled = false;
      const settle = (v: boolean) => {
        if (!settled) {
          settled = true;
          resolve(v);
        }
      };
      this.open(name, outfit, settle);
      setTimeout(() => settle(this.isOnline), 5000);
    });
  }

  private open(name: string | undefined, outfit: number | undefined, settle?: (v: boolean) => void) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.status = 'connecting';
    this.emit({ t: 'online', count: this.online });
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.status = 'offline';
      settle?.(false);
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.send({ t: 'hello', v: PROTOCOL_VERSION, token: this.token || undefined, name, outfit });
    };
    ws.onmessage = (ev) => {
      let m: ServerMsg;
      try {
        m = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (m.t === 'welcome') {
        this.status = 'online';
        this.id = m.id;
        this.token = m.token;
        writeToken(m.token);
        this.name = m.name;
        this.outfit = m.outfit;
        this.online = m.online;
        this.serverSave = m.save;
        this.serverSave2 = m.save2 ?? null;
        settle?.(true);
        this.onReady?.();
      } else if (m.t === 'refused') {
        this.refusedReason = m.reason;
        this.wantOnline = false;
      } else if (m.t === 'online') {
        this.online = m.count;
      }
      this.emit(m);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      const was = this.status;
      this.status = 'offline';
      settle?.(false);
      this.emit({ t: 'online', count: 0 });
      if (this.wantOnline && was !== 'offline') this.scheduleRetry();
      else if (this.wantOnline && this.retry > 0) this.scheduleRetry();
    };
  }

  private scheduleRetry() {
    this.retry++;
    const delay = Math.min(30000, 1000 * 2 ** Math.min(5, this.retry));
    this.retryTimer = window.setTimeout(() => this.open(undefined, undefined), delay);
  }

  private emit(m: ServerMsg) {
    for (const fn of this.handlers.get(m.t) ?? []) fn(m);
  }

  /** Log in with a code from another device. */
  async useCode(code: string): Promise<boolean> {
    this.token = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.ws?.close();
    this.ws = null;
    this.refusedReason = '';
    const ok = await this.connect();
    if (!ok) {
      // Bad code: forget it so the next visit makes a fresh account instead of failing again.
      this.token = readToken() === this.token ? '' : readToken();
    } else writeToken(this.token);
    return ok;
  }

  /** The login code, grouped for reading aloud. */
  get prettyCode() {
    return this.token.match(/.{1,4}/g)?.join('-') ?? '';
  }
}

export const net = new Net();
