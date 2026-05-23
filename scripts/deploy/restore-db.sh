#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: npm run db:restore -- ./backups/artemis-latest.sql"
  exit 1
fi

psql "$DATABASE_URL" < "$BACKUP_FILE"

echo "Restored database from $BACKUP_FILE"
