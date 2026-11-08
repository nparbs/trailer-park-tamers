// Move tutors: pick a lesson, pick a crew member, pay up.

import { move, type MoveId } from '../data/moves';
import { species } from '../data/species';
import { TUTORS } from '../data/tutors';
import { displayName, learnMove, replaceMove, type Drifter } from '../game/creature';
import { G } from '../game/state';
import { sfx } from '../audio/sound';
import { pickFromParty } from '../ui/screens';
import type { Overworld } from './Overworld';

export async function tutor(ow: Overworld, id: string) {
  const t = TUTORS[id];
  const ui = ow.ui;
  if (!t) return;
  if (t.needs && !G.flags[t.needs.flag]) {
    await ui.say(t.needs.text);
    return;
  }
  if (!G.flags['met_' + id]) {
    await ui.talk(...t.hello);
    G.flags['met_' + id] = true;
  }
  if (!G.party.length) {
    await ui.say(`${t.name}: You don't even have a crew. Come back when you got students.`);
    return;
  }
  let last = 0;
  for (;;) {
    const opts = [...t.lessons.map((l) => `${move(l.move).name.toUpperCase()} $${l.price}`), 'LEAVE'];
    ui.show(`${t.pitch} (You have $${G.money}.)`);
    const k = await ui.choose(opts, {
      cancel: true,
      initial: last,
      y: 2,
      onMove: (i) => ui.show(i < t.lessons.length ? t.lessons[i].blurb : `${t.pitch} (You have $${G.money}.)`),
    });
    if (k < 0 || k >= t.lessons.length) {
      await ui.say(t.bye);
      return;
    }
    last = k;
    const lesson = t.lessons[k];
    const mv = move(lesson.move).name.toUpperCase();
    if (G.money < lesson.price) {
      await ui.say(`${t.name}: That's $${lesson.price}. You got $${G.money}. Do the math.`);
      continue;
    }
    const why = (d: Drifter) => blocked(d, lesson.move, !!t.vice);
    const i = await pickFromParty(ow, ui, { title: `Teach ${mv} to who?`, disabled: (d) => !!why(d) });
    if (i < 0) continue;
    const d = G.party[i];
    const reason = why(d);
    if (reason) {
      await ui.say(reason);
      continue;
    }
    const yes = await ui.ask(`Pay $${lesson.price} to teach ${displayName(d).toUpperCase()} ${mv}?`);
    if (yes !== 0) continue;
    if (await teach(ow, d, lesson.move)) {
      G.money -= lesson.price;
      sfx('buy');
      await ui.say(t.done);
      return;
    }
  }
}

/** Why a drifter can't take this lesson, or '' if they can. */
function blocked(d: Drifter, id: MoveId, vice: boolean): string {
  const name = displayName(d).toUpperCase();
  if (d.moves.some((m) => m.id === id)) return `${name} already knows ${move(id).name.toUpperCase()}.`;
  if (vice && species(d.sp).types.includes('HOLY')) return `${name} refuses. "My body is a temple. A run-down one, but a temple."`;
  return '';
}

/** Learn a move outside battle, offering to forget one if all four slots are full. */
async function teach(ow: Overworld, d: Drifter, id: MoveId): Promise<boolean> {
  const ui = ow.ui;
  const name = displayName(d).toUpperCase();
  const mv = move(id).name.toUpperCase();
  if (learnMove(d, id)) {
    sfx('levelup');
    await ui.say(`${name} learned ${mv}!`);
    return true;
  }
  await ui.say(`${name} wants to learn ${mv}, but already knows four moves.`);
  for (;;) {
    const yes = await ui.ask(`Forget a move to make room for ${mv}?`);
    if (yes !== 0) {
      await ui.say(`${name} did not learn ${mv}.`);
      return false;
    }
    const names = d.moves.map((x) => move(x.id).name.toUpperCase());
    ui.show('Which move should be forgotten?');
    const k = await ui.choose(names, { cancel: true });
    if (k < 0) continue;
    const old = names[k];
    replaceMove(d, k, id);
    sfx('levelup');
    await ui.say(`1, 2, and... Poof! ${name} forgot ${old} and learned ${mv}!`);
    return true;
  }
}
