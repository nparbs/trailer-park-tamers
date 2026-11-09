// Balance check: plays the story fights in order with the real battle rules and a
// simple "sensible player" policy, many times over, and prints how often each fight
// is won on the first try, what level the crew is at, and how much money you have.
//
//   npm run balance                     300 runs per starter and grind level
//   npm run balance -- 600              more runs
//   LOG_FIGHT="BIG TONY" npm run balance -- 1    print one fight turn by turn
//                                        (LOG_SKIP=n logs the n+1th one instead)
//
// The player policy: the starter fights half the wild fights alone; in the other half
// the weakest crew member starts and tags out to the starter so they share the exp.
// It picks the hardest-hitting move, eats a heal item under 40% HP in trainer fights,
// bags one new drifter per area, and heals between areas and before bosses. It never
// switches for a type matchup, so real players should do a bit better. "light",
// "normal" and "heavy" are how many wild fights you have in each area before taking
// on its trainers; heavy (about 40 fights before Big Tony) is closest to a typical player.

import { Battle, type Action } from '../src/game/battle';
import { addExp, canEvolve, evolve, healFully, learnMove, makeDrifter, maxHp, type Drifter } from '../src/game/creature';
import { item, type ItemId } from '../src/data/items';
import { MAPS, encountersFor, rival2Team, type Encounters, type TrainerDef } from '../src/data/maps';
import { move, type MoveId } from '../src/data/moves';
import { species, STARTERS, type SpeciesId } from '../src/data/species';
import { effectiveness, type TypeId } from '../src/data/types';

const RUNS = Number(process.argv[2]) || 300;
let logBudget = Number(process.env.LOG_SKIP ?? 0) + 1;
const RIVAL_PICK: Record<string, SpeciesId> = { WILLIE: 'PETE', AMOS: 'WILLIE', PETE: 'AMOS' };
const EVOLVED: Record<string, SpeciesId> = { WILLIE: 'BILL', AMOS: 'PROPHET', PETE: 'SPUN' };

function trainer(map: string, id: string): TrainerDef {
  const t = MAPS[map].npcs.find((n) => n.id === id)?.trainer;
  if (!t) throw new Error(`no trainer ${map}/${id}`);
  return t;
}

type Step =
  | { kind: 'wild'; enc: Encounters; mult: number }
  | { kind: 'fight'; label: string; team: [SpeciesId, number][]; reward: number }
  | { kind: 'heal' }
  | { kind: 'catch'; enc: Encounters }
  | { kind: 'shop' }
  | { kind: 'mark'; label: string };

function story(starter: SpeciesId): Step[] {
  const rp = RIVAL_PICK[starter];
  const T = (map: string, id: string, label = id): Step => {
    const t = trainer(map, id);
    return { kind: 'fight', label, team: t.team, reward: t.reward };
  };
  const route = MAPS.route1.enc!;
  const camp = MAPS.town.enc!;
  const lot = MAPS.town.enc2!.enc;
  const under = MAPS.bottoms.enc!;
  const lot2 = MAPS.bottoms.enc2!.enc;
  return [
    { kind: 'fight', label: 'rival 1', team: [[rp, 5]], reward: 50 },
    { kind: 'heal' },
    { kind: 'wild', enc: route, mult: 1 },
    { kind: 'catch', enc: route },
    T('route1', 'tr_cletus2', 'Jimbo'),
    T('route1', 'tr_marge', 'Marge'),
    T('route1', 'tr_rusty', 'Rusty'),
    { kind: 'heal' },
    { kind: 'shop' },
    T('lab', 'tr_cook', 'Larry (lab)'),
    { kind: 'heal' },
    { kind: 'wild', enc: camp, mult: 1 },
    { kind: 'catch', enc: camp },
    T('town', 'tr_dre', 'Dre'),
    { kind: 'heal' },
    { kind: 'wild', enc: lot, mult: 0.5 },
    T('town', 'tr_corner', 'Tray'),
    T('town', 'tr_kyle', 'Kyle'),
    { kind: 'heal' },
    T('grow', 'tr_grower', 'Skunk'),
    { kind: 'heal' },
    { kind: 'shop' },
    T('trap', 'tr_mikey', 'Mikey'),
    T('trap', 'tr_jay', 'Jay'),
    { kind: 'heal' },
    T('trap', 'tony', 'BIG TONY'),
    { kind: 'mark', label: 'after Tony' },
    { kind: 'heal' },
    { kind: 'shop' },
    { kind: 'wild', enc: under, mult: 0.5 },
    { kind: 'fight', label: 'rival 2', team: rival2Team(EVOLVED[rp]), reward: 600 },
    { kind: 'catch', enc: under },
    { kind: 'wild', enc: under, mult: 0.5 },
    T('bottoms', 'tr_ricky', 'Ricky'),
    T('bottoms', 'tr_gus', 'Gus'),
    T('bottoms', 'tr_doobie', 'Doobie'),
    { kind: 'heal' },
    { kind: 'wild', enc: lot2, mult: 1 },
    { kind: 'heal' },
    { kind: 'shop' },
    T('slum', 'tr_darnell', 'Darnell'),
    T('slum', 'tr_pearl', 'Ms. Pearl'),
    T('slum', 'tr_hector', 'Hector'),
    { kind: 'heal' },
    T('slum', 'sal', 'SAL'),
    { kind: 'mark', label: 'after Sal' },
  ];
}

