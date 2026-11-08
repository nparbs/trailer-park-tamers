import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [name, w, h] of [['portrait', 390, 844], ['landscape', 844, 390], ['small-landscape', 640, 360]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1800);
  // Tap START on the pad.
  const btn = await page.$('[data-key="start"]');
  const box = await btn.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `shots/m-${name}.png` });
  await ctx.close();
}
await browser.close();
