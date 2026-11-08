# Hosting at tpt.parbs.online

One Docker container serves both the game page and the WebSocket the page talks to, so there's nothing to deploy to GitHub Pages. It runs on the Debian VM next to Scrap Riot and reaches the internet through Scrap Riot's existing Cloudflare Tunnel.

```
player ──https──> Cloudflare ──tunnel──> cloudflared (Scrap Riot's) ──> tpt:8790 (this container)
                                                                         ├─ /        the game page
                                                                         ├─ /ws      shared world
                                                                         └─ /health  status
```

## What it stores

Accounts and saves live in SQLite at `/data/tpt.db`, in the `tpt_data` Docker volume. An account is a random 16-letter code kept in the browser. Players can see their code on the ID card in the start menu, and enter it under USE CODE on the title screen to play on another device. The server keeps only a hash of the code, the player's name, their outfit and their save. There are no passwords or emails.

## First-time setup on the VM

1. **Clone the repo.** It's public, so plain HTTPS works:

   ```sh
   git clone https://github.com/nparbs/trailer-park-tamers.git ~/trailer-park-tamers
   cd ~/trailer-park-tamers
   cp .env.example .env
   ```

2. **Check the tunnel network name.** The container joins the network Scrap Riot's `cloudflared` is on. It's normally `scrap-riot_default`:

   ```sh
   sg docker -c "docker network ls" | grep scrap
   ```

   If it's different, set `TUNNEL_NETWORK` in `.env`.

3. **Start it.**

   ```sh
   sg docker -c "docker compose up -d --build"
   sg docker -c "docker compose ps"
   sg docker -c "docker compose exec tpt node -e \"fetch('http://127.0.0.1:8790/health').then(r=>r.text()).then(console.log)\""
   ```

4. **Add the hostname in Cloudflare.** In the Cloudflare dashboard, open Zero Trust, then Networks, then Tunnels, and edit the tunnel Scrap Riot uses. Under Public Hostnames, add:

   | Field | Value |
   | --- | --- |
   | Subdomain | `tpt` |
   | Domain | `parbs.online` |
   | Service | `HTTP`, `tpt:8790` |

   Cloudflare creates the DNS record itself. WebSockets work through tunnels by default.

5. **Check from anywhere:** `curl https://tpt.parbs.online/health` should return `{"ok":true,"online":0}`.

## Deploying updates

Same pattern as Scrap Riot: a key on the PC that can only run the deploy script.

```sh
cp deploy/deploy-tpt.sh ~/deploy-tpt.sh && chmod +x ~/deploy-tpt.sh
# In ~/.ssh/authorized_keys, one line for the PC's tpt-deploy key:
# command="/home/deb/deploy-tpt.sh",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty ssh-ed25519 AAAA... tpt-deploy
```

Then from the PC: `ssh -i ~/.ssh/tpt-deploy deb@<vm address>`. It fast-forwards to `main` and rebuilds. A rebuild drops everyone's connection for a few seconds; saves are kept, and fights or trades in progress are called off.

When `PROTOCOL_VERSION` in `src/net/protocol.ts` changes, open pages are told to refresh.

## Backups

```sh
0 4 * * * cd ~/trailer-park-tamers && sg docker -c "docker compose exec -T tpt node -e \"const {DatabaseSync}=require('node:sqlite');new DatabaseSync('/data/tpt.db').exec(\\\"VACUUM INTO '/data/backup.db'\\\")\"" && sg docker -c "docker compose cp tpt:/data/backup.db ~/tpt-backups/tpt-$(date +\%F).db"
```

## Limits and notes

- 8 connections per IP address, and a message rate limit per connection.
- Chat is per map, 90 characters, one message a second. There's no filter or report button yet.
- Saves are trusted from the browser, so a determined player could edit theirs. Crews sent into fights and trades are checked (real species and moves, levels 1 to 100), but progress isn't. See the roadmap.
- The container is on Scrap Riot's Docker network, so it could reach Scrap Riot's database port. That database has a password, but a dedicated tunnel network would be tidier later.

## Running it locally

```sh
npm run server   # builds and runs the server on :8790, saves in data/tpt.db
npm run dev      # the page on :5173, which forwards /ws to the server
```

`node scripts/mp.mjs` plays two browsers against each other (presence, chat, a fight, a trade), and `node scripts/prod-smoke.mjs` checks a production build on :8799.
