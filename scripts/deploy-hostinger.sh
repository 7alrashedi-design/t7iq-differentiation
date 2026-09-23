#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/t7iq-differentiation}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.hostinger.yml}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "[1/6] Fetching latest code..."
git fetch origin "$BRANCH"

echo "[2/6] Updating working tree..."
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

if [ ! -f .env ]; then
  echo "ERROR: $APP_DIR/.env is missing."
  echo "Copy .env.example to .env and set the Supabase publishable values."
  exit 1
fi

echo "[3/6] Building image..."
docker compose --env-file .env -f "$COMPOSE_FILE" build --pull

echo "[4/6] Starting service..."
docker compose --env-file .env -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[5/6] Waiting for health check..."
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3100/api/health >/dev/null 2>&1; then
    echo "Application is healthy."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: health check failed."
    docker compose --env-file .env -f "$COMPOSE_FILE" ps
    docker compose --env-file .env -f "$COMPOSE_FILE" logs --tail=120 differentiation
    exit 1
  fi
  sleep 2
done

echo "[6/6] Current revision:"
git rev-parse --short HEAD
echo "Deployment complete."
