#!/usr/bin/env bash
set -euo pipefail

mkdir -p backups

STAMP=$(date +"%Y%m%d-%H%M%S")
OUT="backups/artemis-${STAMP}.sql"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

pg_dump "$DATABASE_URL" > "$OUT"
ln -sf "$(basename "$OUT")" backups/artemis-latest.sql

echo "Backup written to $OUT"
