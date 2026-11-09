# Trailer Park Tamers

GBA-style monster-catcher parody with a shared online world. See README.md for layout and ROADMAP.md for plans.

## Working here

- `npm test` after any change to rules or maps (the map test catches misplaced tiles, warps and NPCs, ledges that strand you, and encounter tables with nothing to find by day or by night).
- `npm run balance` after changing trainer teams, learnsets or encounter levels. It plays the story fights with the real rules; Big Tony and rival fight #2 sat near 50% and 35% first-try wins on the "heavy" row at v0.6.
- Tone: cartoon satire. No gore, nothing sexual, no jokes about kids, and no real people as characters.
- All art and audio are generated in code. New drifters are a `Look` in `src/data/species.ts`; new props go in `src/gfx/portrait.ts`.
- Headless checks with the dev server and `npm run server` running: `scripts/play.mjs`, `scripts/endgame.mjs`, `scripts/mp.mjs`, `scripts/screenshots.mjs`.

## Shipping

`npm run ship` (or `npm run ship -- patch|minor`) checks, pushes, deploys to the VM and waits until https://tpt.parbs.online/health reports the new version. Details in `.claude/skills/ship/SKILL.md`.
