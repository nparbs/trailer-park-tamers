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
  if (id === 'BOLT') {
    await ow.ui.say('Walk up to a weak spot in a chain-link fence (the zip-tied part) and press A.');
    return;
  }
  if (def.kind === 'key') {
    ow.toggleSkate();
    return;
  }
  if (def.kind === 'seed') {
    await ow.ui.say('Plant it in an empty pot at the grow house in Grimsby.');
    return;
  }
  if (def.kind === 'held') {
    const k = await pickFromParty(ow, ow.ui, { title: `Give ${def.name.toUpperCase()} to who?` });
    if (k < 0) return;
    const d = G.party[k];
    if (d.held === id) return void (await ow.ui.say(`${displayName(d)} is already holding one.`));
    const old = d.held;
    G.bag[id]!--;
    if (old) G.bag[old] = (G.bag[old] ?? 0) + 1;
    d.held = id;
    sfx('select');
    await ow.ui.say(old ? `${displayName(d)} swapped the ${item(old).name.toUpperCase()} for the ${def.name.toUpperCase()}.` : `${displayName(d)} is now holding the ${def.name.toUpperCase()}.`);
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
    if (d.hp >= m && !(def.cures && d.status)) return void (await ow.ui.say("They're already fine."));
    const before = d.hp;
    d.hp = Math.min(m, d.hp + (def.heal ?? 0));
    if (def.cures) d.status = null;
    G.bag[id]!--;
    sfx('heal');
    await ow.ui.say(d.hp > before ? `${displayName(d)} got ${d.hp - before} HP back.` : `${displayName(d)} is feeling better!`);
    return;
  } else if (def.kind === 'cure') {
    if (!d.status) return void (await ow.ui.say('Nothing wrong with them. Well, nothing that salts can fix.'));
    d.status = null;
  }
  G.bag[id]!--;
  sfx('heal');
  await ow.ui.say(`${displayName(d)} is feeling better!`);
}
