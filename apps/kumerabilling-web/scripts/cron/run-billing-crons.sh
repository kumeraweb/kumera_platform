#!/usr/bin/env bash
set -euo pipefail

: "${BILLING_BASE_URL:?BILLING_BASE_URL is required}"
: "${BILLING_CRON_SECRET:?BILLING_CRON_SECRET is required}"

call_job() {
  local endpoint="$1"
  curl --fail --show-error --silent \
    -X POST "${BILLING_BASE_URL}${endpoint}" \
    -H "Authorization: Bearer ${BILLING_CRON_SECRET}" \
    -H "Content-Type: application/json"
}

call_job "/api/jobs/generate-next-payments"
call_job "/api/jobs/overdue-marking"
call_job "/api/jobs/reminders"