function pickEnc(enc: Encounters): [SpeciesId, number] {
  const table = encountersFor(enc, Math.random() < 0.3);
  const total = table.reduce((a, r) => a + r[3], 0);
  let roll = Math.random() * total;
  for (const r of table) if ((roll -= r[3]) <= 0) return [r[0], r[1] + Math.floor(Math.random() * (r[2] - r[1] + 1))];
  const r = table[0];
  return [r[0], r[1]];
}

function bestMove(b: Battle): number {
  const me = b.me;
  const myT = species(me.sp).types as TypeId[];
  const foeT = species(b.foe.sp).types as TypeId[];
  let best = -1;
  let score = -1;
  me.moves.forEach((m, i) => {
    const d = move(m.id);
    if (m.pp <= 0 || !d.power) return;
    const s = d.power * (myT.includes(d.type) ? 1.5 : 1) * effectiveness(d.type, foeT) * ((d.acc || 100) / 100);
    if (s > score) {
      score = s;
      best = i;
    }
  });
  if (best < 0) best = me.moves.findIndex((m) => m.pp > 0);
  return best;
}

/** Learn new moves, replacing the weakest attack when all four slots are full. */
function learn(d: Drifter, id: MoveId) {
  if (learnMove(d, id)) return;
  const pw = (x: MoveId) => move(x).power || 20;
  let k = 0;
  d.moves.forEach((m, i) => {
    if (pw(m.id) < pw(d.moves[k].id)) k = i;
  });
  if (pw(id) > pw(d.moves[k].id)) d.moves[k] = { id, pp: move(id).pp };
}

const HEALS: ItemId[] = ['CASSEROLE', 'PILLS', 'ENERGY', 'LOKO', 'FORTY', 'JOINT', 'BURRITO'];

let LOG = false;
function fight(party: Drifter[], enemy: Drifter[], wild: boolean, bag: Partial<Record<ItemId, number>>, swapTo = -1): 'win' | 'lose' {
  if (LOG) console.log('  party:', party.map((d) => `${d.sp} ${d.level} [${d.moves.map((m) => m.id).join(',')}]`).join(' | '));
  const b = new Battle({ player: party, enemy, wild, trainerName: 'X', bag });
  const leveled = new Set<number>();
  for (let turns = 0; !b.over && turns < 400; turns++) {
    if (b.needSwitch) {
      b.forceSwitch(party.findIndex((d) => d.hp > 0));
      continue;
    }
    const me = b.me;
    let action: Action = { kind: 'move', slot: bestMove(b) };
    // Switch training: the weak one starts, then tags out so both share the exp.
    if (turns === 0 && swapTo > 0 && party[swapTo].hp > 0) action = { kind: 'switch', index: swapTo };
    if (!wild && me.hp < maxHp(me) * 0.4) {
      const h = HEALS.find((id) => (bag[id] ?? 0) > 0);
      if (h) action = { kind: 'item', item: h, target: b.active.player };
    }
    for (const e of b.runTurn(action)) {
      if (LOG && e.t === 'msg') console.log('    ' + e.text);
      if (LOG && e.t === 'hp') console.log(`      [${e.side} ${e.hp}/${e.max}]`);
      if (e.t !== 'exp') continue;
      const d = party[e.index];
      for (const up of addExp(d, e.amount)) {
        leveled.add(e.index);
        up.newMoves.forEach((m) => learn(d, m));
      }
    }
  }
  for (const i of leveled) {
    const into = canEvolve(party[i]);
    if (into) evolve(party[i], into);
  }
  return b.over === 'win' ? 'win' : 'lose';
}

interface Result {
  firstTry: Record<string, number>;
  tries: Record<string, number>;
  marks: Record<string, { lead: number; avg: number; money: number; size: number }>;
}

