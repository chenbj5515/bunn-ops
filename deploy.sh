#!/usr/bin/env sh
set -eu

ACTION="${1:-deploy}"

if [ "$ACTION" = "deploy" ]; then
  docker compose -f docker-compose.prod.yml pull || true
  docker compose -f docker-compose.prod.yml up -d --build
  docker compose -f docker-compose.prod.yml ps
  exit 0
fi

if [ "$ACTION" = "down" ]; then
  docker compose -f docker-compose.prod.yml down
  exit 0
fi

echo "Usage: ./deploy.sh [deploy|down]"
exit 1
