// Records the intro as a promo video, frame by frame, with its soundtrack.
// Needs `npm run dev` on :5173 and ffmpeg on PATH.
// Usage: node scripts/promo.mjs [out.mp4]   (default: promo/trailer-park-tamers-promo.mp4)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] ?? 'promo/trailer-park-tamers-promo.mp4';
const FPS = 30;
const LENGTH = 17.5; // the 16 s intro plus a held logo
const SCALE = 6; // 240x160 -> 1440x960, whole pixels
const frames = 'promo/frames';
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 240 * SCALE, height: 160 * SCALE } });
await page.goto(process.env.URL ?? 'http://localhost:5173/');
await page.waitForFunction(() => window.tpt?.game?.scene?.getScene('Intro')?.sys?.isActive());
await page.evaluate(() => (window.tpt.game.scene.getScene('Intro').manual = true));

console.log('Rendering soundtrack');
const wav = await page.evaluate(() => window.tpt.sound.renderTrackWav('intro', 16.5));
writeFileSync('promo/intro.wav', Buffer.from(wav, 'base64'));

const total = Math.round(LENGTH * FPS);
for (let i = 0; i < total; i++) {
  await page.evaluate(async (t) => {
    window.tpt.game.scene.getScene('Intro').render(t);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, Math.min(i / FPS, 15.9));
  await page.screenshot({ path: `${frames}/${String(i).padStart(4, '0')}.png` });
  if (i % 60 === 0) console.log(`frame ${i}/${total}`);
}
await browser.close();

console.log('Encoding');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', `${frames}/%04d.png`, '-i', 'promo/intro.wav',
  '-af', `apad,afade=t=out:st=${LENGTH - 1}:d=1`, '-t', String(LENGTH),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-c:a', 'aac', '-b:a', '192k', OUT], { stdio: 'inherit' });
console.log('Wrote', OUT);
