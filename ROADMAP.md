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

## v0.2: The Bottoms

The taped-off road east of Grimsby opens up.

- [ ] The Bottoms: a rougher neighbourhood of row houses, corner stores and an underpass camp
- [ ] Second boss and badge (a slumlord who runs the row houses)
- [ ] 12 new drifters, including two new evolution lines
- [ ] Rival fight #2 when you reach the underpass
- [ ] Nicknames when you bag someone, and a name rater (the tattoo parlour)
- [ ] Held items (a lucky scratcher, a flask, a shiv made of a toothbrush)
- [ ] A second save slot and an "are you sure" before overwriting
- [ ] Move animations by type instead of one lunge for everything

## v0.3: Polish pass

- [ ] Ledges you can hop down, and cut-through fences that need a "bolt cutters" field move
- [ ] Overworld items hidden in trash piles (press A on them)
- [ ] Text speed and battle animation settings
- [ ] Party order in battle shown like the handhelds (lead slot on the left)
- [ ] Show the trainer's remaining crew as icons before each fight
- [ ] Better weeds: rustle animation and a sound when you walk through
- [ ] Day and night tint, with some drifters only out at night
- [ ] Balance pass on early-game levels, prize money and catch rates
- [ ] Playtest on a phone: button sizes, landscape overlap, audio unlock

## v0.4: The rest of the map

- [ ] Rail yard and freight trains (riding boxcars as fast travel)
- [ ] The landfill (big encounter area, a Scrap-type boss)
- [ ] Motel strip and truck stop
- [ ] Downtown and the projects
- [ ] Bosses 3 to 8, each with a type theme and a short story beat
- [ ] Field moves that open paths: shove a dumpster, climb a fence, talk past a bouncer
- [ ] About 80 drifters total

## v0.5: Endgame

- [ ] City Hall: four council members and the mayor as the final gauntlet
- [ ] Credits, then post-game rematches and a rare-drifter hunt
- [ ] Full StreetDex with area info ("Found in: weeds behind the Gas-N-Go")
- [ ] Legendary-tier drifters (the guy who's been living in the airport since 1994)

## Later

- [ ] Link battles and trading between two phones over WebRTC
- [ ] Install as an app (PWA), then wrap for Android
- [ ] Hosting: Cloudflare Pages or a path on parbs.online
- [ ] Controller support through the Gamepad API
- [ ] Translations

## Ideas parking lot

Not committed, just worth remembering.

- Dumpster diving as the "fishing" mechanic, with rods replaced by grabber tools
- A daily soup kitchen menu that gives a small buff
- Weather: rain makes Booze types stronger and Holy types preachier
- Drifters with two forms depending on whether they've been fed today
