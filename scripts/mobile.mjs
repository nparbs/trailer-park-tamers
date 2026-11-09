// Touch layout at phone sizes: the title after tapping START, then the overworld with a
// text box open (the part most likely to end up under a thumb). Needs `npm run dev`.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
fs.mkdirSync('shots', { recursive: true });
const URL = process.env.URL ?? 'http://localhost:5173/';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// Software GL: with phone emulation the default headless GPU path screenshots the canvas as black.
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const sizes = [['portrait', 390, 844], ['landscape', 844, 390], ['wide-landscape', 800, 360], ['small-landscape', 640, 360]];
for (const [name, w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForTimeout(1800);
  // Tap START on the pad to skip the intro.
  const btn = await page.$('[data-key="start"]');
  const box = await btn.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `shots/m-${name}.png` });
  // Straight into the park with a sign open.
  await page.evaluate(() => {
    const { state, creature, game } = window.tpt;
    const s = state.newGame();
    Object.assign(s, { map: 'park', x: 13, y: 13, facing: 'up', name: 'KID' });
    s.flags = { starter: true, dale_met: true, rival1: true, dex: true };
    s.party = [creature.makeDrifter('WILLIE', 8)];
    state.setState(s);
    for (const sc of game.scene.getScenes(true)) if (sc.scene.key !== 'Boot') game.scene.stop(sc.scene.key);
    game.scene.start('Overworld');
  });
  await page.waitForTimeout(1200);
  const a = await page.$('[data-key="a"]');
  const ab = await a.boundingBox();
  await page.touchscreen.tap(ab.x + ab.width / 2, ab.y + ab.height / 2);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `shots/m-${name}-text.png` });
  await ctx.close();
}
await browser.close();
