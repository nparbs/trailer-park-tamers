// Player accounts and cloud saves in a single SQLite file.

import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface Account {
  id: string;
  name: string;
  outfit: number;
  save: string | null;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 16 characters from a 32-letter alphabet: 80 bits, typeable on a phone. */
export function newToken(): string {
  const b = randomBytes(16);
  let s = '';
  for (let i = 0; i < 16; i++) s += ALPHABET[b[i] % 32];
  return s;
}

export function normalizeToken(t: string) {
  return t.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function hash(token: string) {
  return createHash('sha256').update(normalizeToken(token)).digest('hex');
}

export class Store {
  private db: DatabaseSync;

  constructor(file: string) {
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        outfit INTEGER NOT NULL DEFAULT 0,
        save TEXT,
        created INTEGER NOT NULL,
        seen INTEGER NOT NULL
      );
    `);
  }

  create(name: string, outfit: number): { account: Account; token: string } {
    const token = newToken();
    const id = randomBytes(5).toString('hex');
    const now = Date.now();
    this.db.prepare('INSERT INTO accounts (id, token_hash, name, outfit, save, created, seen) VALUES (?, ?, ?, ?, NULL, ?, ?)').run(id, hash(token), name, outfit, now, now);
    return { account: { id, name, outfit, save: null }, token };
  }

  byToken(token: string): Account | null {
    const row = this.db.prepare('SELECT id, name, outfit, save FROM accounts WHERE token_hash = ?').get(hash(token)) as Account | undefined;
    if (!row) return null;
    this.db.prepare('UPDATE accounts SET seen = ? WHERE id = ?').run(Date.now(), row.id);
    return row;
  }

  load(id: string): string | null {
    const row = this.db.prepare('SELECT save FROM accounts WHERE id = ?').get(id) as { save: string | null } | undefined;
    return row?.save ?? null;
  }

  save(id: string, json: string) {
    this.db.prepare('UPDATE accounts SET save = ?, seen = ? WHERE id = ?').run(json, Date.now(), id);
  }

  profile(id: string, name: string, outfit: number) {
    this.db.prepare('UPDATE accounts SET name = ?, outfit = ? WHERE id = ?').run(name, outfit, id);
  }

  count(): number {
    return (this.db.prepare('SELECT COUNT(*) AS n FROM accounts').get() as { n: number }).n;
  }

  close() {
    this.db.close();
  }
}
