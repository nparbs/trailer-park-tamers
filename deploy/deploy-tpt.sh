#!/bin/sh
# Runs on the VM. Pulls main and rebuilds. Install as ~/deploy-tpt.sh and lock an SSH key to it:
#   command="/home/deb/deploy-tpt.sh",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty ssh-ed25519 AAAA... tpt-deploy
set -eu
cd "$HOME/trailer-park-tamers"
git fetch --quiet origin main
git merge --ff-only --quiet origin/main
sg docker -c "docker compose up -d --build" 2>&1 | tail -5
sleep 3
sg docker -c "docker compose ps --format '{{.Name}} {{.Status}}'"
echo "Deployed $(git rev-parse --short HEAD)"
