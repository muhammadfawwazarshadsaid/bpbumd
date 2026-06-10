#!/usr/bin/env bash

set -e

CONTAINER_NAME="bpbumd-postgres-local"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
MIGRATIONS_DIR="$PROJECT_ROOT/src/migrations"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${DB_USER:?DB_USER is required in .env}"
: "${DB_NAME:?DB_NAME is required in .env}"

echo "Starting database migration..."
echo "Project root   : $PROJECT_ROOT"
echo "Container      : $CONTAINER_NAME"
echo "Database       : $DB_NAME"
echo "User           : $DB_USER"
echo "Migrations dir : $MIGRATIONS_DIR"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Error: container ${CONTAINER_NAME} is not running."
  echo "Run this first:"
  echo "docker compose -f docker-compose-local-pg.yml up -d"
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Error: migrations folder not found: $MIGRATIONS_DIR"
  exit 1
fi

found=false

for file in "$MIGRATIONS_DIR"/*.sql; do
  if [ ! -f "$file" ]; then
    continue
  fi

  found=true

  echo "Running migration: $(basename "$file")"

  docker exec -i "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$file"

  echo "Completed: $(basename "$file")"
done

if [ "$found" = false ]; then
  echo "No migration files found."
  exit 0
fi

echo "All migrations completed."