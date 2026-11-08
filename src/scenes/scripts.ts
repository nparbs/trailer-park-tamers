// Story scripts, keyed by name from the map data.

import { species, STARTERS, type SpeciesId } from '../data/species';
import { makeDrifter } from '../game/creature';
import { G, addItem, healParty, markSeen, recruit } from '../game/state';
import { music, sfx } from '../audio/sound';
import { shop, storage } from '../ui/screens';
import type { Overworld, Walker } from './Overworld';

type Script = (ow: Overworld, n?: Walker) => Promise<void>;

const RIVAL_PICK: Record<string, SpeciesId> = { WILLIE: 'PETE', AMOS: 'WILLIE', PETE: 'AMOS' };

async function daleGivesDex(ow: Overworld) {
  const ui = ow.ui;
  await ui.talk(
    "UNCLE DALE: Not bad, not bad! Now listen up.",
    "There's folks all over Rail Yard Road and Grimsby with nowhere to go and nothin' to do.",
    "Walk through the weeds and they'll jump right out at ya. Knock 'em around a bit, then throw one of these over 'em.",
  );
  sfx('levelup');
  addItem('SACK', 5);
  await ui.say(`${G.name} got 5 BURLAP SACKS!`);
  await ui.say('UNCLE DALE: And this here is a STREETDEX. Write down every bum you meet. Knowledge is power, kid.');
  sfx('levelup');
  G.flags.dex = true;
  await ui.say(`${G.name} got the STREETDEX!`);
  await ui.talk(
    'UNCLE DALE: Last thing. Up in GRIMSBY there\'s a fella named BIG TONY. Runs the whole block out of a trap house.',
    "Beat him and you'll have real STREET CRED. Then we're in business.",
  );
}

