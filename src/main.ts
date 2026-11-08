import Phaser from 'phaser';
import { buildFont } from './gfx/font';
import { buildTextures } from './gfx/textures';
import { Input, installInput } from './game/input';
import { resumeMusic, unlockAudio } from './audio/sound';
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

// Audio can only start after the first tap or key press.
let unlocked = false;
const unlock = () => {
  if (unlocked) return;
  unlocked = true;
  unlockAudio();
  resumeMusic();
};
window.addEventListener('keydown', unlock);
window.addEventListener('pointerdown', unlock);

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
