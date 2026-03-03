#!/usr/bin/env bash
set -euo pipefail

: "${LEADOS_BASE_URL:?LEADOS_BASE_URL is required}"
: "${LEADOS_CRON_SECRET:?LEADOS_CRON_SECRET is required}"

curl --fail --show-error --silent \
  -X POST "${LEADOS_BASE_URL}/api/reminders/process" \
  -H "Authorization: Bearer ${LEADOS_CRON_SECRET}" \
  -H "x-internal-cron-secret: ${LEADOS_CRON_SECRET}" \
  -H "Content-Type: application/json"