function run(starter: SpeciesId, wildPerArea: number): Result {
  const party = [makeDrifter(starter, 5)];
  const bag: Partial<Record<ItemId, number>> = { BURRITO: 4, SALTS: 2, SACK: 5 };
  let money = 300;
  const res: Result = { firstTry: {}, tries: {}, marks: {} };
  const healAll = () => party.forEach(healFully);
  const wild = (enc: Encounters, n: number) => {
    for (let k = 0; k < n; k++) {
      // Half the time the starter fights alone; the other half the weakest member
      // starts and tags out to the starter, so it shares the exp.
      let lead = 0;
      if (Math.random() < 0.5) party.forEach((d, i) => d.level < party[lead].level && (lead = i));
      const order = [party[lead], ...party.filter((_, i) => i !== lead)];
      const [sp, lv] = pickEnc(enc);
      fight(order, [makeDrifter(sp, lv)], true, bag, lead > 0 ? order.indexOf(party[0]) : -1);
      if (k % 4 === 3 || party.some((d) => d.hp <= 0)) healAll();
    }
  };
  for (const st of story(starter)) {
    if (st.kind === 'heal') healAll();
    else if (st.kind === 'wild') wild(st.enc, Math.round(wildPerArea * st.mult));
    else if (st.kind === 'catch') {
      if (party.length < 6) {
        const [sp, lv] = pickEnc(st.enc);
        party.push(makeDrifter(sp, lv));
        bag.SACK = Math.max(0, (bag.SACK ?? 0) - 2);
      }
    } else if (st.kind === 'shop') {
      // Stock up on burritos and sacks with about a third of your cash.
      const spend = Math.floor(money / 3);
      const n = Math.floor(spend / 250);
      bag.BURRITO = (bag.BURRITO ?? 0) + n;
      bag.SACK = (bag.SACK ?? 0) + n;
      money -= n * 250;
    } else if (st.kind === 'mark') {
      const lv = party.map((d) => d.level);
      res.marks[st.label] = { lead: party[0].level, avg: lv.reduce((a, b) => a + b, 0) / lv.length, money, size: party.length };
    } else if (st.kind === 'fight') {
      let tries = 0;
      for (;;) {
        tries++;
        LOG = !!process.env.LOG_FIGHT && st.label === process.env.LOG_FIGHT && tries === 1 && --logBudget === 0;
        const r = fight(party, st.team.map(([sp, lv]) => makeDrifter(sp, lv)), false, bag);
        LOG = false;
        if (r === 'win') {
          money += st.reward;
          break;
        }
        // Blacked out: lose half your money, heal, grind a few more fights, try again.
        money -= Math.floor(money / 2);
        healAll();
        wild(MAPS.route1.enc!, 0);
        const area = st.team[0][1] >= 10 ? MAPS.bottoms.enc! : st.team[0][1] >= 6 ? MAPS.town.enc! : MAPS.route1.enc!;
        wild(area, 4);
        healAll();
        if (tries > 20) break;
      }
      res.firstTry[st.label] = tries === 1 ? 1 : 0;
      res.tries[st.label] = tries;
    }
  }
  return res;
}

const pct = (x: number) => `${Math.round(x * 100)}%`.padStart(4);
for (const [name, n] of [['light', 3], ['normal', 8], ['heavy', 16]] as const) {
  console.log(`\n=== ${name}: ${n} wild fights per area, ${RUNS} runs per starter ===`);
  const rows: Record<string, number[]> = {};
  const bySp: Record<string, Record<string, number[]>> = {};
  const tries: Record<string, number[]> = {};
  const marks: Record<string, { lead: number[]; avg: number[]; money: number[] }> = {};
  for (const sp of STARTERS) {
    for (let i = 0; i < RUNS; i++) {
      const r = run(sp, n);
      for (const [k, v] of Object.entries(r.firstTry)) {
        (rows[k] ??= []).push(v);
        ((bySp[k] ??= {})[sp] ??= []).push(v);
      }
      for (const [k, v] of Object.entries(r.tries)) (tries[k] ??= []).push(v);
      for (const [k, v] of Object.entries(r.marks)) {
        const m = (marks[k] ??= { lead: [], avg: [], money: [] });
        m.lead.push(v.lead);
        m.avg.push(v.avg);
        m.money.push(v.money);
      }
    }
  }
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  console.log('fight'.padEnd(14), 'won 1st try', ' avg tries', '  ' + STARTERS.map((x) => x.padStart(7)).join(''));
  for (const k of Object.keys(rows))
    console.log(k.padEnd(14), pct(avg(rows[k])).padStart(11), avg(tries[k]).toFixed(2).padStart(10), '  ' + STARTERS.map((x) => pct(avg(bySp[k][x])).padStart(7)).join(''));
  for (const [k, m] of Object.entries(marks))
    console.log(`${k}: lead Lv ${avg(m.lead).toFixed(1)}, crew avg Lv ${avg(m.avg).toFixed(1)}, money $${Math.round(avg(m.money))}`);
}

// Catch odds with a plain sack at a third of HP, for the early commons.
console.log('\n=== catch odds, BURLAP SACK ===');
for (const sp of ['JOE', 'GARY', 'MO', 'PAT', 'KENNY', 'STAN', 'TERRY', 'MARV', 'LENNY', 'LARRY', 'SID', 'JUGGALO'] as SpeciesId[]) {
  const odds = (frac: number, bonus = 1) => {
    let ok = 0;
    for (let i = 0; i < 3000; i++) {
      const foe = makeDrifter(sp, 6);
      foe.hp = Math.max(1, Math.floor(maxHp(foe) * frac));
      if (new Battle({ player: [makeDrifter('WILLIE', 6)], enemy: [foe], wild: true }).catchRoll(bonus).caught) ok++;
    }
    return ok / 3000;
  };
  console.log(`${sp.padEnd(8)} cr ${String(species(sp).catchRate).padStart(3)}  full ${pct(odds(1))}  1/3 HP ${pct(odds(0.33))}  1/3 + TAPE ${pct(odds(0.33, item('TAPE').catchBonus))}`);
}
