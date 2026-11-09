// Two players in one world: presence, chat, a PvP fight and a trade.
// Needs `npm run dev` (5173) and `npm run server` (8790).
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];
async function player(name, outfit, x, y, facing, party) {
  const ctx = await browser.newContext({ viewport: { width: 720, height: 480 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(name + ': ' + String(e.stack || e)));
  await page.goto(process.env.URL ?? 'http://localhost:5173/');
  await page.waitForTimeout(1500);
  await page.evaluate(async ({ name, outfit, x, y, facing, party }) => {
    const { state, creature, game, net } = window.tpt;
    await net.connect();
    const s = state.newGame();
    Object.assign(s, { name, outfit, map: 'town', x, y, facing, flags: { starter: true, dale_met: true, rival1: true, dex: true } });
    s.party = party.map(([sp, lv]) => creature.makeDrifter(sp, lv));
    state.setState(s);
    net.send({ t: 'profile', name, outfit });
    for (const sc of game.scene.getScenes(true)) game.scene.stop(sc.scene.key);
    game.scene.start('Overworld');
  }, { name, outfit, x, y, facing, party });
  await page.waitForTimeout(1200);
  return page;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const press = async (p, k) => { await p.keyboard.down(k); await wait(40); await p.keyboard.up(k); await wait(60); };
const st = (p) => p.evaluate(() => {
  const g = window.tpt.game; const ow = g.scene.getScene('Overworld'); const S = window.tpt.state.G;
  return { active: g.scene.getScenes(true).map((s) => s.scene.key), busy: !!(ow?.busy || ow?.ui?.busy), others: ow?.online ? [...ow.online.others.values()].map((o) => o.info.name) : [], party: S.party.map((d) => d.sp), net: window.tpt.net.status, chat: document.getElementById('chatlog').innerText };
});
async function mash(p, cond, max = 60000) { const t0 = Date.now(); while (Date.now() - t0 < max) { const s = await st(p); if (cond(s)) return s; await press(p, 'KeyZ'); await wait(100); } throw new Error('timeout ' + JSON.stringify(await st(p))); }

const A = await player('ALICE', 3, 14, 9, 'right', [['WILLIE', 12], ['STAN', 10]]);
const B = await player('BOB', 1, 15, 9, 'left', [['AMOS', 12], ['CAROL', 10]]);
await wait(800);
console.log('A sees', (await st(A)).others, '| B sees', (await st(B)).others);

// Chat.
await A.evaluate(() => window.tpt.net.send({ t: 'chat', text: 'yo bob, nice hat' }));
await wait(500);
console.log('B chat log:', JSON.stringify((await st(B)).chat));
await A.screenshot({ path: 'shots/mp-1-chat.png' });

// Walk: B steps down one tile and back; A should see each step.
const posB = () => B.evaluate(() => { const p = window.tpt.game.scene.getScene('Overworld').player; return [p.x, p.y, p.dir]; });
const seenB = () => A.evaluate(() => [...window.tpt.game.scene.getScene('Overworld').online.others.values()].map((o) => [o.info.x, o.info.y, o.info.dir])[0]);
async function stepB(key) {
  const before = JSON.stringify(await posB());
  await B.keyboard.down(key);
  for (let i = 0; i < 40 && JSON.stringify(await posB()) === before; i++) await wait(10);
  await B.keyboard.up(key);
  await wait(400);
}
await stepB('ArrowDown'); await stepB('ArrowDown');
console.log('B at', await posB(), 'A sees B at', await seenB());
await stepB('ArrowUp'); await stepB('ArrowUp');
await B.keyboard.down('ArrowLeft'); await wait(40); await B.keyboard.up('ArrowLeft'); await wait(400);
console.log('B back at', await posB(), 'A sees B at', await seenB());

// Battle.
// Talk to BOB and pick BATTLE once the menu is up.
const menuUp = (p) => p.evaluate(() => { const ow = window.tpt.game.scene.getScene('Overworld'); return ow.ui.stack?.some((w) => w.options); });
await press(A, 'KeyZ');
for (let i = 0; i < 30 && !(await menuUp(A)); i++) await wait(100);
await press(A, 'KeyZ'); await wait(800);
for (let i = 0; i < 50 && !(await st(B)).busy; i++) await wait(100);
await wait(800);
await B.screenshot({ path: 'shots/mp-2-asked.png' });
await mash(B, (s) => s.active.includes('Battle'), 15000);
await mash(A, (s) => s.active.includes('Battle'), 15000).catch(() => {});
await wait(3000);
await A.screenshot({ path: 'shots/mp-3-battle-a.png' });
await B.screenshot({ path: 'shots/mp-3-battle-b.png' });
// Both mash until the fight ends.
const t0 = Date.now();
while (Date.now() - t0 < 180000) {
  const [sa, sb] = [await st(A), await st(B)];
  if (!sa.active.includes('Battle') && !sb.active.includes('Battle')) break;
  if (sa.active.includes('Battle')) await press(A, 'KeyZ');
  if (sb.active.includes('Battle')) await press(B, 'KeyZ');
  await wait(80);
}
await wait(600);
await A.screenshot({ path: 'shots/mp-4-after.png' }); await B.screenshot({ path: 'shots/mp-4-after-b.png' });
console.log('after battle A', await st(A), '\nB', await st(B));
await mash(A, (s) => !s.busy, 15000); await mash(B, (s) => !s.busy, 15000);

// Trade.

await press(A, 'KeyZ');
for (let i = 0; i < 30 && !(await menuUp(A)); i++) await wait(100);
await press(A, 'ArrowDown'); await press(A, 'KeyZ'); await wait(800); // TRADE
for (let i = 0; i < 50 && !(await st(B)).busy; i++) await wait(100);
await wait(800);
await press(B, 'KeyZ'); await wait(600); await press(B, 'KeyZ'); await wait(1500); // YES
await A.screenshot({ path: 'shots/mp-5-trade.png' });
await press(A, 'KeyZ'); await wait(400); // offer slot 0
await press(B, 'KeyZ'); await wait(800); // offer slot 0
await A.screenshot({ path: 'shots/mp-6-offers.png' });
await press(A, 'KeyZ'); await wait(300); await press(B, 'KeyZ'); await wait(1500); // confirm both
await A.screenshot({ path: 'shots/mp-7-done.png' });
await mash(A, (s) => !s.busy, 15000); await mash(B, (s) => !s.busy, 15000);
console.log('after trade A party', (await st(A)).party, '| B party', (await st(B)).party);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
