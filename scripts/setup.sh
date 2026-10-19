#!/usr/bin/env bash
set -euo pipefail
for command in bun node docker; do
  command -v "$command" >/dev/null || { echo "Missing $command; activate Flox and start Docker." >&2; exit 1; }
done
docker compose version >/dev/null
for target in .env.local client/.env.local; do
  if [ ! -f "$target" ]; then cp client/.env.local.example "$target"; fi
done
bun install --frozen-lockfile
docker compose -f client/docker-compose.yml up -d
for attempt in {1..30}; do
  if curl --fail --silent http://localhost:4566/_localstack/health >/dev/null; then
    bash scripts/provision-localstack.sh
    echo 'Ready. Run bun run dev and bun run worker in separate terminals.'
    exit 0
  fi
  sleep 2
done
echo 'LocalStack did not become ready. Check docker compose logs.' >&2
exit 1
