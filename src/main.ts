import Phaser from 'phaser';
import { buildFont } from './gfx/font';
import { buildTextures } from './gfx/textures';
import { Input, installInput } from './game/input';
import { audioRunning, resumeMusic, unlockAudio } from './audio/sound';
import { Title } from './scenes/Title';
import { Intro } from './scenes/Intro';
import { installChat } from './ui/chat';
import { Overworld } from './scenes/Overworld';
import { BattleScene } from './scenes/Battle';

class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  async create() {
    await buildFont(this);
    buildTextures(this);
    this.scene.start('Intro');
  }
}

installInput();
installChat();

// Audio can only start after a tap or key press. Keep listening: phones suspend audio
// when the screen locks or another app takes over, and the next tap has to wake it.
let started = false;
const unlock = () => {
  const wasRunning = audioRunning();
  unlockAudio();
  if (!started || !wasRunning) {
    started = true;
    resumeMusic();
  }
};
for (const ev of ['keydown', 'pointerdown', 'touchend'] as const) window.addEventListener(ev, unlock, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && started) unlockAudio();
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 240,
  height: 160,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { keyboard: false, mouse: false, touch: false, gamepad: false },
  scene: [Boot, Intro, Title, Overworld, BattleScene],
});

game.events.on(Phaser.Core.Events.POST_STEP, () => Input.endFrame());

// Handy for debugging in the console and for the screenshot script.
if (import.meta.env.DEV) {
  void Promise.all([import('./game/state'), import('./game/creature'), import('./net/client'), import('./audio/sound')]).then(([state, creature, client, sound]) => {
    (window as any).tpt = { game, state, creature, Input, net: client.net, sound };
  });
}
