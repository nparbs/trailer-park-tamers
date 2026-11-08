// Text boxes and menus. Every scene gets one UI; scripts await its methods,
// and the scene calls ui.update() each frame so the top widget reads input.

import Phaser from 'phaser';
import { FONT, wrap } from '../gfx/font';
import { Input } from '../game/input';
import { sfx } from '../audio/sound';

export const W = 240;
export const H = 160;
export const TEXT = 0x404048;
export const SHADOW = 0xd0d0c8;
const DEPTH = 1000;

export function label(scene: Phaser.Scene, x: number, y: number, str: string, color = TEXT, shadow: number | null = SHADOW) {
  const t = scene.add.bitmapText(x, y, FONT, str, 8).setTint(color).setScrollFactor(0).setDepth(DEPTH + 2);
  if (shadow !== null && (t as any).setDropShadow) t.setDropShadow(1, 1, shadow, 1);
  return t;
}

/** A bordered window. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = 0xf8f8f8) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
  g.fillStyle(0x283048).fillRect(x, y + 1, w, h - 2).fillRect(x + 1, y, w - 2, h);
  g.fillStyle(0x7088b8).fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(0x283048).fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle(fill).fillRect(x + 4, y + 4, w - 8, h - 8);
  return g;
}

export function cursor(scene: Phaser.Scene, color = TEXT) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 3);
  g.fillStyle(color).fillTriangle(0, 0, 0, 6, 4, 3);
  return g;
}

interface Widget {
  update(): void;
  destroy(): void;
}

class DialogBox implements Widget {
  private g: Phaser.GameObjects.Graphics;
  private lines: Phaser.GameObjects.BitmapText[];
  private arrow: Phaser.GameObjects.Graphics;
  private pages: string[][] = [];
  private page = 0;
  private shown = 0;
  private resolve: (() => void) | null = null;
  private blink = 0;
  private autoMs = 0;
  private waited = 0;
  /** Time the current page finished typing; taps right after that are ignored. */
  private fullFor = 0;
  visible = true;

  constructor(private scene: Phaser.Scene, x = 0, y = H - 48, private w = W, h = 48) {
    this.g = panel(scene, x, y, w, h);
    this.lines = [label(scene, x + 10, y + 12, ''), label(scene, x + 10, y + 28, '')];
    this.arrow = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 3);
    this.arrow.fillStyle(0xd04040).fillTriangle(0, 0, 6, 0, 3, 4);
    this.arrow.setPosition(x + w - 16, y + h - 12).setVisible(false);
  }

  get chars() {
    return Math.floor((this.w - 28) / 8);
  }

  show(text: string, autoMs: number): Promise<void> {
    const all = wrap(text, this.chars);
    this.pages = [];
    for (let i = 0; i < all.length; i += 2) this.pages.push(all.slice(i, i + 2));
    this.page = 0;
    this.shown = 0;
    this.autoMs = autoMs;
    this.waited = 0;
    this.setVisible(true);
    this.render();
    return new Promise((r) => (this.resolve = r));
  }

  /** Show text immediately with no waiting (for prompts beside a menu). */
  showNow(text: string, chars = this.chars) {
    this.resolve = null;
    const lines = wrap(text, chars);
    this.pages = [lines.slice(0, 2)];
    this.page = 0;
    this.shown = 9999;
    this.setVisible(true);
    this.lines[0].setText(lines[0] ?? '');
    this.lines[1].setText(lines[1] ?? '');
    this.arrow.setVisible(false);
  }

  setVisible(v: boolean) {
    this.visible = v;
    this.g.setVisible(v);
    for (const l of this.lines) l.setVisible(v);
    if (!v) this.arrow.setVisible(false);
  }

  clear() {
    for (const l of this.lines) l.setText('');
    this.arrow.setVisible(false);
  }

  private pageText() {
    return this.pages[this.page] ?? [];
  }

  private render() {
    const p = this.pageText();
    let left = this.shown;
    p.forEach((ln, i) => {
      const n = Math.max(0, Math.min(ln.length, left));
      this.lines[i].setText(ln.slice(0, n));
      left -= ln.length;
    });
    for (let i = p.length; i < 2; i++) this.lines[i].setText('');
  }

  private get pageLen() {
    return this.pageText().reduce((a, l) => a + l.length, 0);
  }

  update() {
    if (!this.resolve) return;
    const dt = this.scene.game.loop.delta;
    const full = this.shown >= this.pageLen;
    if (!full) {
      this.fullFor = 0;
      const speed = Input.held('a') || Input.held('b') ? 4 : 1.5;
      const before = Math.floor(this.shown);
      this.shown = Math.min(this.pageLen, this.shown + speed * (dt / 16.7));
      if (Math.floor(this.shown) > before && Math.floor(this.shown) % 3 === 0) sfx('blip');
      this.render();
      if ((Input.pressed('a') || Input.pressed('b')) && this.shown > 6) {
        this.shown = this.pageLen;
        this.render();
      }
      return;
    }
    const last = this.page >= this.pages.length - 1;
    this.blink += dt;
    this.fullFor += dt;
    // A stray or double tap shouldn't skip a line before it can be read.
    const canAdvance = this.fullFor > 280;
    this.arrow.setVisible(!last && this.blink % 600 < 400);
    if (this.autoMs && last) {
      this.waited += dt;
      if (this.waited >= this.autoMs || (canAdvance && (Input.pressed('a') || Input.pressed('b')))) this.done();
      return;
    }
    if (canAdvance && (Input.pressed('a') || Input.pressed('b'))) {
      sfx('select');
      if (last) this.done();
      else {
        this.page++;
        this.shown = 0;
        this.arrow.setVisible(false);
        this.render();
      }
    }
  }

  private done() {
    const r = this.resolve;
    this.resolve = null;
    this.arrow.setVisible(false);
    Input.consume();
    r?.();
  }

  destroy() {
    this.g.destroy();
    this.lines.forEach((l) => l.destroy());
    this.arrow.destroy();
  }
}

