// The animated intro that plays when the site loads. Everything is placed by a single
// clock (render(t)), so the promo recorder can step through it frame by frame.
// Timed to 120 BPM: one beat is 0.5 s, one bar is 2 s.

import Phaser from 'phaser';
import { FONT } from '../gfx/font';
import { Input } from '../game/input';
import { music } from '../audio/sound';

export const INTRO_LENGTH = 16;

const ease = {
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  in: (x: number) => x * x * x,
  back: (x: number) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2),
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));
/** 0..1 progress of t through [a, b]. */
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const between = (t: number, a: number, b: number) => t >= a && t < b;

export class Intro extends Phaser.Scene {
  private t = 0;
  /** Set by the promo recorder: the clock only moves when render(t) is called. */
  manual = false;
  private done = false;
  private o: Record<string, any> = {};

  constructor() {
    super('Intro');
  }

  create() {
    this.t = 0;
    this.done = false;
    const add = this.add;
    const o = this.o;
    this.cameras.main.setBackgroundColor(0x000000);

    // 1. Logo card.
    o.parbs = add.bitmapText(120, 72, FONT, 'PARBS', 16).setOrigin(0.5);
    o.presents = add.bitmapText(120, 92, FONT, 'PRESENTS', 8).setOrigin(0.5).setTint(0x9898a8);

    // 2. Night street with parallax trailers and a walking drifter.
    o.street = add.container(0, 0);
    const sky = add.graphics();
    [0x0c0c20, 0x141430, 0x1c1c40, 0x2a2450, 0x3c2c58].forEach((c, i) => sky.fillStyle(c).fillRect(0, i * 18, 240, 18));
    sky.fillStyle(0xf0e8c0).fillCircle(196, 28, 12);
    sky.fillStyle(0x0c0c20).fillCircle(201, 25, 10);
    for (let i = 0; i < 26; i++) sky.fillStyle(0xd8d8f0).fillRect((i * 53) % 240, (i * 29) % 80, 1, 1);
    o.far = add.graphics();
    for (let i = 0; i < 8; i++) {
      const x = i * 70;
      o.far.fillStyle(0x241c38).fillRect(x, 64, 56, 22);
      o.far.fillStyle(0xf8d070).fillRect(x + 8, 70, 6, 5).fillRect(x + 40, 70, 6, 5);
      o.far.fillStyle(0x241c38).fillRect(x + 60, 50, 2, 36).fillRect(x + 52, 50, 18, 2);
    }
    o.near = add.graphics();
    for (let i = 0; i < 6; i++) {
      const x = i * 110;
      o.near.fillStyle(0x0e0a18).fillRect(x, 84, 80, 30);
      o.near.fillStyle(0xe8a050).fillRect(x + 12, 92, 8, 7).fillRect(x + 58, 92, 8, 7);
      o.near.fillStyle(0x0e0a18).fillTriangle(x + 88, 114, x + 100, 92, x + 112, 114);
    }
    const ground = add.graphics();
    ground.fillStyle(0x1a1824).fillRect(0, 112, 240, 48);
    ground.fillStyle(0x2c2a38).fillRect(0, 112, 240, 2);
    o.fire = add.graphics();
    o.walker = add.sprite(0, 118, 'w_sp:KENNY', 6).setScale(2).setFlipX(true).setOrigin(0.5, 1);
    o.walker2 = add.sprite(0, 118, 'w_sp:MO', 6).setScale(2).setFlipX(true).setOrigin(0.5, 1);
    o.street.add([sky, o.far, o.near, ground, o.fire, o.walker, o.walker2]);
    o.caption = add.bitmapText(120, 136, FONT, '', 8).setOrigin(0.5).setTint(0xf8f0d0);

    // 3. The cast slides in.
    o.cast = ['WILLIE', 'BETTY', 'GLEN'].map((sp, i) => {
      const panel = add.graphics();
      panel.fillStyle([0xc0782c, 0xe060a0, 0x505058][i]).fillRect(0, 0, 80, 112);
      panel.fillStyle(0x000000, 0.2).fillRect(0, 96, 80, 16);
      const img = add.image(40, 92, 'pf_' + sp).setOrigin(0.5, 1).setScale(1.2);
      const name = add.bitmapText(40, 100, FONT, ['WILLIE', 'BETTY', 'GLEN'][i], 8).setOrigin(0.5, 0).setTint(0xf8f8f8);
      return add.container(0, 0, [panel, img, name]);
    });
    o.castLine = add.bitmapText(120, 116, FONT, 'THEY KEEP\nPEOPLE.', 16).setOrigin(0.5, 0).setTint(0xf8d070).setCenterAlign().setLineSpacing(2);

    // 4. Face-off.
    o.vsBg = add.graphics();
    o.vsLeft = add.image(0, 120, 'pf_AMOS').setOrigin(0.5, 1).setScale(2);
    o.vsRight = add.image(0, 120, 'pf_KENNY').setOrigin(0.5, 1).setScale(2);
    o.vs = add.bitmapText(120, 52, FONT, 'VS', 32).setOrigin(0.5).setTint(0xf8f8f8);
    (o.vs as any).setDropShadow?.(3, 3, 0x181820, 1);
    o.vsLine = add.bitmapText(120, 132, FONT, 'TRAIN THEM. FIGHT THEM.', 8).setOrigin(0.5).setTint(0xf8f0d0);

    // 5. The catch.
    o.catchBg = add.graphics();
    o.catchBg.fillStyle(0x80c858).fillRect(0, 0, 240, 160);
    o.catchBg.fillStyle(0x60a840).fillEllipse(120, 112, 140, 30);
    o.joe = add.image(120, 112, 'pf_JOE').setOrigin(0.5, 1).setScale(1.6);
    o.sack = add.image(120, -40, 'sack').setScale(4).setOrigin(0.5, 1);
    o.stars = add.graphics();
    o.gotcha = add.bitmapText(120, 22, FONT, 'GOTCHA!', 24).setOrigin(0.5).setTint(0xf8f8f8);
    o.catchLine = add.bitmapText(120, 136, FONT, 'THEN BAG THEM.', 8).setOrigin(0.5).setTint(0x283028);

    // 6. Logo.
    o.logoBg = add.graphics();
    [0x281830, 0x402040, 0x683050, 0x985060, 0xc87060, 0xe8a070].forEach((c, i) => o.logoBg.fillStyle(c).fillRect(0, i * 14, 240, 14));
    o.logoBg.fillStyle(0x201828).fillRect(0, 84, 240, 76);
    o.logoCast = ['WILLIE', 'AMOS', 'PETE'].map((sp, i) => add.image(50 + i * 70, 160, 'pf_' + sp).setOrigin(0.5, 1));
    o.logo1 = add.bitmapText(120, 18, FONT, 'TRAILER PARK', 16).setOrigin(0.5, 0).setTint(0xf8e070);
    o.logo2 = add.bitmapText(120, 38, FONT, 'TAMERS', 24).setOrigin(0.5, 0).setTint(0xf87848);
    for (const t of [o.logo1, o.logo2]) (t as any).setDropShadow?.(2, 2, 0x201828, 1);
    o.url = add.bitmapText(120, 72, FONT, 'TPT.PARBS.ONLINE', 8).setOrigin(0.5, 0).setTint(0xf8f8f8);

    // Flash and skip hint on top.
    o.flash = add.graphics().setDepth(100);
    o.skip = add.bitmapText(236, 152, FONT, 'SKIP: ANY KEY', 8).setOrigin(1, 0).setTint(0x8888a0).setDepth(101);

    if (!this.manual) music('intro');
    this.render(0);
  }

