// Drive the game in headless Chrome and save screenshots to ./shots.
// Usage: node scripts/screenshots.mjs [scenario...]   (needs `npm run dev` on :5173)
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173/';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync('shots', { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const wait = (ms) => page.waitForTimeout(ms);
const key = async (k, hold = 60) => { await page.keyboard.down(k); await wait(hold); await page.keyboard.up(k); await wait(60); };
const shot = async (name) => { await page.screenshot({ path: `shots/${name}.png` }); console.log('shot', name); };
const tap = async (k, n = 1, gap = 120) => { for (let i = 0; i < n; i++) { await key(k); await wait(gap); } };

await page.goto(URL);
await wait(1500);

const scenarios = process.argv.slice(2);
const want = (s) => !scenarios.length || scenarios.includes(s);

// Jump straight into a state: (map, x, y, party, flags)
async function jump(map, x, y, opts = {}) {
  await page.evaluate(({ map, x, y, opts }) => {
    const { state, creature, game } = window.tpt;
    const s = state.newGame();
    s.map = map; s.x = x; s.y = y; s.name = 'KID';
    s.flags = { starter: true, dale_met: true, rival1: true, dex: true, starter_WILLIE: true, ...(opts.flags || {}) };
    s.party = (opts.party || [['WILLIE', 8]]).map(([sp, lv]) => creature.makeDrifter(sp, lv));
    s.bag = { SACK: 5, BURRITO: 3, TAPE: 2, SALTS: 1, FORTY: 2, LOKO: 1, JOINT: 4, SEED: 2, SKATEBOARD: 1, PILLS: 1 };
    s.seen = ['WILLIE', 'JOE', 'GARY']; s.caught = ['WILLIE'];
    state.setState(s);
    for (const sc of game.scene.getScenes(true)) if (sc.scene.key !== 'Boot') game.scene.stop(sc.scene.key);
    game.scene.start('Overworld');
  }, { map, x, y, opts });
  await wait(900);
}

if (want('title')) {
  await shot('01-title');
  await key('Enter'); await wait(500);
  await shot('02-title-menu');
}

if (want('intro')) {
  await key('KeyZ'); await wait(800);
  await shot('03-intro');
}

if (want('maps')) {
  for (const [m, x, y] of [['park', 17, 14], ['route1', 9, 5], ['route1', 9, 22], ['town', 15, 7], ['town', 7, 17], ['town', 24, 15], ['skate', 4, 4], ['grow', 4, 4], ['lab', 3, 4]]) {
    await jump(m, x, y);
    await wait(2800);
    await shot(`map-${m}-${x}-${y}`);
  }
}

if (want('battle')) {
  await jump('route1', 9, 20, { party: [['WILLIE', 8], ['AMOS', 6]] });
  await page.evaluate(() => {
    const { game, creature } = window.tpt;
    const ow = game.scene.getScene('Overworld');
    ow.run(() => ow.battle({ enemy: [creature.makeDrifter('JOE', 4)], wild: true }));
  });
  await wait(2600); await shot('b1-intro');
  await tap('KeyZ', 1); await wait(1800); await shot('b2-sendout');
  await wait(1500); await shot('b3-menu');
  await tap('KeyZ'); await wait(300); await shot('b4-moves');
  await tap('KeyZ'); await wait(1600); await shot('b5-attack');
  await wait(3000); await shot('b6-after');
}

if (want('screens')) {
  await jump('town', 14, 9, { party: [['SWITCHGLEN', 28], ['ROCKBOTTOM', 22], ['BLUEBATCH', 26], ['CAROL', 7]] });
  await key('Enter'); await wait(400); await shot('s1-start');
  await tap('ArrowDown'); await tap('KeyZ'); await wait(400); await shot('s2-crew');
  await tap('KeyZ'); await wait(300); await tap('KeyZ'); await wait(400); await shot('s3-summary');
  await tap('ArrowRight'); await wait(300); await shot('s4-summary2');
  await tap('KeyX'); await tap('KeyX'); await wait(300);
  await tap('ArrowDown'); await tap('KeyZ'); await wait(400); await shot('s5-bag');
  await tap('KeyX'); await wait(300);
  await tap('ArrowUp', 2); await tap('KeyZ'); await wait(400); await shot('s6-dex');
}

if (want('sprites')) {
  const canvasOf = async (fn) => {
    await page.evaluate(() => {
      const { game } = window.tpt;
      for (const sc of game.scene.getScenes(true)) game.scene.stop(sc.scene.key);
      game.scene.start('Title');
    });
    await wait(300);
    await page.evaluate((src) => {
      const { game } = window.tpt;
      const s = game.scene.getScene('Title');
      s.tweens.killAll();
      s.children.removeAll(true);
      s.cameras.main.setBackgroundColor(0xe8e8f0);
      new Function('s', 'game', src)(s, game);
    }, fn);
    await wait(300);
  };
  await canvasOf(`const ids = Object.keys(game.textures.list).filter((k) => k.startsWith('pf_')).slice(24);
    ids.forEach((k, i) => s.add.image((i % 6) * 40 + 20, Math.floor(i / 6) * 40 + 20, k).setScale(0.6));`);
  await shot('sprites-front');
  await canvasOf(`const ids = Object.keys(game.textures.list).filter((k) => k.startsWith('pb_') || k.startsWith('tf_') || k.startsWith('tb_'));
    ids.forEach((k, i) => s.add.image((i % 8) * 30 + 15, Math.floor(i / 8) * 32 + 16, k).setScale(0.45));`);
  await shot('sprites-back');
  await canvasOf(`const w = Object.keys(game.textures.list).filter((k) => k.startsWith('w_'));
    w.forEach((k, i) => { for (let f = 0; f < 9; f++) s.add.image((i % 2) * 120 + 2 + f * 13, Math.floor(i / 2) * 8 + 1, k, f).setOrigin(0, 0).setScale(0.5); });`);
  await shot('sprites-walkers');
  await canvasOf(`s.add.image(0, 0, 'tiles-out').setOrigin(0, 0).setScale(0.5); s.add.image(0, 20, 'tiles-in').setOrigin(0, 0).setScale(0.5);
    ['bg_park','bg_street','bg_indoor'].forEach((k,i)=> s.add.image((i%2)*120, 40 + Math.floor(i/2)*58, k).setOrigin(0,0).setScale(0.5));`);
  await shot('tiles');
}

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
