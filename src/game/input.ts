// One input layer for keyboard and the on-screen touch pad.
// Scenes poll it each frame: held() for walking, pressed() for buttons, repeat() for menus.

export type Key = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select';

const KEYMAP: Record<string, Key> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Space: 'a', KeyJ: 'a',
  KeyX: 'b', Escape: 'b', KeyK: 'b', Backspace: 'b',
  Enter: 'start', KeyP: 'start',
  ShiftLeft: 'select', ShiftRight: 'select',
};

const REPEAT_DELAY = 320;
const REPEAT_RATE = 90;

class InputState {
  private downSince = new Map<Key, number>();
  private justPressed = new Set<Key>();
  private lastRepeat = new Map<Key, number>();
  private sources = new Map<Key, Set<string>>();
  /** Most recently pressed direction, so walking follows the newest key. */
  private dirOrder: Key[] = [];
  /** Esc is B everywhere, but in the overworld it also opens the menu like START. */
  private escJust = false;

  press(k: Key, source: string) {
    let s = this.sources.get(k);
    if (!s) this.sources.set(k, (s = new Set()));
    const wasDown = s.size > 0;
    s.add(source);
    if (!wasDown) {
      this.downSince.set(k, performance.now());
      this.justPressed.add(k);
      this.lastRepeat.delete(k);
      if (isDir(k)) {
        this.dirOrder = this.dirOrder.filter((d) => d !== k);
        this.dirOrder.push(k);
      }
    }
  }

  release(k: Key, source: string) {
    const s = this.sources.get(k);
    if (!s) return;
    s.delete(source);
    if (s.size === 0) {
      this.downSince.delete(k);
      this.dirOrder = this.dirOrder.filter((d) => d !== k);
    }
  }

  releaseAll() {
    this.sources.clear();
    this.downSince.clear();
    this.dirOrder = [];
  }

  held(k: Key) {
    return this.downSince.has(k);
  }

  heldFor(k: Key) {
    const t = this.downSince.get(k);
    return t === undefined ? 0 : performance.now() - t;
  }

  pressed(k: Key) {
    return this.justPressed.has(k);
  }

  /** Esc was pressed this frame (keyboard only). */
  escPressed() {
    return this.escJust;
  }

  pressEsc() {
    this.escJust = true;
  }

  /** True on the first press, then repeatedly while held (for scrolling menus). */
  repeat(k: Key) {
    if (this.justPressed.has(k)) return true;
    const t = this.downSince.get(k);
    if (t === undefined) return false;
    const now = performance.now();
    if (now - t < REPEAT_DELAY) return false;
    const last = this.lastRepeat.get(k) ?? 0;
    if (now - last >= REPEAT_RATE) {
      this.lastRepeat.set(k, now);
      return true;
    }
    return false;
  }

  /** The newest held direction, if any. */
  dir(): Key | null {
    return this.dirOrder.length ? this.dirOrder[this.dirOrder.length - 1] : null;
  }

  /** Swallow everything pressed this frame (used when a scene hands over control). */
  consume() {
    this.justPressed.clear();
    this.escJust = false;
  }

  endFrame() {
    this.justPressed.clear();
    this.escJust = false;
  }
}

function isDir(k: Key) {
  return k === 'up' || k === 'down' || k === 'left' || k === 'right';
}

export const Input = new InputState();

export function installInput() {
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (!e.repeat) Input.press(k, 'kb:' + e.code);
    if (!e.repeat && e.code === 'Escape') Input.pressEsc();
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.code];
    if (k) Input.release(k, 'kb:' + e.code);
  });
  window.addEventListener('blur', () => Input.releaseAll());

  // Touch pad. Each pointer tracks which button it's over, so sliding a thumb
  // across the d-pad changes direction without lifting.
  const pad = document.getElementById('pad');
  if (!pad) return;
  const pointerKey = new Map<number, { key: Key; el: HTMLElement }>();
  const keyAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const btn = el?.closest('[data-key]') as HTMLElement | null;
    return btn ? { key: btn.dataset.key as Key, el: btn } : null;
  };
  const set = (id: number, next: { key: Key; el: HTMLElement } | null) => {
    const prev = pointerKey.get(id);
    if (prev && next && prev.key === next.key) return;
    if (prev) {
      Input.release(prev.key, 'p' + id);
      prev.el.classList.remove('on');
      pointerKey.delete(id);
    }
    if (next) {
      Input.press(next.key, 'p' + id);
      next.el.classList.add('on');
      pointerKey.set(id, next);
      if (navigator.vibrate) navigator.vibrate(8);
    }
  };
  pad.addEventListener('pointerdown', (e) => {
    const hit = keyAt(e.clientX, e.clientY);
    if (!hit) return;
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    set(e.pointerId, hit);
  });
  window.addEventListener('pointermove', (e) => {
    if (!pointerKey.has(e.pointerId)) return;
    const hit = keyAt(e.clientX, e.clientY);
    const prev = pointerKey.get(e.pointerId)!;
    // Only slide between d-pad directions; A/B stay put until released.
    if (hit && isDir(hit.key) && isDir(prev.key)) set(e.pointerId, hit);
  });
  const up = (e: PointerEvent) => set(e.pointerId, null);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
}