  update(_t: number, dt: number) {
    if (this.manual || this.done) return;
    if (Input.pressed('a') || Input.pressed('b') || Input.pressed('start') || Input.pressed('select')) {
      Input.consume();
      this.finish();
      return;
    }
    this.t += dt / 1000;
    this.render(this.t);
    if (this.t >= INTRO_LENGTH) this.finish();
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Title'));
  }

  /** Place everything for time t (seconds). */
  render(t: number) {
    const o = this.o;
    const cam = this.cameras.main;
    cam.setScroll(0, 0);

    // 1. PARBS (0-2)
    const s1 = between(t, 0, 2);
    o.parbs.setVisible(s1).setAlpha(prog(t, 0.2, 0.7) * (1 - prog(t, 1.5, 1.9)));
    o.presents.setVisible(s1).setAlpha(prog(t, 0.6, 1.0) * (1 - prog(t, 1.5, 1.9)));

    // 2. Street (2-6)
    const s2 = between(t, 2, 6);
    o.street.setVisible(s2);
    o.caption.setVisible(s2);
    if (s2) {
      const u = t - 2;
      o.far.x = -((u * 14) % 70);
      o.near.x = -((u * 34) % 110);
      o.walker.x = -20 + u * 52;
      o.walker.setFrame(6 + (Math.floor(u * 6) % 3));
      o.walker2.x = -70 + u * 52;
      o.walker2.setFrame(6 + ((Math.floor(u * 6) + 1) % 3));
      o.fire.clear();
      const fx = 180 - u * 34;
      o.fire.fillStyle(0x8c4c2c).fillRect(fx, 100, 12, 14);
      o.fire.fillStyle(0xf08020).fillEllipse(fx + 6, 96, 12 + Math.sin(u * 20) * 2, 12);
      o.fire.fillStyle(0xf8d040).fillEllipse(fx + 6, 98, 6, 7);
      const lines = ['IN PINE ACRES TRAILER PARK,', "FOLKS DON'T KEEP PETS..."];
      const line = u < 2 ? lines[0] : lines[1];
      const typed = Math.floor(prog(u % 2, 0.1, 1.2) * line.length);
      o.caption.setText(line.slice(0, typed));
    }

    // 3. Cast (6-8): one panel per beat.
    const s3 = between(t, 6, 8);
    o.cast.forEach((c: Phaser.GameObjects.Container, i: number) => {
      c.setVisible(s3);
      const k = ease.out(prog(t, 6 + i * 0.5, 6.35 + i * 0.5));
      c.setPosition(i * 80 + (1 - k) * 260, 0);
    });
    o.castLine.setVisible(s3 && t >= 7.5).setScale(t >= 7.5 ? 1 + (1 - ease.out(prog(t, 7.5, 7.7))) * 0.6 : 1);

    // 4. Face-off (8-10)
    const s4 = between(t, 8, 10);
    for (const k of ['vsBg', 'vsLeft', 'vsRight', 'vs', 'vsLine']) o[k].setVisible(s4);
    if (s4) {
      const u = t - 8;
      o.vsBg.clear();
      o.vsBg.fillStyle(0xd8c040).fillTriangle(0, 0, 150, 0, 90, 160).fillTriangle(0, 0, 90, 160, 0, 160);
      o.vsBg.fillStyle(0x58b848).fillTriangle(150, 0, 240, 0, 240, 160).fillTriangle(150, 0, 240, 160, 90, 160);
      o.vsBg.fillStyle(0xf8f8f8).fillTriangle(146, 0, 154, 0, 90, 160).fillTriangle(146, 0, 94, 160, 86, 160);
      o.vsBg.fillStyle(0x181820, 0.85).fillRect(0, 124, 240, 18);
      o.vsLeft.x = 60 - (1 - ease.out(prog(u, 0, 0.4))) * 140;
      o.vsRight.x = 184 + (1 - ease.out(prog(u, 0, 0.4))) * 140;
      const slam = prog(u, 0.5, 0.65);
      o.vs.setVisible(u >= 0.5).setScale(1 + (1 - ease.out(slam)) * 2);
      if (between(u, 0.5, 0.8)) cam.setScroll(Math.sin(u * 90) * 3, Math.cos(u * 70) * 2);
      o.vsLine.setVisible(u >= 1);
    }

    // 5. Catch (10-12): sack drops, three shakes on the beat, gotcha.
    const s5 = between(t, 10, 12);
    for (const k of ['catchBg', 'joe', 'sack', 'stars', 'gotcha', 'catchLine']) o[k].setVisible(s5);
    if (s5) {
      const u = t - 10;
      const drop = ease.in(prog(u, 0, 0.3));
      o.sack.y = -40 + drop * 152;
      o.joe.setVisible(u < 0.3).setScale(1.6 * (1 - prog(u, 0.2, 0.3)));
      let angle = 0;
      for (const b of [0.5, 0.9, 1.3]) if (between(u, b, b + 0.25)) angle = Math.sin(((u - b) / 0.25) * Math.PI * 2) * 22;
      o.sack.setAngle(angle).setTint(u >= 1.6 ? 0xb8b8b8 : 0xffffff);
      o.stars.clear();
      if (u >= 1.6) {
        const r = 20 + ease.out(prog(u, 1.6, 2)) * 40;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          o.stars.fillStyle(0xf8e070).fillRect(120 + Math.cos(a) * r - 2, 88 + Math.sin(a) * r * 0.6 - 2, 4, 4);
        }
      }
      o.gotcha.setVisible(u >= 1.6).setScale(1 + (1 - ease.out(prog(u, 1.6, 1.8))) * 0.8);
    }

    // 6. Logo (12-16)
    const s6 = t >= 12;
    for (const k of ['logoBg', 'logo1', 'logo2', 'url']) o[k].setVisible(s6);
    o.logoCast.forEach((img: Phaser.GameObjects.Image, i: number) => {
      img.setVisible(s6);
      img.y = 200 - ease.back(prog(t, 12.4 + i * 0.25, 12.9 + i * 0.25)) * 42;
    });
    if (s6) {
      o.logo1.y = 18 - (1 - ease.out(prog(t, 12, 12.25))) * 60;
      o.logo2.setScale(1 + (1 - ease.out(prog(t, 12.5, 12.7))) * 1.5).setVisible(t >= 12.5);
      o.url.setVisible(t >= 13.5).setAlpha(0.6 + 0.4 * Math.abs(Math.sin(t * 3)));
    }

    // Flashes on the big cuts.
    o.flash.clear();
    for (const c of [6, 8.5, 11.6, 12.5]) {
      const f = 1 - prog(t, c, c + 0.25);
      if (t >= c && f > 0) o.flash.fillStyle(0xffffff, f * 0.9).fillRect(0, 0, 240, 160);
    }
    o.skip.setVisible(!this.manual && t > 0.5 && t < 15.5);
  }
}
