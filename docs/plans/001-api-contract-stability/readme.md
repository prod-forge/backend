**Status:** ⏸ hold · **Version:** 1.0.2 · **Date:** 2026-11-17 · **Modules:** api DTOs, swagger decorators, docs/openapi.json, CI, docs, guide

# 001 — API contract stability

## Goal

`docs/openapi.json` describes every response exactly, CI fails a pull request that breaks an existing operation, and
the rule for changing the API inside a version is written down. Counterpart of the frontend global plan
`001-api-contract` (response parsing in the clients). Design: [00-design.md](./00-design.md).

## Plans

1. [01-accurate-openapi](./01-accurate-openapi/readme.md) — response DTOs and envelope decorators.
2. [02-breaking-change-check](./02-breaking-change-check/readme.md) — `oasdiff` job in CI.
3. [03-versioning-policy](./03-versioning-policy/readme.md) — `docs/restrictions/api.md`, guide, architecture.

## Conclusions

_Written when the plan is done._
