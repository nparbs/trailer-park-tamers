---
name: ship
description: Ship Trailer Park Tamers to the live site (tpt.parbs.online). Use when the user says ship, deploy, push it live, release, or put it on the server.
---

# Ship to tpt.parbs.online

1. Make sure the work is committed on `main` (commit it if the user asked for the change; follow the repo's commit style and attribution).
2. Run `npm run ship`. Add `-- patch` (or `minor` / `major`) to bump the version first: use `patch` for fixes and small tweaks, `minor` for new content or features. The title screen and `/health` both show this version.
3. The script stops at the first problem (dirty tree, failing typecheck/tests/build, push, deploy, or the live site not reporting the new version within 2 minutes). Fix the cause and run it again rather than working around it.
4. Report the version and commit that went live, and anything that wasn't verified.

Notes:
- The deploy rebuilds the container on the VM, which drops everyone connected for a few seconds. Saves are kept; fights and trades in progress are called off.
- `.deploy.local.json` (git-ignored) holds the VM address and key. It only works from the home network.
- If `PROTOCOL_VERSION` in `src/net/protocol.ts` changed, say so: open pages will be told to refresh.
