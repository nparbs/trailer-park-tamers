// Play through the story start in headless Chrome, taking screenshots along the way.
// Usage: node scripts/play.mjs   (needs `npm run dev` on :5173)
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 720, height: 480 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.stack || e)));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (n) => { await page.screenshot({ path: `shots/p-${n}.png` }); console.log('shot', n); };
const st = () => page.evaluate(() => {
  const g = window.tpt.game;
  const ow = g.scene.getScene('Overworld');
  const active = g.scene.getScenes(true).map((s) => s.scene.key);
  const S = window.tpt.state.G;
  return { active, map: S.map, x: ow?.player?.x, y: ow?.player?.y, busy: !!(ow?.busy || ow?.ui?.busy), moving: !!ow?.player?.moving, flags: S.flags, party: S.party.map((d) => d.sp + ':' + d.level + ':' + d.hp), money: S.money, bag: S.bag };
});
const press = async (k, hold = 40) => { await page.keyboard.down(k); await wait(hold); await page.keyboard.up(k); await wait(50); };
async function mashUntil(cond, max = 30000, k = 'KeyZ') {
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    const s = await st();
    if (cond(s)) return s;
    await press(k);
    await wait(150);
  }
  throw new Error('mashUntil timed out: ' + JSON.stringify(await st()));
}
async function idle() {
  return mashUntil((s) => s.active.includes('Overworld') && !s.active.includes('Battle') && !s.busy && !s.moving);
}
const KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
async function go(dir, n = 1) {
  for (let i = 0; i < n; i++) {
    const before = await st();
    await page.keyboard.down(KEYS[dir]);
    const t0 = Date.now();
    let s = before;
    while (Date.now() - t0 < 600) {
      s = await st();
      if (s.x !== before.x || s.y !== before.y || s.map !== before.map || s.busy) break;
      await wait(15);
    }
    await page.keyboard.up(KEYS[dir]);
    await wait(260);
    s = await st();
    if (s.busy || s.active.includes('Battle')) return s;
  }
  return st();
}
// Walk to a tile using BFS over the live map (re-plans if an NPC gets in the way).
async function goto(tx, ty, opts = {}) {
  const startMap = (await st()).map;
  for (let tries = 0; tries < 40; tries++) {
    const s0 = await st();
    if (s0.map !== startMap) return s0;
    if (s0.busy || s0.active.includes('Battle')) return s0;
    if (s0.x === tx && s0.y === ty) return s0;
    const dir = await page.evaluate(({ tx, ty, allowWarp }) => {
      const ow = window.tpt.game.scene.getScene('Overworld');
      const p = ow.player;
      const key = (x, y) => x + ',' + y;
      const prev = new Map([[key(p.x, p.y), null]]);
      const q = [[p.x, p.y]];
      const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      while (q.length) {
        const [x, y] = q.shift();
        if (x === tx && y === ty) break;
        for (const [d, [dx, dy]] of Object.entries(D)) {
          const nx = x + dx, ny = y + dy;
          if (prev.has(key(nx, ny))) continue;
          const isT = nx === tx && ny === ty;
          if (ow.blocked(nx, ny, p)) continue;
          if (!isT && !allowWarp && ow.warpAt(nx, ny)) continue;
          prev.set(key(nx, ny), [x, y, d]);
          q.push([nx, ny]);
        }
      }
      if (!prev.has(key(tx, ty))) return null;
      let cur = [tx, ty];
      let first = null;
      while (true) {
        const pr = prev.get(key(cur[0], cur[1]));
        if (!pr) break;
        first = pr[2];
        cur = [pr[0], pr[1]];
      }
      return first;
    }, { tx, ty, allowWarp: !!opts.allowWarp });
    if (!dir) { await wait(400); continue; }
    await go(dir, 1);
  }
  return st();
}
async function face(dir) { await press(KEYS[dir], 30); await wait(120); }

await page.goto(process.env.URL ?? 'http://localhost:5173/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await wait(1500);
await press('Enter'); await wait(600);
await press('KeyZ'); await wait(800); // NEW GAME
await shot('01-intro');
let s = await mashUntil((s) => s.active.includes('Overworld') && !s.busy, 60000);
await wait(500);
await shot('02-home');
console.log('home', s.x, s.y);
// Talk to mom.
await goto(6, 2); await face('right'); await press('KeyZ'); await wait(800); await shot('03-mom');
await idle();
await goto(4, 6, { allowWarp: true });
await wait(700); s = await st(); console.log('after exit', s.map, s.x, s.y);
await shot('04-park');
await goto(11, 2); await go('up', 1);
await wait(300); await shot('05-blocked');
await idle(); s = await st(); console.log('after block', s.x, s.y);
await goto(19, 3, { allowWarp: true });
await wait(700); s = await st(); console.log('dale?', s.map, s.x, s.y);
await goto(4, 2); await face('right'); await press('KeyZ'); await wait(600); await shot('06-dale');
await idle();
await goto(4, 3); await face('left'); await press('KeyZ'); await wait(900); await shot('07-pick');
s = await mashUntil((s) => s.active.includes('Battle'), 30000);
await wait(2500); await shot('08-rival-battle');
s = await mashUntil((s) => !s.active.includes('Battle'), 120000);
await wait(400); await shot('09-after-rival');
s = await idle(); console.log('flags', JSON.stringify(s.flags), s.party, s.bag);

await goto(4, 6, { allowWarp: true }); await wait(700);
await goto(11, 0, { allowWarp: true }); await wait(900);
s = await st(); console.log('route?', s.map, s.x, s.y);
await shot('11-route');
await goto(8, 26);
let found = false;
for (let i = 0; i < 80 && !found; i++) {
  s = await go(i % 2 ? 'left' : 'right', 1);
  if (s.busy && !s.active.includes('Battle')) { await wait(1500); s = await st(); }
  if (s.active.includes('Battle')) found = true;
  else if (s.busy) await idle();
}
console.log('wild?', found);
if (found) {
  await wait(5500); await shot('12-wild');
  // Fight once, then throw sacks until it ends.
  for (let k = 0; k < 12; k++) {
    const b = await st();
    if (!b.active.includes('Battle')) break;
    await press('ArrowRight'); await press('KeyZ'); await wait(500); await press('KeyZ'); await wait(700);
    if (k === 0) await shot('13-throw');
    await mashUntil((x) => false, 6000).catch(() => {});
  }
  s = await mashUntil((s) => !s.active.includes('Battle'), 120000);
  s = await idle();
  console.log('after wild', s.party, s.bag);
  await shot('13b-after-wild');
}
// Trainer on the route.
await goto(9, 21);
await wait(1500); s = await st(); console.log('trainer?', s.active, s.busy);
await shot('14-trainer');
s = await mashUntil((s) => s.active.includes('Battle'), 20000).catch(() => st());
await wait(2000); await shot('15-trainer-battle');
s = await mashUntil((s) => !s.active.includes('Battle'), 120000);
s = await idle(); console.log('after trainer', s.party, s.money, JSON.stringify(s.flags));

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
