# Trailer Park Tamers

A GBA-style monster-catcher parody. Instead of wild creatures, you wear down drifters, winos, street preachers and can collectors in the weeds, throw a burlap sack over them, and train them into a crew that fights other people's crews. Cartoon satire, no gore.

It's online at **https://tpt.parbs.online**: you see other players walking around the same map, chat, challenge them to fights and trade crew members. Saves live on the server, and a 16-letter code moves your account to another device. Without a server it still runs as a single-player game that saves in the browser.

Everything is drawn and composed in code: tiles, sprites, battle portraits, the font atlas, sound effects and music. There are no image or audio files.

## Run it

```sh
npm install
npm run server     # game server on :8790 (accounts in data/tpt.db)
npm run dev        # http://localhost:5173, forwards /ws to the server; also reachable from your phone
npm test           # rules, data, map and PvP checks
npm run build      # static site in dist/
```

Hosting on the Debian VM is in [docs/hosting.md](docs/hosting.md).

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | Arrows / WASD | D-pad |
| A (talk, confirm) | Z, Space, J | A |
| B (back, hold to run) | X, Esc, K | B |
| Start (menu) | Enter, P | START |
| Chat | T or / | CHAT |

The on-screen pad only appears on touch screens. In portrait it sits under the game like a handheld; in landscape it floats over the sides.

## What's in it

- Pine Acres Trailer Park, Rail Yard Road and the town of Grimsby, with seven interiors
- 46 drifters across 10 types (Street, Booze, Chem, Psycho, Tough, Slick, Holy, Feral, Scrap, Strapped), with two- and three-stage evolutions
- Homeless encampments and dumpster lots, a dealer, a grow house where you grow joints, a meth lab trailer, and a skateboard
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
  ui/        text boxes, menus, full-screen screens (crew, bag, shop, dex, trade), chat overlay
  net/       protocol shared with the server, WebSocket client, cloud saves
  audio/     Web Audio synth for effects and music
server/      Node server: static files, WebSocket world, PvP rooms, trades, SQLite accounts
tests/       vitest: battle rules, PvP, catch odds, map validation
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
node scripts/mp.mjs          # two players: presence, chat, a fight, a trade (needs `npm run server` too)
```

Screenshots land in `shots/` (ignored by git). The scripts use the Chrome install at `C:/Program Files/Google/Chrome/Application/chrome.exe`; set `CHROME` to point elsewhere.
