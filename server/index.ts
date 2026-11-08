// Trailer Park Tamers server: serves the game page and runs the shared world over WebSocket.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { Store } from './db';
import { Client, World } from './world';
import type { ClientMsg } from '../src/net/protocol';

const PORT = Number(process.env.PORT ?? 8790);
const STATIC_DIR = path.resolve(process.env.STATIC_DIR ?? 'dist');
const DB_FILE = process.env.DB_FILE ?? 'data/tpt.db';
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const IP_HEADER = (process.env.CLIENT_IP_HEADER ?? '').toLowerCase();
const MAX_PER_IP = 8;

const store = new Store(DB_FILE);
const world = new World(store);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://x');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(STATIC_DIR, '.' + rel);
  if (!file.startsWith(STATIC_DIR + path.sep) && file !== STATIC_DIR) {
    res.writeHead(403).end();
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    const ext = path.extname(file);
    const hashed = rel.startsWith('/assets/');
    res.writeHead(200, {
      'content-type': MIME[ext] ?? 'application/octet-stream',
      'content-length': st.size,
      'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin',
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ ok: true, online: world.online }));
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  serveStatic(req, res);
});

const perIp = new Map<string, number>();
const wss = new WebSocketServer({ noServer: true, maxPayload: 512 * 1024 });

function clientIp(req: http.IncomingMessage) {
  const h = IP_HEADER ? req.headers[IP_HEADER] : undefined;
  const v = Array.isArray(h) ? h[0] : h;
  return (v?.split(',')[0].trim() || req.socket.remoteAddress) ?? '?';
}

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', 'http://x');
  const origin = req.headers.origin ?? '';
  const ip = clientIp(req);
  if (url.pathname !== '/ws' || (ALLOWED.length && !ALLOWED.includes(origin)) || (perIp.get(ip) ?? 0) >= MAX_PER_IP) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    perIp.set(ip, (perIp.get(ip) ?? 0) + 1);
    const c = new Client(ws, ip);
    // Token bucket: bursts are fine, floods are not.
    let tokens = 60;
    let last = Date.now();
    let alive = true;
    ws.on('pong', () => (alive = true));
    const ping = setInterval(() => {
      if (!alive) return ws.terminate();
      alive = false;
      ws.ping();
    }, 30_000);
    ws.on('message', (data) => {
      const now = Date.now();
      tokens = Math.min(60, tokens + ((now - last) / 1000) * 25);
      last = now;
      if (--tokens < 0) {
        ws.close(1008, 'Too many messages');
        return;
      }
      let m: ClientMsg;
      try {
        m = JSON.parse(String(data));
      } catch {
        return;
      }
      if (!m || typeof m !== 'object' || typeof (m as any).t !== 'string') return;
      try {
        world.handle(c, m);
      } catch (e) {
        console.error('handler error', e);
      }
    });
    ws.on('close', () => {
      clearInterval(ping);
      perIp.set(ip, Math.max(0, (perIp.get(ip) ?? 1) - 1));
      if ((perIp.get(ip) ?? 0) === 0) perIp.delete(ip);
      world.drop(c);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Trailer Park Tamers server on :${PORT}, static from ${STATIC_DIR}, ${store.count()} accounts`);
});

const shutdown = () => {
  server.close();
  store.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
