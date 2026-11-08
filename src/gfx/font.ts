import Phaser from 'phaser';
import '@fontsource/press-start-2p/400.css';

export const FONT = 'pixel';
export const CHARS = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

/**
 * Rasterise Press Start 2P into a crisp 1-bit 8x8 bitmap font so text sits on
 * the same pixel grid as the art.
 */
export async function buildFont(scene: Phaser.Scene) {
  try {
    await document.fonts.load('8px "Press Start 2P"');
  } catch {
    /* fall back to whatever monospace font loads */
  }
  const cols = 16;
  const rows = Math.ceil(CHARS.length / cols);
  // Draw each glyph 8x too big, then sample the middle of each 8x8 block.
  // Rendering at 8px directly blurs strokes across two pixels.
  const S = 8;
  const big = document.createElement('canvas');
  big.width = 8 * S * 2;
  big.height = 8 * S * 2;
  const bx = big.getContext('2d', { willReadFrequently: true })!;
  bx.font = `${8 * S}px "Press Start 2P", monospace`;
  bx.textBaseline = 'alphabetic';
  bx.fillStyle = '#fff';

  // Find where the font's pixel grid sits using a capital H.
  const ink = (ch: string) => {
    bx.clearRect(0, 0, big.width, big.height);
    bx.fillText(ch, S, 8 * S);
    return bx.getImageData(0, 0, big.width, big.height).data;
  };
  const h = ink('H');
  let minX = big.width;
  let minY = big.height;
  for (let y = 0; y < big.height; y++)
    for (let x = 0; x < big.width; x++)
      if (h[(y * big.width + x) * 4 + 3] > 128) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
      }
  // Glyphs are drawn at x = S, so columns start there (plus any sub-cell shift).
  // Capitals start on row 0 of the 8x8 cell.
  const originX = S + (((minX - S) % S) + S) % S;
  const originY = minY;

  const cv = document.createElement('canvas');
  cv.width = cols * 8;
  cv.height = rows * 8;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(cv.width, cv.height);
  for (let i = 0; i < CHARS.length; i++) {
    const d = ink(CHARS[i]);
    const gx = (i % cols) * 8;
    const gy = Math.floor(i / cols) * 8;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const sx = originX + x * S + S / 2;
        const sy = originY + y * S + S / 2;
        if (d[(sy * big.width + sx) * 4 + 3] > 128) {
          const o = ((gy + y) * cv.width + gx + x) * 4;
          img.data[o] = img.data[o + 1] = img.data[o + 2] = img.data[o + 3] = 255;
        }
      }
  }
  ctx.putImageData(img, 0, 0);
  if (scene.textures.exists(FONT)) scene.textures.remove(FONT);
  scene.textures.addCanvas(FONT, cv);
  const config = {
    image: FONT,
    width: 8,
    height: 8,
    chars: CHARS,
    charsPerRow: cols,
    spacing: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    lineSpacing: 0,
  };
  scene.cache.bitmapFont.add(FONT, Phaser.GameObjects.RetroFont.Parse(scene, config as any));
}

/** Break text into lines that fit `width` characters, honouring \n. */
export function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (!line.length) line = word;
      else if (line.length + 1 + word.length <= width) line += ' ' + word;
      else {
        out.push(line);
        line = word;
      }
      while (line.length > width) {
        out.push(line.slice(0, width));
        line = line.slice(width);
      }
    }
    out.push(line);
  }
  return out;
}