export interface ChooseOpts {
  x?: number;
  y?: number;
  w?: number;
  cols?: number;
  /** B returns -1 when true. */
  cancel?: boolean;
  initial?: number;
  /** Called whenever the highlighted option changes. */
  onMove?: (i: number) => void;
  /** Draw no window (for menus drawn into a custom layout). */
  bare?: boolean;
  rowH?: number;
  colW?: number;
}

class Menu implements Widget {
  private objs: Phaser.GameObjects.GameObject[] = [];
  private cur: Phaser.GameObjects.Graphics;
  private i: number;
  private rows: number;
  private resolve: ((i: number) => void) | null = null;
  private x0: number;
  private y0: number;
  private rowH: number;
  private colW: number;

  constructor(scene: Phaser.Scene, private options: string[], private o: ChooseOpts) {
    const cols = o.cols ?? 1;
    this.rows = Math.ceil(options.length / cols);
    const maxLen = Math.max(...options.map((s) => s.length));
    this.rowH = o.rowH ?? 16;
    this.colW = Math.max(o.colW ?? 0, maxLen * 8 + 14);
    const w = o.w ?? cols * this.colW + 18;
    const h = this.rows * this.rowH + 14;
    const x = o.x ?? W - w;
    const y = o.y ?? H - 48 - h;
    if (!o.bare) this.objs.push(panel(scene, x, y, w, h));
    this.x0 = x + 16;
    this.y0 = y + 11;
    options.forEach((s, k) => {
      const c = k % cols;
      const r = Math.floor(k / cols);
      this.objs.push(label(scene, this.x0 + c * this.colW, this.y0 + r * this.rowH, s));
    });
    this.cur = cursor(scene);
    this.objs.push(this.cur);
    // Draw over any text box underneath, so its words never show through.
    for (const ob of this.objs) (ob as any).setDepth((ob as any).depth + 10);
    this.i = Math.min(o.initial ?? 0, options.length - 1);
    this.place();
  }

