import { item, type ItemId } from '../data/items';
import { displayName, maxHp } from '../game/creature';
import { G } from '../game/state';
import { sfx } from '../audio/sound';
import { pickFromParty } from '../ui/screens';
import type { Overworld } from './Overworld';

/** Use a bag item from the overworld menu. */
export async function useItemOutside(ow: Overworld, id: ItemId) {
  const def = item(id);
  if (def.kind === 'catch') {
    await ow.ui.say("You can't just bag somebody in broad daylight. Wear them down in a fight first.");
    return;
  }
  const i = await pickFromParty(ow, ow.ui, { title: `Use ${def.name.toUpperCase()} on who?` });
  if (i < 0) return;
  const d = G.party[i];
  const m = maxHp(d);
  if (def.kind === 'revive') {
    if (d.hp > 0) return void (await ow.ui.say("They're already up and about."));
    d.hp = Math.max(1, Math.floor(m * (def.revive ?? 0.5)));
    d.status = null;
  } else if (def.kind === 'heal') {
    if (d.hp <= 0) return void (await ow.ui.say("They're knocked out. You'll need JUMPER CABLES."));
    if (d.hp >= m) return void (await ow.ui.say("They're already fine."));
    const before = d.hp;
    d.hp = Math.min(m, d.hp + (def.heal ?? 0));
    G.bag[id]!--;
    sfx('heal');
    await ow.ui.say(`${displayName(d)} got ${d.hp - before} HP back.`);
    return;
  } else if (def.kind === 'cure') {
    if (!d.status) return void (await ow.ui.say('Nothing wrong with them. Well, nothing that salts can fix.'));
    d.status = null;
  }
  G.bag[id]!--;
  sfx('heal');
  await ow.ui.say(`${displayName(d)} is feeling better!`);
}
