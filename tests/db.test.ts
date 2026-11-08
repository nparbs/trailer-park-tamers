import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../server/db';

describe('store', () => {
  it('adds the second save slot to an old database and keeps slots apart', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tpt-')), 'old.db');
    const old = new DatabaseSync(file);
    old.exec(`CREATE TABLE accounts (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      outfit INTEGER NOT NULL DEFAULT 0, save TEXT, created INTEGER NOT NULL, seen INTEGER NOT NULL);`);
    old.close();

    const store = new Store(file);
    const { account, token } = store.create('KID', 0);
    store.save(account.id, '{"slot":1}');
    store.save(account.id, '{"slot":2}', 2);
    expect(store.load(account.id)).toBe('{"slot":1}');
    expect(store.load(account.id, 2)).toBe('{"slot":2}');
    const again = store.byToken(token)!;
    expect(again.save).toBe('{"slot":1}');
    expect(again.save2).toBe('{"slot":2}');
    store.close();
  });
});
