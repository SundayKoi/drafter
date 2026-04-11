#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="$PROJECT_DIR/infra/docker-compose.yml"

echo "=== Ember Draft Tool Deploy ==="
echo "Project: $PROJECT_DIR"
echo ""

echo "Pulling latest..."
cd "$PROJECT_DIR"
git pull origin main

echo ""
echo "Building images..."
docker compose -f "$COMPOSE_FILE" build

echo ""
echo "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "Waiting for health check..."
sleep 5
if curl -sf https://drafter.emberesports.com/api/health; then
    echo ""
    echo "Deploy OK"
else
    echo ""
    echo "HEALTH CHECK FAILED — check logs:"
    echo "  docker compose -f $COMPOSE_FILE logs --tail=50"
    exit 1
fi
