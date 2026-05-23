#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${APP_URL:-http://localhost:3000}"

echo "Checking $BASE_URL/api/health"
curl -fsS "$BASE_URL/api/health" >/dev/null

echo "Checking $BASE_URL/api/ready"
curl -fsS "$BASE_URL/api/ready" >/dev/null

echo "Smoke test passed."
