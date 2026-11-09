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

## v0.3: Vice update ✅

- [x] 22 new drifters, 46 total, including three-stage lines (Malt Liquor Mo, Kush Kyle) and two-stage ones (Crackhead Kenny, Lookmaxer Lyle, Lab Coat Larry, Glock Glen, Dime Bag Dez)
- [x] New STRAPPED type for gun guys, and about 20 new moves
- [x] Homeless encampments and dumpster trash heaps replace grass as encounter ground, with tents
- [x] Grimsby rebuilt with two-lane roads, crosswalks, Tent City, a dumpster lot and a grow house
- [x] Pawn & Skate shop: buy a skateboard and skate at double speed (bag or SELECT/Shift)
- [x] Dez the dealer sells 40s, Four Loko, joints, seeds and pills
- [x] Grow house: plant bag seed in a pot, harvest joints a few minutes later
- [x] "Not a Meth Lab" trailer in the park with a cook to fight
- [x] 13 new music tracks with drums; each area picks from several, trainers and PvP get their own themes
- [x] EXIT in the start menu saves and goes back to the title screen
- [x] Fixes: moves doing nothing against a trainer's second fighter, menu arrow overlapping FIGHT/CREW, text showing through menus, taps skipping battle text, crew list names running into HP bars

## v0.4: Tutors and quality of life ✅

- [x] HP bars: dropped the orange "HP" stub; bars turn orange under 40% and red under 15%
- [x] Drifters moan when they drop into the orange and groan when they hit the red (the pitch depends on the species)
- [x] Esc opens the start menu on PC (and still backs out of menus)
- [x] Click the "N ONLINE" counter to see everyone online and which map they're on
- [x] Music on/off button in the top left (or press M); sound effects stay on
- [x] Move tutors who teach vice moves for cash. HOLY drifters refuse drugs and booze
  - BUDS in the grow house: Bong Clear, Couch Lock, Hotbox (after beating Skunk)
  - SPEEDY in the "Not a Meth Lab" trailer: Smoke Meth, Tweak Out, Lab Explosion (after beating Larry)
  - RANDY on Cletus's couch: Shotgun a Beer, Keg Stand, Three-Day Bender
  - VINNIE the fence in Pawn & Skate: Five-Finger Discount, Snitch, Smash & Grab

## v0.2.x: Online follow-ups

- [ ] Server-side progress checks (money, levels and items can currently be edited in a save)
- [ ] Report and mute for chat, and a word filter toggle
- [ ] Friends list and whispers across maps
- [ ] Battle tower or ranked fights with a leaderboard
- [x] Show who's online and where (click the online counter)
- [ ] A spectator mode for fights
- [ ] Block walking onto another player's tile (right now you can stand on top of each other)

## v0.5: The Bottoms ✅

The taped-off road east of Grimsby opens up once you beat Big Tony.

- [x] The Bottoms: row houses, the Lucky Star deli, a tattoo parlour, a free clinic (heal and respawn), a vacant lot and a camp under the highway overpass, with its own music
- [x] Second boss and badge: SAL the slumlord, in Sal's Properties with three tenant trainers. Badge: SECURITY DEPOSIT
- [x] 12 new drifters, including two new evolution lines (Squatter Sid → Adverse Possession Sid, Moonshine Mel → Still King Mel) and 8 new moves
- [x] Rival fight #2 when you walk into the underpass; Bobby Ray hands over a LUCKY SCRATCHER when you win
- [x] Nicknames when you bag someone, and INKY at the tattoo parlour renames crew for free
- [x] Held items: Lucky Scratcher (double crit odds), Hip Flask (heals a quarter once under half HP), Toothbrush Shiv (+20% damage). Give from the BAG, take back from the crew menu
- [x] Two save slots (both saved to the server when online) and an "erase it?" check before a new game overwrites one
- [x] Move animations by type (bottle lob, chem bubbles, psycho rings, holy beam, claw marks, gunshot tracer and so on), plus glows for buffs and heals
- [ ] The bridge east of the Bottoms is a "ROAD CLOSED" sign for now

## v0.6: Polish pass ✅

