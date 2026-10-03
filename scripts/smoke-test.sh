#!/usr/bin/env sh
set -eu
BASE_URL="${1:-http://localhost:8081}"
echo "Checking $BASE_URL/actuator/health"
curl -fsS "$BASE_URL/actuator/health" | grep -q '"status":"UP"'
echo "Health check passed."
echo "Checking public delivery page"
curl -fsS "$BASE_URL/" | grep -q 'Letter delivery'
echo "Public page passed."
