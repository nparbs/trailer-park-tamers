import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
await page.goto('http://localhost:5173/');
await page.waitForTimeout(1500);
const url = await page.evaluate(() => {
  const src = window.tpt.game.textures.get('pixel').getSourceImage();
  const c = document.createElement('canvas'); c.width = src.width * 6; c.height = src.height * 6;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#335'; x.fillRect(0,0,c.width,c.height); x.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL();
});
const fs = await import('node:fs');
fs.writeFileSync('shots/font.png', Buffer.from(url.split(',')[1], 'base64'));
await browser.close();
