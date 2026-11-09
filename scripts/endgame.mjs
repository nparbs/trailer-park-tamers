// Jump to late-slice states and check the boss, healing and the shop.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 720, height: 480 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.stack || e)));
const wait = (ms) => page.waitForTimeout(ms);
const shot = async (n) => { await page.screenshot({ path: `shots/e-${n}.png` }); };
const press = async (k, hold = 40) => { await page.keyboard.down(k); await wait(hold); await page.keyboard.up(k); await wait(60); };
const st = () => page.evaluate(() => {
  const g = window.tpt.game; const ow = g.scene.getScene('Overworld'); const S = window.tpt.state.G;
  return { active: g.scene.getScenes(true).map((s) => s.scene.key), busy: !!(ow?.busy || ow?.ui?.busy), map: S.map, x: ow?.player?.x, y: ow?.player?.y, flags: S.flags, badges: S.badges, money: S.money, party: S.party.map((d) => `${d.sp}:${d.level}:${d.hp}`), bag: S.bag };
});
async function mash(cond, max = 300000) { const t0 = Date.now(); while (Date.now() - t0 < max) { const s = await st(); if (cond(s)) return s; await press('KeyZ'); await wait(120); } await page.screenshot({ path: 'shots/e-stuck.png' }); throw new Error('timeout ' + JSON.stringify(await st())); }
async function jump(map, x, y, party, extra = {}) {
  await page.evaluate(({ map, x, y, party, extra }) => {
    const { state, creature, game } = window.tpt;
    const s = state.newGame();
    Object.assign(s, { map, x, y, facing: 'up', flags: { starter: true, dale_met: true, rival1: true, dex: true, ...extra }, money: 2000 });
    s.party = party.map(([sp, lv]) => creature.makeDrifter(sp, lv));
    state.setState(s);
    for (const sc of game.scene.getScenes(true)) game.scene.stop(sc.scene.key);
    game.scene.start('Overworld');
  }, { map, x, y, party, extra });
  await wait(900);
}
await page.goto(process.env.URL ?? 'http://localhost:5173/');
await wait(1500);

// Big Tony.
await jump('trap', 5, 3, [['BILL', 30], ['CARTKING', 30]], { tr_tr_mikey: true, tr_tr_jay: true });
await press('ArrowUp', 30); await wait(150);
await press('KeyZ'); await wait(800); await shot('tony-talk');
await mash((s) => s.active.includes('Battle'));
await wait(3000); await shot('tony-battle');
let s = await mash((s) => !s.active.includes('Battle'));
await wait(300); await shot('tony-after');
s = await mash((s) => !s.busy);
console.log('tony:', s.badges, s.money, s.flags.badge1);

// Soup kitchen heal.
await jump('soup', 3, 3, [['WILLIE', 10]]);
await page.evaluate(() => { const d = window.tpt.state.G.party[0]; d.hp = 3; d.status = 'sick'; });
await press('ArrowUp', 30); await wait(150); await press('KeyZ'); await wait(800);
s = await mash((s) => !s.busy);
console.log('heal:', s.party);
const healed = await page.evaluate(() => { const d = window.tpt.state.G.party[0]; return [d.hp, d.status, window.tpt.state.G.respawn]; });
console.log('healed', healed);

// Shop: buy 3 sacks.
await jump('gas', 1, 4, [['WILLIE', 10]]);
await press('ArrowUp', 30); await wait(150); await press('KeyZ'); await wait(400);
for (let i = 0; i < 2; i++) { await press('KeyZ'); await wait(700); }
await press('KeyZ'); await wait(500);
await shot('shop');
await press('ArrowUp'); await press('ArrowUp'); await wait(200); await shot('shop-qty');
await press('KeyZ'); await wait(300); await press('KeyZ'); await wait(300);
for (let i = 0; i < 4; i++) { await press('KeyX'); await wait(300); }
s = await mash((s) => !s.busy, 15000);
console.log('shop:', s.money, JSON.stringify(s.bag));

// Blackout.
await jump('route1', 9, 26, [['JOE', 2]]);
await page.evaluate(() => {
  const { game, creature } = window.tpt; const ow = game.scene.getScene('Overworld');
  ow.run(() => ow.battle({ enemy: [creature.makeDrifter('TANK', 40)], wild: true }));
});
s = await mash((s) => s.map !== 'route1' && !s.busy, 90000);
await shot('blackout');
console.log('blackout:', s.map, s.x, s.y, s.money, s.party);

// Cop at the tape.
await jump('town', 24, 11, [['WILLIE', 10]]);
await press('ArrowRight', 30); await wait(150); await press('KeyZ'); await wait(900); await shot('cop');
s = await mash((s) => !s.busy, 15000);

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
