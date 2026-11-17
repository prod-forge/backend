**Status:** ⏸ hold · **Version:** — (load script and docs) · **Date:** 2026-11-17 · **Modules:** load, guide

# 01 — Shutdown scenario

## Files

- `load/k6-shutdown.js` — `BASE_URL`, `DURATION` from env. A `constant-arrival-rate` authenticated
  `GET`/`POST /todos` flow plus a `GET /health` poll every 200 ms; one login in `setup()` (login throttle).
  Each request is tagged with its start time; non-2xx and connection errors are logged with time and endpoint.
- `guide/release-management.md` — "Graceful shutdown": the chain (ALB deregistration 30 s → SIGTERM → readiness
  down → drain 10 s → in-flight wait up to 20 s → close, `stopTimeout` 60 s), how to run the check, the result.

## Procedure

1. `docker compose -f docker-compose.yml -f load/docker-compose.load.yml up production`.
2. Start `k6 run load/k6-shutdown.js`; after about 10 s, `docker stop` the app container (SIGTERM, compose
   `stop_grace_period` above 30 s).
3. Expected: every request started before SIGTERM returns 2xx; `/health` returns 503 during the drain; the logs show
   "Shutdown started" and "Shutdown completed". Requests started after the drain may fail locally (no load balancer);
   they are counted separately, not as a failure.

## Tests

The script's thresholds and the recorded run are the proof. A request that started before SIGTERM and failed is a
`fix:` with its own issue.