- [x] Ledges you can hop down on Rail Yard Road; zip-tied weak spots in fences that BOLT CUTTERS go through (Uncle Dale hands them over after Big Tony). Four fenced-off nooks with items: the park, Rail Yard Road, Tent City and the Bottoms vacant lot
- [x] Trash piles, dumpsters and bins: press A to dig. Some hide an item for good, and any of them can turn up junk once a day
- [x] OPTIONS in the start menu and on the title screen: text speed, battle effects on/off, music, sound
- [x] Crew screen laid out like the handhelds: the lead in a big panel on the left, the rest on the right, CANCEL below. Storage scrolls now instead of running off the screen
- [x] Both crews shown as a row of sacks before a trainer fight, and the trainer's again before each new fighter
- [x] Bits of cardboard and cans kick up, with a crinkle, when anyone walks through a camp
- [x] Morning, evening and night tints from the player's clock, with lit lampposts, fire barrels and windows after dark. Night-only drifters: Tinfoil Terry and Lab Coat Larry on Rail Yard Road, Three-Card Marv in Tent City, Lookout Lenny in the dumpster lot, Juggalo Jeff under the overpass. Sign Guy Gary and Busker Bev go home at night. Add `?hour=22` to the address to try it
- [x] Balance pass with a new simulator (`npm run balance`): starters learn their type move at 6 so the first rival fight is fair, each starter gets a mid-power move around 14-15 (new HOLY move: Holy Water), and Big Tony, Kyle, Lab Larry and rival fight #2 are easier. Prize money and catch rates checked and left alone
- [x] Phone check (emulated, not on a real device): in landscape the pad has its own gutters so it never covers the text box, CHAT/START moved to the right side, and audio wakes back up after the phone locks or switches apps
- [ ] Try it on a real phone, especially iOS audio

## v0.7: The rest of the map

- [ ] Rail yard and freight trains (riding boxcars as fast travel)
- [ ] The landfill (big encounter area, a Scrap-type boss)
- [ ] Motel strip and truck stop
- [ ] Downtown and the projects
- [ ] Bosses 3 to 8, each with a type theme and a short story beat
- [ ] Field moves that open paths: shove a dumpster, climb a fence, talk past a bouncer
- [ ] About 80 drifters total

## v0.8: Endgame

- [ ] City Hall: four council members and the mayor as the final gauntlet
- [ ] Credits, then post-game rematches and a rare-drifter hunt
- [ ] Full StreetDex with area info ("Found in: weeds behind the Gas-N-Go")
- [ ] Legendary-tier drifters (the guy who's been living in the airport since 1994)

## Vice and crime systems

Ideas that build on the tutors. Pick from these when planning a milestone.

- [ ] More tutors as the map grows: a liquor store owner in The Bottoms (Pull from the Handle, Boxed Wine Bash), a tattoo artist (Face Tat: lowers the foe's accuracy), a bookie at the motel (Double or Nothing: a coin-flip hit), a trucker at the truck stop (No-Doz Haul), a street preacher who teaches HOLY moves and refuses to teach anyone carrying drugs
- [ ] Comedown: crew who used a vice move in a fight can wake up HUNGOVER (slower for the next fight) unless you feed them a burrito
- [ ] Heat meter: losing to cops, Snitch, shoplifting and cooking raise your heat; at high heat cops patrol the roads and challenge you. Pay it off at the bail bondsman or lie low in a dumpster
- [ ] Cops as trainers who confiscate a random vice item if you lose
- [ ] Shoplifting at the Gas-N-Go: a quick timing minigame, caught = heat and a fight with the clerk
- [ ] Can and copper recycling as a steady money grind (a scrapyard that buys SCRAP drops)
- [ ] Scratch-off tickets and a back-room card game at the motel
- [ ] Dive bar arena: three fights in a row, no healing between, prize pot resets daily
- [ ] Cook more than joints: the meth lab and a moonshine still produce items on a timer, but each batch can blow up (a short fight with a LAB FIRE drifter)
- [ ] Side hustles from Uncle Dale: deliver a "package", collect debts, find his lost dog (who is also a drifter)
- [ ] Pawn shop buys items back for half price

## Sound and feel

- [ ] Every species gets a short cry when sent out, built from the same voice synth as the moans
- [ ] A low-HP warning beep for your lead, like the handhelds (with a setting to turn it off)
- [ ] Separate music and sound volume sliders in the start menu
- [ ] Battle hit sounds by move type (glass break for BOOZE, gunshot for STRAPPED, sizzle for CHEM)

## Online ideas

- [ ] Crews (player gangs) with a tag, a shared chat channel and turf on each map; most PvP wins in a week holds the turf
- [ ] Click a name in the who's-online list to whisper, challenge or warp to the nearest payphone on their map
- [ ] Emotes with little animations: /flex, /puke, /pass out, /pray
- [ ] Wanted posters on the Grimsby notice board showing the top PvP players
- [ ] Player stalls: set out a blanket on the sidewalk and sell items to other players while you're online

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
