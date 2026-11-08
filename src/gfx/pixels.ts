// A tiny pixel buffer for drawing all the game's art in code.
// Colours are 0xRRGGBB numbers; 0 or -1 never appears as a colour, so TRANSPARENT is -1.

export const T = -1;

export class Pix {
  readonly w: number;
  readonly h: number;
  readonly data: Int32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Int32Array(w * h).fill(T);
  }

  get(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T;
    return this.data[y * this.w + x];
  }

  set(x: number, y: number, c: number) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** Filled ellipse inside the box x,y,w,h. */
  oval(x: number, y: number, w: number, h: number, c: number) {
    const cx = x + w / 2 - 0.5;
    const cy = y + h / 2 - 0.5;
    const rx = w / 2;
    const ry = h / 2;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const dx = (x + i - cx) / rx;
        const dy = (y + j - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) this.set(x + i, y + j, c);
      }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: number, thick = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps);
      const y = Math.round(y0 + ((y1 - y0) * s) / steps);
      this.rect(x - Math.floor((thick - 1) / 2), y - Math.floor((thick - 1) / 2), thick, thick, c);
    }
  }

  /** Trapezoid: top edge from tx0..tx1 at y, bottom edge bx0..bx1 at y+h. */
  trap(y: number, h: number, tx0: number, tx1: number, bx0: number, bx1: number, c: number) {
    for (let j = 0; j < h; j++) {
      const t = h <= 1 ? 0 : j / (h - 1);
      const a = Math.round(tx0 + (bx0 - tx0) * t);
      const b = Math.round(tx1 + (bx1 - tx1) * t);
      for (let x = a; x <= b; x++) this.set(x, y + j, c);
    }
  }

  /** Paint a pattern of characters; chars not in the palette are skipped. */
  stamp(x: number, y: number, rows: string[], pal: Record<string, number>, flip = false) {
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) {
        const c = pal[r[flip ? r.length - 1 - i : i]];
        if (c !== undefined) this.set(x + i, y + j, c);
      }
    }
  }

  /** Speckle a rectangle with a second colour, deterministically. */
  speckle(x: number, y: number, w: number, h: number, c: number, density: number, seed = 1) {
    let s = seed * 9301 + 49297;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        s = (s * 9301 + 49297) % 233280;
        if (s / 233280 < density) this.set(x + i, y + j, c);
      }
  }

  /** Dark outline around every filled shape. */
  outline(c = 0x202028) {
    const src = this.data.slice();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] !== T) continue;
        const n = (dx: number, dy: number) => {
          const xx = x + dx;
          const yy = y + dy;
          return xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && src[yy * this.w + xx] !== T;
        };
        if (n(1, 0) || n(-1, 0) || n(0, 1) || n(0, -1)) this.data[y * this.w + x] = c;
      }
  }

  /** Simple lighting: darken pixels near the right and bottom edges of each colour region. */
  shade(amount = 0.72, skip: number[] = []) {
    const src = this.data.slice();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = src[y * this.w + x];
        if (c === T || skip.includes(c)) continue;
        const r = x + 1 < this.w ? src[y * this.w + x + 1] : T;
        const b = y + 1 < this.h ? src[(y + 1) * this.w + x] : T;
        if (r !== c || b !== c) this.data[y * this.w + x] = darken(c, amount);
      }
  }

  /** Copy another buffer onto this one. */
  blit(src: Pix, dx: number, dy: number, flip = false) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + (flip ? src.w - 1 - x : x)];
        if (c !== T) this.set(dx + x, dy + y, c);
      }
  }

  toCanvas(scale = 1): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w * scale;
    cv.height = this.h * scale;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (c === T) continue;
      img.data[i * 4] = (c >> 16) & 255;
      img.data[i * 4 + 1] = (c >> 8) & 255;
      img.data[i * 4 + 2] = c & 255;
      img.data[i * 4 + 3] = 255;
    }
    if (scale === 1) ctx.putImageData(img, 0, 0);
    else {
      const tmp = document.createElement('canvas');
      tmp.width = this.w;
      tmp.height = this.h;
      tmp.getContext('2d')!.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, cv.width, cv.height);
    }
    return cv;
  }
}

export function darken(c: number, f: number) {
  const r = Math.floor(((c >> 16) & 255) * f);
  const g = Math.floor(((c >> 8) & 255) * f);
  const b = Math.floor((c & 255) * f);
  return (r << 16) | (g << 8) | b;
}

export function lighten(c: number, f: number) {
  const r = Math.min(255, Math.floor(((c >> 16) & 255) + (255 - ((c >> 16) & 255)) * f));
  const g = Math.min(255, Math.floor(((c >> 8) & 255) + (255 - ((c >> 8) & 255)) * f));
  const b = Math.min(255, Math.floor((c & 255) + (255 - (c & 255)) * f));
  return (r << 16) | (g << 8) | b;
}

/** Draw many equally sized buffers into one horizontal strip canvas (for sprite sheets). */
export function sheet(frames: Pix[]): HTMLCanvasElement {
  const w = frames[0].w;
  const h = frames[0].h;
  const all = new Pix(w * frames.length, h);
  frames.forEach((f, i) => all.blit(f, i * w, 0));
  return all.toCanvas();
}
