# Trailer Park Tamers

A GBA-style monster-catcher parody. Instead of wild creatures, you wear down drifters, winos, street preachers and can collectors in the weeds, throw a burlap sack over them, and train them into a crew that fights other people's crews. Cartoon satire, no gore.

Everything is drawn and composed in code: tiles, sprites, battle portraits, the font atlas, sound effects and music. There are no image or audio files.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173, also reachable from your phone on the same network
npm test           # rules, data and map checks
npm run build      # static site in dist/
```

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Arrows / WASD | D-pad |
| A (talk, confirm) | Z, Space, J | A |
| B (back, hold to run) | X, Esc, K | B |
| Start (menu) | Enter, P | START |

The on-screen pad only appears on touch screens. In portrait it sits under the game like a handheld; in landscape it floats over the sides.

## What's in v0.1

- Pine Acres Trailer Park, Rail Yard Road and the town of Grimsby, with seven interiors
- 24 drifters across 9 types (Street, Booze, Chem, Psycho, Tough, Slick, Holy, Feral, Scrap), with evolutions
- About 50 moves, status effects (Passed Out, Sick, Wasted), stat stages, crits, STAB and type matchups
- Catching with three tiers of catch item, a party of six, and a storage unit
- Trainers who spot you and walk over, a rival fight, and Big Tony's trap house as the first boss
- Soup kitchen healing, the Gas-N-Go shop, StreetDex, crew info, bag, save/load in the browser
- Synthesized chiptune music and sound effects

See [ROADMAP.md](ROADMAP.md) for what comes next.

## Layout

```
src/
  data/      species, moves, types, items, maps (ASCII tile maps + NPCs + trainers)
  game/      battle rules (no rendering), creatures, save state, input
  gfx/       pixel buffer, tiles, overworld sprites, battle portraits, font, textures
  scenes/    Title, Overworld, Battle, story scripts
  ui/        text boxes, menus, full-screen screens (crew, bag, shop, dex)
  audio/     Web Audio synth for effects and music
tests/       vitest: battle rules, catch odds, map validation
scripts/     headless-Chrome screenshot and playthrough scripts (need `npm run dev`)
```

Maps are plain strings in [src/data/maps.ts](src/data/maps.ts). Each character is a tile from [src/gfx/tiles.ts](src/gfx/tiles.ts). The map test checks that rows line up, warps land on walkable tiles, and NPCs and signs are placed sensibly, so run `npm test` after editing a map.

## Testing scripts

With the dev server running:

```sh
node scripts/play.mjs        # new game through the rival fight, route, a wild fight and a trainer
node scripts/endgame.mjs     # boss, healing, shop, blackout
node scripts/screenshots.mjs # title, every map, battle, menus, sprite sheets
node scripts/mobile.mjs      # touch layout at phone sizes
```

Screenshots land in `shots/` (ignored by git). The scripts use the Chrome install at `C:/Program Files/Google/Chrome/Application/chrome.exe`; set `CHROME` to point elsewhere.
