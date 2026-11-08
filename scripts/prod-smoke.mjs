// Smoke test a production build (Docker): connect, start a game, save to the server, reload, continue.
import { chromium } from 'playwright-core';
const URL = process.env.URL ?? 'http://localhost:8799/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: 720, height: 480 }, ...(process.argv[2] === 'continue' ? { storageState: 'shots/prod-state.json' } : {}) });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const wait = (ms) => page.waitForTimeout(ms);
const press = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.down(k); await wait(40); await page.keyboard.up(k); await wait(150); } };
const step = process.argv[2] ?? 'new';
await page.goto(URL);
await wait(1800);
if (step === 'new') {
  await press('Enter'); await wait(2000);
  await page.screenshot({ path: 'shots/prod-1-menu.png' });
  console.log('hud:', await page.textContent('#hud'));
  await press('KeyZ'); // NEW GAME
  await wait(500);
  await press('KeyZ', 40); // intro, name, outfit
  await wait(1500);
  await page.screenshot({ path: 'shots/prod-2-home.png' });
  // Save from the start menu: START, then SAVE is the 3rd item before a starter (BAG, NAME, SAVE).
  await press('Enter'); await wait(300);
  await press('ArrowDown', 2); await press('KeyZ'); await wait(800); await press('KeyZ'); await wait(800);
  await page.screenshot({ path: 'shots/prod-3-saved.png' });
  console.log('code:', await page.evaluate(() => localStorage.getItem('tpt-token')));
  await ctx.storageState({ path: 'shots/prod-state.json' });
} else {
  await press('Enter'); await wait(2000);
  await page.screenshot({ path: 'shots/prod-4-continue.png' });
}
console.log(errors.length ? 'ERRORS: ' + errors.join('\n') : 'no page errors');
await browser.close();