  private place() {
    const cols = this.o.cols ?? 1;
    const c = this.i % cols;
    const r = Math.floor(this.i / cols);
    this.cur.setPosition(this.x0 - 9 + c * this.colW, this.y0 + 1 + r * this.rowH);
    this.o.onMove?.(this.i);
  }

  wait() {
    return new Promise<number>((r) => (this.resolve = r));
  }

  update() {
    if (!this.resolve) return;
    const cols = this.o.cols ?? 1;
    const n = this.options.length;
    let next = this.i;
    if (Input.repeat('down')) next = this.i + cols < n ? this.i + cols : cols === 1 ? 0 : this.i;
    else if (Input.repeat('up')) next = this.i - cols >= 0 ? this.i - cols : cols === 1 ? n - 1 : this.i;
    else if (Input.repeat('right') && cols > 1 && this.i % cols < cols - 1 && this.i + 1 < n) next = this.i + 1;
    else if (Input.repeat('left') && cols > 1 && this.i % cols > 0) next = this.i - 1;
    if (next !== this.i) {
      this.i = next;
      sfx('move');
      this.place();
    }
    if (Input.pressed('a')) {
      sfx('select');
      this.finish(this.i);
    } else if (Input.pressed('b') && this.o.cancel) {
      sfx('back');
      this.finish(-1);
    }
  }

  private finish(v: number) {
    const r = this.resolve;
    this.resolve = null;
    Input.consume();
    r?.(v);
  }

  destroy() {
    this.objs.forEach((o) => o.destroy());
  }
}

export class UI {
  private stack: Widget[] = [];
  private box: DialogBox | null = null;

  constructor(private scene: Phaser.Scene) {}

  update() {
    const top = this.stack[this.stack.length - 1];
    top?.update();
  }

  get busy() {
    return this.stack.length > 0;
  }

  /** Show a message and wait for A. The box stays up until close(). */
  async say(text: string, autoMs = 0) {
    if (!this.box) this.box = new DialogBox(this.scene);
    this.stack.push(this.box);
    await this.box.show(text, autoMs);
    this.stack = this.stack.filter((w) => w !== this.box);
  }

  /** Several messages in a row. */
  async talk(...lines: string[]) {
    for (const l of lines) await this.say(l);
  }

  close() {
    this.box?.destroy();
    this.box = null;
  }

  /** Put text in the box right away and return (the box stays up). */
  show(text: string, chars?: number) {
    if (!this.box) this.box = new DialogBox(this.scene);
    this.box.showNow(text, chars);
  }

  /** Run fn every frame until it returns something other than undefined. */
  loop<T>(fn: () => T | undefined): Promise<T> {
    return new Promise<T>((resolve) => {
      const w: Widget = {
        update: () => {
          const v = fn();
          if (v !== undefined) {
            this.pop(w);
            Input.consume();
            resolve(v);
          }
        },
        destroy: () => {},
      };
      this.push(w);
    });
  }

  /** Wait for a number of milliseconds while keeping input blocked. */
  wait(ms: number): Promise<void> {
    return new Promise((r) => this.scene.time.delayedCall(ms, r));
  }

  async choose(options: string[], o: ChooseOpts = {}): Promise<number> {
    const m = new Menu(this.scene, options, o);
    this.stack.push(m);
    const v = await m.wait();
    this.stack = this.stack.filter((w) => w !== m);
    m.destroy();
    return v;
  }

  /** Ask a question in the text box with a YES/NO menu beside it. */
  async ask(text: string, options = ['YES', 'NO']): Promise<number> {
    if (!this.box) this.box = new DialogBox(this.scene);
    this.stack.push(this.box);
    const p = this.box.show(text, 1);
    // Let the text finish typing before the menu appears.
    await p;
    this.stack = this.stack.filter((w) => w !== this.box);
    const v = await this.choose(options, { cancel: true });
    return v < 0 ? options.length - 1 : v;
  }

  /** Push a custom widget (full-screen menus). */
  push(w: Widget) {
    this.stack.push(w);
  }
  pop(w: Widget) {
    this.stack = this.stack.filter((x) => x !== w);
  }
}

export type { Widget };
