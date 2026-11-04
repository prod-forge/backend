#!/usr/bin/env bash
# Starts the local compose stack and checks that every observability component works end to end:
# app health, Prometheus scrape, Grafana provisioning, Tempo traces, Loki logs with trace ids, Prisma metrics.
# Requires: docker compose, curl, jq. A migrated and seeded compose database (see README, Getting started).
# The stack is left running; stop it with `docker compose down`.
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3001}"
GRAFANA_AUTH="${GRAFANA_AUTH:-admin:admin}"
TEMPO_URL="${TEMPO_URL:-http://localhost:3200}"
LOKI_URL="${LOKI_URL:-http://localhost:3100}"
VERIFY_EMAIL="${VERIFY_EMAIL:-user1@example.com}"
REQUESTS="${REQUESTS:-50}"
EXPECTED_DASHBOARDS=3
WAIT_SECONDS="${WAIT_SECONDS:-180}"

log() { printf '[verify] %s\n' "$*"; }
fail() { printf '[verify] FAIL: %s\n' "$*" >&2; exit 1; }

# Retries a command once per second until it succeeds or the timeout elapses.
wait_for() {
  local description="$1" timeout="$2"
  shift 2
  local started=$SECONDS
  until "$@" >/dev/null 2>&1; do
    if (( SECONDS - started >= timeout )); then
      fail "timed out after ${timeout}s waiting for ${description}"
    fi
    sleep 1
  done
  log "OK: ${description} ($(( SECONDS - started ))s)"
}

http_ok() { [[ "$(curl -s -o /dev/null -w '%{http_code}' "$1")" == "200" ]]; }

prometheus_target_up() {
  curl -sf --get "${PROMETHEUS_URL}/api/v1/query" --data-urlencode 'query=up{job="nestjs-app"}' \
    | jq -e '.data.result[0].value[1] == "1"'
}

prisma_queries_recorded() {
  curl -sf "${APP_URL}/metrics" \
    | awk '$1 == "prisma_queries_total" && $2 + 0 > 0 { found = 1 } END { exit !found }'
}

tempo_has_traces() {
  local now
  now=$(date +%s)
  curl -sf --get "${TEMPO_URL}/api/search" \
    --data-urlencode "start=$(( now - 900 ))" --data-urlencode "end=$(( now + 60 ))" --data-urlencode 'limit=5' \
    | jq -e '(.traces | length) > 0'
}

loki_has_trace_ids() {
  local now
  now=$(date +%s)
  curl -sf --get "${LOKI_URL}/loki/api/v1/query_range" \
    --data-urlencode 'query={container="production"} |= "traceId"' \
    --data-urlencode "start=$(( now - 900 ))000000000" --data-urlencode "end=$(( now + 60 ))000000000" \
    --data-urlencode 'limit=50' \
    | jq -e '[.data.result[].values[][1] | select(test("\"traceId\":\"[0-9a-f]{32}\""))] | length > 0'
}

command -v jq >/dev/null || fail "jq is required"

log "Starting the compose stack"
docker compose up -d --build

wait_for "app /health is 200" "${WAIT_SECONDS}" http_ok "${APP_URL}/health"

log "Logging in as ${VERIFY_EMAIL}"
token=$(curl -sf -X POST "${APP_URL}/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"${VERIFY_EMAIL}\"}" | jq -r '.data.accessToken // empty') \
  || fail "login failed; migrate and seed the compose database first"
[[ -n "${token}" ]] || fail "login returned no access token"

log "Sending ${REQUESTS} requests to /api/v1/todos"
statuses=$(for _ in $(seq "${REQUESTS}"); do
  curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer ${token}" "${APP_URL}/api/v1/todos"
done | sort | uniq -c)
printf '%s\n' "${statuses}"
grep -qE '^ *[0-9]+ 200$' <<<"${statuses}" || fail "no request returned 200"

wait_for "prisma_queries_total > 0 in /metrics" 30 prisma_queries_recorded
wait_for "Prometheus up{job=\"nestjs-app\"} == 1" 60 prometheus_target_up
wait_for "Grafana /api/health is 200" 60 http_ok "${GRAFANA_URL}/api/health"

dashboards=$(curl -sf -u "${GRAFANA_AUTH}" "${GRAFANA_URL}/api/search?type=dash-db" | jq 'length')
[[ "${dashboards}" == "${EXPECTED_DASHBOARDS}" ]] \
  || fail "expected ${EXPECTED_DASHBOARDS} provisioned dashboards, found ${dashboards}"
log "OK: ${dashboards} dashboards provisioned"

wait_for "Tempo /ready is 200" 90 http_ok "${TEMPO_URL}/ready"
wait_for "Tempo search returns at least one trace" 60 tempo_has_traces
wait_for "Loki has an app log line with a traceId" 60 loki_has_trace_ids

log "All observability checks passed"