export const SCRIPTS: Record<string, Script> = {
  async mom(ow) {
    const ui = ow.ui;
    if (!G.flags.starter) {
      await ui.talk(
        `MOM: Oh, ${G.name}, you're up. It's 2 PM, hon.`,
        "Your Uncle Dale came by. Said he's got a 'business opportunity' for you.",
        "His trailer's the rusty one across the way. Don't let him sell you anything.",
      );
      return;
    }
    await ui.say('MOM: Your crew looks rough. Let me fix them up some Hamburger Helper.');
    ui.close();
    await healAnim(ow);
    G.respawn = { map: 'home', x: 4, y: 5 };
    await ui.say("MOM: There. Now get out there and make me proud. Or at least make rent.");
  },

  async need_starter(ow) {
    const ui = ow.ui;
    await ui.say('???: HOLD IT RIGHT THERE!');
    await ui.talk(
      "UNCLE DALE: Kid, you can't go out on Rail Yard Road alone! Folks out there'll take your shoes.",
      'Come by my trailer. The rusty one. I got something for ya.',
    );
    ui.close();
    await ow.walk(ow.player, 'down', 1);
    G.y = ow.player.y;
  },

  async dale(ow) {
    const ui = ow.ui;
    if (!G.flags.starter) {
      if (!G.flags.dale_met) {
        await ui.talk(
          `UNCLE DALE: ${G.name}! There you are! Listen. The scrap market dried up, so I got into a new line of work.`,
          'Folks around here got nothin\'. No house, no job, no plan.',
          "But they got FIGHT in 'em! Feed 'em, train 'em, and they'll brawl for ya.",
          'I rounded up three good ones. Pick one, and that\'s your crew.',
        );
        G.flags.dale_met = true;
      }
      await ui.say("UNCLE DALE: Go on. Talk to whichever one you like. Don't mind your cousin, he just showed up.");
      return;
    }
    if (!G.flags.dex) {
      await daleGivesDex(ow);
      return;
    }
    if (G.flags.badge1) {
      await ui.say("UNCLE DALE: You beat TONY?! I'm so proud I could cry. Or that's the gas leak again.");
      return;
    }
    await ui.say("UNCLE DALE: Go get 'em, kid. If you see Tony, tell him the forty bucks is in the mail.");
  },

  async starter(ow, n) {
    const ui = ow.ui;
    const sp = n!.def!.id.replace('st_', '') as SpeciesId;
    if (!G.flags.dale_met) {
      await ui.say("This guy's just hanging out in Dale's trailer. Better talk to Dale first.");
      return;
    }
    const def = species(sp);
    const pic = ow.add.image(120, 52, 'pf_' + sp).setScrollFactor(0).setDepth(999);
    const bg = ow.add.graphics().setScrollFactor(0).setDepth(998);
    bg.fillStyle(0xf8f8f8).fillRoundedRect(84, 16, 72, 72, 6);
    bg.lineStyle(2, 0x283048).strokeRoundedRect(84, 16, 72, 72, 6);
    markSeen(sp);
    const yes = await ui.ask(`So you want ${def.name.toUpperCase()}, the ${def.types[0]} type?`);
    pic.destroy();
    bg.destroy();
    if (yes !== 0) return;
    const d = makeDrifter(sp, 5);
    d.caughtWith = 'DALE';
    recruit(d);
    G.flags.starter = true;
    G.flags['starter_' + sp] = true;
    ow.removeNpc(n!.def!.id);
    sfx('caught');
    await ui.say(`${def.name.toUpperCase()} joined ${G.name}'s crew!`);

    // The cousin grabs the one that beats yours.
    const rp = RIVAL_PICK[sp];
    const rival = ow.npc('rival');
    await ui.say(`${G.rival}: Then I'll take THIS guy!`);
    ow.removeNpc('st_' + rp);
    for (const s of STARTERS) ow.removeNpc('st_' + s);
    await ui.say(`${G.rival} grabbed ${species(rp).name.toUpperCase()}!`);
    await ui.say(`${G.rival}: Heh. Come on, cuz! Let's see whose bum is better!`);
    ui.close();
    if (rival) {
      // Walk over to the player.
      const p = ow.player;
      while (rival.x > p.x + 1) await ow.walk(rival, 'left', 1);
      while (rival.y > p.y) await ow.walk(rival, 'up', 1);
      while (rival.y < p.y) await ow.walk(rival, 'down', 1);
      ow.setFacing(rival, 'left');
      ow.setFacing(p, 'right');
    }
    const team = [makeDrifter(rp, 5)];
    const result = await ow.battle({
      enemy: team,
      wild: false,
      trainer: { cls: 'COUSIN', name: G.rival, team: [[rp, 5]], sight: 0, intro: [], lose: "WHAT?! I picked the wrong guy!", after: '', reward: 50 },
      trainerLook: 'rival',
      noBlackout: true,
    });
    if (result === 'lose') {
      healParty();
      await ui.say(`${G.rival}: HA! Told ya! ...Here, Dale, fix 'em up.`);
    } else {
      await ui.say(`${G.rival}: Whatever! I'm gonna go train at the dump. Smell ya later!`);
    }
    healParty();
    G.flags.rival1 = true;
    ui.close();
    if (rival) {
      while (rival.y < 6) await ow.walk(rival, 'down', 1, 160);
      ow.removeNpc('rival');
    }
    music('inside');
    await daleGivesDex(ow);
  },

  async rival_wait(ow) {
    await ow.ui.say(`${G.rival}: Hurry up and pick, cuz! I get whichever one's left!`);
  },

  async granny(ow) {
    const ui = ow.ui;
    if (!G.flags.granny_gift) {
      await ui.say("MEEMAW: Oh, you're going out, sugar? Take these burritos. They've been in the glovebox since Easter.");
      sfx('levelup');
      addItem('BURRITO', 3);
      G.flags.granny_gift = true;
      await ui.say(`${G.name} got 3 GAS STN BURRITOS!`);
      return;
    }
    await ui.say('MEEMAW: Back in my day, we only fought each other at weddings. And funerals. And Thanksgiving.');
  },

  async cletus(ow) {
    const ui = ow.ui;
    if (!G.flags.starter) {
      await ui.say("CLETUS: Heh. Dale's been out 'collecting' folks again. Somebody's gonna call somebody.");
      return;
    }
    if (!G.flags.cletus_gift) {
      await ui.say('CLETUS: Got yourself a crew, huh? If one of \'em gets WASTED or passes out, wave these under their nose.');
      sfx('levelup');
      addItem('SALTS', 2);
      G.flags.cletus_gift = true;
      await ui.say(`${G.name} got 2 SMELLING SALTS!`);
      return;
    }
    await ui.say("CLETUS: I'd come with ya, but my couch needs me. We have an understanding.");
  },

  async heal(ow) {
    const ui = ow.ui;
    await ui.say('SISTER AGNES: Welcome to St. Agnes. We feed the hungry and patch up the bruised.');
    const yes = await ui.ask('Shall I patch up your crew?');
    if (yes !== 0) {
      await ui.say('SISTER AGNES: Then God bless and good luck.');
      return;
    }
    await ui.say('SISTER AGNES: Hold still. This will sting.');
    ui.close();
    await healAnim(ow);
    G.respawn = { map: 'soup', x: 4, y: 3 };
    await ui.say('SISTER AGNES: There. Bless their hearts. Come back anytime. Please don\'t.');
  },

  async shop(ow) {
    const ui = ow.ui;
    await ui.say("CLERK: Welcome to GAS-N-GO. Don't touch the hot dogs.");
    const c = await ui.ask('What do you need?', ['BUY', 'NEVERMIND']);
    if (c !== 0) return;
    ui.close();
    const stock = G.flags.badge1
      ? (['SACK', 'TAPE', 'VAN', 'BURRITO', 'ENERGY', 'CASSEROLE', 'SALTS', 'DEFIB'] as const)
      : (['SACK', 'TAPE', 'BURRITO', 'ENERGY', 'SALTS', 'DEFIB'] as const);
    await shop(ow, ui, [...stock]);
    await ui.say('CLERK: Come again. Or don\'t. I get paid the same.');
  },

  async dealer(ow) {
    const ui = ow.ui;
    await ui.say("DEZ: Psst. Yo. You need somethin'? I got whatever helps your people feel better.");
    const c = await ui.ask('Buy something?', ['BUY', 'NAH']);
    if (c !== 0) return void (await ui.say("DEZ: Aight. I'll be here. I'm always here."));
    ui.close();
    const stock = G.flags.badge1 ? (['FORTY', 'LOKO', 'JOINT', 'SEED', 'PILLS'] as const) : (['FORTY', 'LOKO', 'JOINT', 'SEED'] as const);
    await shop(ow, ui, [...stock], "DEZ'S CORNER");
    await ui.say("DEZ: You ain't get that from me.");
  },

  async skateshop(ow) {
    const ui = ow.ui;
    await ui.say('CLERK: Welcome to Pawn & Skate. We buy gold, sell boards, and forget faces.');
    const c = await ui.ask('Buy something?', ['BUY', 'NAH']);
    if (c !== 0) return;
    ui.close();
    await shop(ow, ui, ['SKATEBOARD', 'TAPE', 'SALTS', 'ENERGY'], 'PAWN & SKATE');
    if (G.bag.SKATEBOARD) await ui.say('CLERK: Use the board from your BAG, or hit SELECT. Do NOT skate in my store.');
  },

  pot0: (ow) => pot(ow, 'pot0'),
  pot1: (ow) => pot(ow, 'pot1'),
  pot2: (ow) => pot(ow, 'pot2'),

  async storage(ow) {
    await storage(ow, ow.ui);
  },

  async cop(ow) {
    const ui = ow.ui;
    if (!G.flags.badge1) {
      await ui.talk(
        "OFFICER: Road's closed, kid. There's been an 'incident' down in THE BOTTOMS.",
        "Come back when you've got some STREET CRED. Or don't. I don't get paid enough for this.",
      );
    } else {
      await ui.talk(
        "OFFICER: You beat Big Tony? Huh. Didn't think anybody would.",
        "THE BOTTOMS are still taped off though. Check back in the next update.",
      );
    }
  },

  async after_tony(ow) {
    const ui = ow.ui;
    if (G.badges.includes('CORNER CRED')) return;
    G.badges.push('CORNER CRED');
    G.flags.badge1 = true;
    await ui.say("BIG TONY: Here. This is CORNER CRED. Everybody on this block'll know your face now.");
    sfx('caught');
    await ui.say(`${G.name} got the CORNER CRED!`);
    await ui.talk(
      "BIG TONY: The GAS-N-GO'll sell you VAN KEYS now. Don't ask what the van is for. Everybody knows what the van is for.",
      "BIG TONY: And if you're looking for real trouble... the cops can't keep THE BOTTOMS taped off forever.",
    );
    await ui.say('Thanks for playing the first slice of TRAILER PARK TAMERS! Keep training your crew. More turf is coming.');
  },
};

