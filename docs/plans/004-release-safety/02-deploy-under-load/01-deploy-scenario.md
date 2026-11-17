**Status:** 📝 draft · **Version:** — (load script and docs) · **Date:** 2026-11-17 · **Modules:** load, guide

# 01 — Deploy scenario

## Files

- `load/k6-deploy.js` — `BASE_URL`, `DURATION` (default `10m`) from env. Two `constant-arrival-rate` scenarios:
  `GET /health/live` at about 20 rps, and an authenticated `GET /todos` / `POST /todos` / `DELETE /todos/:id` flow
  under the per-IP limit. One login in `setup()` (login throttle). Threshold `http_req_failed: ['rate==0']`; every
  non-2xx is logged with time, status and endpoint.
- `guide/release-management.md` — "Zero-downtime deploys": the chain (ALB deregistration 30 s → SIGTERM → readiness
  down → drain 10 s → in-flight wait up to 20 s → close, `stopTimeout` 60 s), how to run the measurement, and the
  measured result.

## Procedure (owner)

1. Start `k6 run load/k6-deploy.js` against the target.
2. Run `Rollback ECS Revision` with the current revision: every task is replaced.
3. Collect: the k6 summary, ALB `HTTPCode_ELB_5XX_Count` and `HTTPCode_Target_5XX_Count` for the window, the
   "Shutdown started/completed" logs of the old tasks.

## Tests

Locally first: `docker compose` with the load override, `docker stop` of the app under the script (SIGTERM path), so
the script and its thresholds are known to work before the AWS run. Done when the AWS run shows zero failed requests,
or when a dropped request is found and filed as a `fix:`.
