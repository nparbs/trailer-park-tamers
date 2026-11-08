// Move tutors: NPCs who teach a crew member a move for cash.
// Each one sits in a map as an NPC with script 'tutor' and the same id as its key here.

import type { MoveId } from './moves';

export interface TutorDef {
  name: string;
  /** Lines the first time you talk to them. */
  hello: string[];
  /** Said each time before the list. */
  pitch: string;
  /** Said when you leave without buying. */
  bye: string;
  /** Said after a lesson. */
  done: string;
  lessons: { move: MoveId; price: number; blurb: string }[];
  /** Drugs and booze: HOLY drifters won't touch it. */
  vice?: boolean;
  /** Flag needed before they'll teach (usually beating the trainer in the same room). */
  needs?: { flag: string; text: string };
}

export const TUTORS: Record<string, TutorDef> = {
  tut_stoner: {
    name: 'BUDS',
    hello: [
      "BUDS: Duuude. You're the one who beat SKUNK? Respect.",
      "I'm, like, a teacher now. Of the ancient arts. For a small fee.",
    ],
    pitch: "BUDS: What do you wanna learn, little dude?",
    bye: 'BUDS: No rush. Time is fake anyway.',
    done: "BUDS: Beautiful. I'm actually kind of emotional right now.",
    vice: true,
    needs: { flag: 'tr_tr_grower', text: "BUDS: Shh. Skunk's in a mood. Settle up with him first, then we'll talk." },
    lessons: [
      { move: 'BONG_CLEAR', price: 600, blurb: 'CHEM, power 70. Might leave them passed OUT.' },
      { move: 'COUCH_LOCK', price: 350, blurb: "CHEM. Sharply lowers the foe's speed." },
      { move: 'HOTBOX', price: 900, blurb: 'CHEM. Knocks the foe OUT if it lands.' },
    ],
  },

  tut_tweaker: {
    name: 'SPEEDY',
    hello: [
      "SPEEDY: HEY. HEY. HEY. You beat LARRY. That's crazy. I've been awake for six days. Also crazy.",
      "I know stuff. Lab stuff. I'll teach your guys. Cash only. Cash is good. I like cash.",
    ],
    pitch: 'SPEEDY: Pick one pick one pick one.',
    bye: "SPEEDY: Okay. Okay. I'm gonna reorganize these screws again.",
    done: "SPEEDY: YES. They're gonna be up all night. Like me. We can hang out.",
    vice: true,
    needs: { flag: 'tr_tr_cook', text: "SPEEDY: Not while LARRY's watching. Go handle LARRY. Then come back. I'll be here. I'm always here." },
    lessons: [
      { move: 'SMOKE_METH', price: 800, blurb: 'CHEM, power 80. Also raises their speed.' },
      { move: 'TWEAK_OUT', price: 400, blurb: 'CHEM. Sharply raises their own speed.' },
      { move: 'LAB_BLAST', price: 1500, blurb: 'CHEM, power 130. Big boom. Hurts them too.' },
    ],
  },

  tut_drunk: {
    name: 'RANDY',
    hello: [
      "RANDY: Cletus's brother-in-law. I'm stayin' on the couch till I get back on my feet.",
      "Been eleven years. But I learned a thing or two about drinkin'. I'll pass it on, for beer money.",
    ],
    pitch: 'RANDY: Whatcha want, kid? Pick your poison.',
    bye: "RANDY: Suit yourself. More for me.",
    done: "RANDY: Atta boy! Now that's a party animal.",
    vice: true,
    lessons: [
      { move: 'SHOTGUN_BEER', price: 300, blurb: 'BOOZE, power 40. Always goes first.' },
      { move: 'KEG_STAND', price: 500, blurb: 'BOOZE. Heals half their health.' },
      { move: 'BENDER', price: 1200, blurb: 'BOOZE, power 110. Hurts them too.' },
    ],
  },

  tut_fence: {
    name: 'VINNIE',
    hello: [
      "VINNIE: I'm not here. You didn't see me. I'm the fence.",
      "Everything in this shop came from somewhere. I can teach your crew how it got here.",
    ],
    pitch: "VINNIE: Lessons. Cash. No receipts.",
    bye: "VINNIE: You never talked to me.",
    done: "VINNIE: Pleasure. Now forget my face.",
    lessons: [
      { move: 'FIVE_FINGER', price: 450, blurb: 'SLICK, power 50. Heals them by half the damage.' },
      { move: 'SNITCH', price: 350, blurb: "SLICK. Sharply lowers the foe's accuracy." },
      { move: 'SMASH_GRAB', price: 1000, blurb: 'SLICK, power 80.' },
    ],
  },
};
