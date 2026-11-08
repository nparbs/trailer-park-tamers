# Roadmap

The goal is a full-length handheld-style adventure: eight bosses, a final gauntlet, and about 120 drifters. Each milestone below should be playable start to finish before the next one starts.

Tone rule for all new content: cartoon satire. The joke is the premise and the characters, not real-world cruelty. No gore, nothing sexual, and no jokes about kids.

## v0.1: Vertical slice ✅

- [x] Phaser 3 + TypeScript + Vite, 240x160, pixel-perfect scaling
- [x] All art generated in code: tiles, overworld sprites, battle portraits, battle backgrounds
- [x] Crisp 8x8 bitmap font built from Press Start 2P at startup
- [x] Keyboard controls and an on-screen pad for phones (portrait and landscape)
- [x] Grid movement, running with B, doors and map edges, NPCs that wander
- [x] Text boxes with typewriter text, menus, yes/no prompts
- [x] Pine Acres Trailer Park, Rail Yard Road, Grimsby, and seven interiors
- [x] Uncle Dale, three starters, a rival fight with cousin Bobby Ray
- [x] Random encounters in weeds, with a second table for the vacant lot
- [x] Turn-based battles: speed order, priority, accuracy, crits, STAB, nine types
- [x] Status effects (Passed Out, Sick, Wasted) and stat stages
- [x] Catching with Burlap Sack, Duct Tape and Van Keys, using third-gen shake odds
- [x] Experience, levelling, learning and forgetting moves, evolution (cancel with B)
- [x] Trainers who spot you, walk over and challenge you
- [x] Big Tony's trap house and the first badge, CORNER CRED
- [x] Soup kitchen healing, Gas-N-Go shop, storage unit payphone
- [x] Crew list, crew info, bag, StreetDex, ID card
- [x] Blacking out sends you home with half your money
- [x] Save and continue in the browser
- [x] Chiptune music and sound effects from Web Audio
- [x] Tests for battle rules, catch odds and every map

## v0.2: Online ✅

- [x] One Node server serves the page and a WebSocket world, hosted at tpt.parbs.online
- [x] Accounts as 16-letter codes, cloud saves in SQLite, USE CODE to move to another device
- [x] Autosave after fights and map changes, local backup, offline single-player still works
- [x] See other players on the same map, with name tags and six outfits to pick from
- [x] Per-map chat with speech bubbles and a chat log (T, /, or the CHAT button)
- [x] Challenge another player: the server runs the fight with the same rules, healed copies, no exp
- [x] Trade one crew member each, both confirm, server swaps and stores both saves
- [x] Crews sent to the server are checked; rate limits per connection and per address
- [x] Docker image joined to Scrap Riot's Cloudflare Tunnel network, with a locked deploy key

## v0.2.x: Online follow-ups

- [ ] Server-side progress checks (money, levels and items can currently be edited in a save)
- [ ] Report and mute for chat, and a word filter toggle
- [ ] Friends list and whispers across maps
- [ ] Battle tower or ranked fights with a leaderboard
- [ ] Show who's online on each map from the start menu
- [ ] A spectator mode for fights
- [ ] Block walking onto another player's tile (right now you can stand on top of each other)

## v0.3: The Bottoms

The taped-off road east of Grimsby opens up.

- [ ] The Bottoms: a rougher neighbourhood of row houses, corner stores and an underpass camp
- [ ] Second boss and badge (a slumlord who runs the row houses)
- [ ] 12 new drifters, including two new evolution lines
- [ ] Rival fight #2 when you reach the underpass
- [ ] Nicknames when you bag someone, and a name rater (the tattoo parlour)
- [ ] Held items (a lucky scratcher, a flask, a shiv made of a toothbrush)
- [ ] A second save slot and an "are you sure" before overwriting
- [ ] Move animations by type instead of one lunge for everything

## v0.4: Polish pass

- [ ] Ledges you can hop down, and cut-through fences that need a "bolt cutters" field move
- [ ] Overworld items hidden in trash piles (press A on them)
- [ ] Text speed and battle animation settings
- [ ] Party order in battle shown like the handhelds (lead slot on the left)
- [ ] Show the trainer's remaining crew as icons before each fight
- [ ] Better weeds: rustle animation and a sound when you walk through
- [ ] Day and night tint, with some drifters only out at night
- [ ] Balance pass on early-game levels, prize money and catch rates
- [ ] Playtest on a phone: button sizes, landscape overlap, audio unlock

## v0.5: The rest of the map

- [ ] Rail yard and freight trains (riding boxcars as fast travel)
- [ ] The landfill (big encounter area, a Scrap-type boss)
- [ ] Motel strip and truck stop
- [ ] Downtown and the projects
- [ ] Bosses 3 to 8, each with a type theme and a short story beat
- [ ] Field moves that open paths: shove a dumpster, climb a fence, talk past a bouncer
- [ ] About 80 drifters total

## v0.6: Endgame

- [ ] City Hall: four council members and the mayor as the final gauntlet
- [ ] Credits, then post-game rematches and a rare-drifter hunt
- [ ] Full StreetDex with area info ("Found in: weeds behind the Gas-N-Go")
- [ ] Legendary-tier drifters (the guy who's been living in the airport since 1994)

## Later

- [ ] Install as an app (PWA), then wrap for Android
- [ ] Controller support through the Gamepad API
- [ ] Translations

## Ideas parking lot

Not committed, just worth remembering.

- Dumpster diving as the "fishing" mechanic, with rods replaced by grabber tools
- A daily soup kitchen menu that gives a small buff
- Weather: rain makes Booze types stronger and Holy types preachier
- Drifters with two forms depending on whether they've been fed today
