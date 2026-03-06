#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${KUMERA_MESSAGING_BASE_URL:-${LEADOS_BASE_URL:-}}"
CRON_SECRET_VALUE="${KUMERA_MESSAGING_CRON_SECRET:-${LEADOS_CRON_SECRET:-}}"

: "${BASE_URL:?KUMERA_MESSAGING_BASE_URL or LEADOS_BASE_URL is required}"
: "${CRON_SECRET_VALUE:?KUMERA_MESSAGING_CRON_SECRET or LEADOS_CRON_SECRET is required}"

curl --fail --show-error --silent \
  -X POST "${BASE_URL}/api/reminders/process" \
  -H "Authorization: Bearer ${CRON_SECRET_VALUE}" \
  -H "x-internal-cron-secret: ${CRON_SECRET_VALUE}" \
  -H "Content-Type: application/json"
