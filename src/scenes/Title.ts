import Phaser from 'phaser';
import { FONT } from '../gfx/font';
import { Input } from '../game/input';
import { G, hasSave, load, loadFrom, newGame, setState } from '../game/state';
import { net } from '../net/client';
import { OUTFIT_LOOKS } from '../gfx/people';
import { isMuted, music, sfx, toggleMute } from '../audio/sound';
import { UI } from '../ui/ui';

export class Title extends Phaser.Scene {
  private ui!: UI;
  private ready = false;

  constructor() {
    super('Title');
  }

  create() {
    this.ui = new UI(this);
    this.ready = false;
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x281830);

    // Dusk sky over the trailer park.
    const g = this.add.graphics();
    const bands = [0x281830, 0x402040, 0x683050, 0x985060, 0xc87060, 0xe8a070];
    bands.forEach((c, i) => g.fillStyle(c).fillRect(0, i * 14, 240, 14));
    g.fillStyle(0xf8d890).fillCircle(190, 84, 16);
    g.fillStyle(0x201828).fillRect(0, 84, 240, 76);
    // Trailers in silhouette.
    for (const [x, w] of [[8, 60], [80, 70], [164, 64]]) {
      g.fillStyle(0x382838).fillRect(x, 70, w, 16);
      g.fillStyle(0xf8d070).fillRect(x + 8, 74, 6, 5).fillRect(x + w - 16, 74, 6, 5);
    }
    g.fillStyle(0x382838).fillRect(150, 50, 3, 36).fillRect(140, 50, 24, 2);

    // A lineup of drifters.
    const cast = ['WILLIE', 'AMOS', 'PETE'];
    cast.forEach((sp, i) => {
      const img = this.add.image(50 + i * 70, 160, 'pf_' + sp).setOrigin(0.5, 1);
      img.setY(200);
      this.tweens.add({ targets: img, y: 158, delay: 300 + i * 150, duration: 500, ease: 'Back.out' });
    });

    const t1 = this.add.bitmapText(120, 18, FONT, 'TRAILER PARK', 16).setOrigin(0.5, 0).setTint(0xf8e070);
    const t2 = this.add.bitmapText(120, 38, FONT, 'TAMERS', 24).setOrigin(0.5, 0).setTint(0xf87848);
    for (const t of [t1, t2]) if ((t as any).setDropShadow) t.setDropShadow(2, 2, 0x201828, 1);
    const press = this.add.bitmapText(120, 92, FONT, 'PRESS START', 8).setOrigin(0.5, 0).setTint(0xf8f8f8);
    this.tweens.add({ targets: press, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });
    this.add.bitmapText(2, 2, FONT, 'v0.2', 8).setTint(0x806878);