async function healAnim(ow: Overworld) {
  music(null);
  sfx('heal');
  ow.cameras.main.flash(300, 255, 255, 255);
  await ow.ui.wait(900);
  healParty();
  music(ow.map.music);
}

/** Grow pots: plant a seed, wait a few minutes of play, harvest joints. */
const GROW_MS = 5 * 60 * 1000;

async function pot(ow: Overworld, id: string) {
  const ui = ow.ui;
  const planted = G.grow?.[id];
  if (planted === undefined) {
    if (!G.bag.SEED) {
      await ui.say("An empty pot full of good dirt. You'd need a BAG SEED to grow anything.");
      return;
    }
    const yes = await ui.ask('An empty pot. Plant a BAG SEED?');
    if (yes !== 0) return;
    G.bag.SEED!--;
    G.grow = { ...(G.grow ?? {}), [id]: G.playMs };
    sfx('select');
    await ui.say("You pushed the seed into the dirt. Give it a few minutes under the lamp.");
    return;
  }
  const left = GROW_MS - (G.playMs - planted);
  if (left > 0) {
    const mins = Math.ceil(left / 60000);
    await ui.say(left > GROW_MS / 2 ? `A tiny sprout. About ${mins} more minute${mins === 1 ? '' : 's'}.` : `It's getting big and very smelly. About ${mins} more minute${mins === 1 ? '' : 's'}.`);
    return;
  }
  const n = 2 + Math.floor(Math.random() * 3);
  addItem('JOINT', n);
  const seedBack = Math.random() < 0.5;
  if (seedBack) addItem('SEED', 1);
  delete G.grow[id];
  sfx('levelup');
  await ui.say(`You harvested the plant and rolled ${n} JOINTS!${seedBack ? ' You also saved a BAG SEED.' : ''}`);
}
