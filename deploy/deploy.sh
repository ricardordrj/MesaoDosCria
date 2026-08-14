#!/usr/bin/env bash
set -euo pipefail

cd "$HOME/MesaoDosCria"

git pull origin main
npm ci
npm run build:all
npm run db:migrate -w server
systemctl --user restart mesaodoscria