    music('title');
    this.time.delayedCall(400, () => (this.ready = true));
    this.events.once('menu', () => {
      press.destroy();
      void this.menu();
    });
  }

  update() {
    if (this.ui.busy) {
      this.ui.update();
      return;
    }
    if (this.ready && (Input.pressed('start') || Input.pressed('a'))) {
      this.ready = false;
      sfx('select');
      Input.consume();
      this.events.emit('menu');
    }
  }

  private async menu() {
    if (!net.isOnline) {
      this.ui.show('Connecting to the server...');
      await net.connect();
      this.ui.close();
    }
    for (;;) {
      const cloud = net.isOnline && net.serverSave ? net.serverSave : null;
      const opts = cloud || hasSave() ? ['CONTINUE', 'NEW GAME', 'USE CODE', 'SOUND'] : ['NEW GAME', 'USE CODE', 'SOUND'];
      const i = await this.ui.choose(opts, { x: 76, y: 88, w: 96 });
      const o = opts[i];
      if (o === 'USE CODE') {
        await this.useCode();
        continue;
      }
      if (o === 'SOUND') {
        const m = toggleMute();
        await this.ui.say(m ? 'Sound is OFF.' : 'Sound is ON.');
        this.ui.close();
        continue;
      }
      if (o === 'CONTINUE') {
        if (cloud ? loadFrom(cloud) : load()) return this.go();
        await this.ui.say("That save file is busted. Starting fresh might be your only hope.");
        this.ui.close();
        continue;
      }
      if (cloud || hasSave()) {
        const sure = await this.ui.ask('Start over? Your old save gets wiped when you next save.');
        this.ui.close();
        if (sure !== 0) continue;
      }
      setState(newGame());
      await this.intro();
      return this.go();
    }
  }

  private async intro() {
    const ui = this.ui;
    const dim = this.add.graphics().setDepth(900);
    dim.fillStyle(0x101018).fillRect(0, 0, 240, 160);
    const dale = this.add.image(120, 100, 'tf_dale').setOrigin(0.5, 1).setDepth(901).setAlpha(0);
    this.tweens.add({ targets: dale, alpha: 1, duration: 400 });
    music('inside');
    await ui.talk(
      "Well, howdy! Welcome to PINE ACRES TRAILER PARK. Name's DALE. Most folks call me UNCLE DALE, related or not.",
      "Round here, folks don't keep pets. Can't afford 'em.",
      'Instead, they keep PEOPLE. Drifters, winos, preachers, can collectors... We call \'em the CREW.',
      'You find one, wear \'em down, throw a sack over \'em, and boom. They fight for you now.',
      "Is it legal? Ehh. Is it ethical? Hoo boy. Is it a living? You bet your boots it is.",
      'Now, remind me, kid. What was your name again?',
    );
    const names = ['KID', 'BUBBA', 'DESTINY', 'TREY', 'TYPE IT...'];
    const i = await ui.choose(names, { x: 140, y: 4, w: 98 });
    let name = names[Math.max(0, i)];
    if (name === 'TYPE IT...') {
      Input.releaseAll();
      const typed = window.prompt('Your name (up to 8 letters):', '') ?? '';
      name = typed.replace(/[^A-Za-z0-9 .'-]/g, '').trim().toUpperCase().slice(0, 8) || 'KID';
    }
    G.name = name;
    await ui.say('And what do you look like these days?', 1);
    const card = this.add.graphics().setDepth(902);
    card.fillStyle(0xf8f8f8).fillRoundedRect(24, 14, 76, 80, 6);
    card.lineStyle(2, 0x283048).strokeRoundedRect(24, 14, 76, 80, 6);
    const pic = this.add.image(62, 90, 'tf_out0').setOrigin(0.5, 1).setDepth(903);
    dale.setVisible(false);
    const o = await ui.choose(OUTFIT_LOOKS.map((x) => x.name), { x: 140, y: 4, w: 98, onMove: (k) => pic.setTexture('tf_out' + k) });
    G.outfit = Math.max(0, o);
    card.destroy();
    pic.destroy();
    dale.setVisible(true);
    net.send({ t: 'profile', name: G.name, outfit: G.outfit });
    await ui.talk(
      `${G.name}! That's right. Your cousin BOBBY RAY'll be around too. He's... a lot.`,
      'Now get up, get dressed, and come see me. Your future in the people business starts today!',
    );
    ui.close();
    await new Promise<void>((r) => this.tweens.add({ targets: [dale], alpha: 0, duration: 400, onComplete: () => r() }));
  }

  private async useCode() {
    const ui = this.ui;
    if (net.isOnline) await ui.say(`Your code is ${net.prettyCode}. Enter it on another device to play as you there.`);
    const yes = await ui.ask('Log in with a code from another device?');
    ui.close();
    if (yes !== 0) return;
    Input.releaseAll();
    const code = window.prompt('Enter your 16-letter code:', '') ?? '';
    if (code.replace(/[^A-Za-z0-9]/g, '').length !== 16) {
      await ui.say("That doesn't look like a code.");
      ui.close();
      return;
    }
    ui.show('Logging in...');
    const ok = await net.useCode(code);
    if (!ok) {
      await ui.say(net.refusedReason || "Couldn't reach the server.");
      net.refusedReason = '';
      await net.connect();
    } else {
      await ui.say(net.serverSave ? `Welcome back, ${net.name}!` : `Logged in as ${net.name}. No save there yet.`);
    }
    ui.close();
  }

  private go() {
    if (net.isOnline) net.send({ t: 'profile', name: G.name, outfit: G.outfit ?? 0 });
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Overworld');
    });
  }
}

export { isMuted };
