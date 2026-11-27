**Status:** ⏸ hold · **Version:** — (tests only, no release) · **Date:** 2026-11-17 · **Modules:** test (e2e), docs

# 002 — Ownership tests for every todo route

## Goal

A two-user e2e suite proves that user B cannot read, update or delete user A's todo by swapping its id, and that
every list response (filters, search, pagination, `meta`) contains only the caller's todos, cached or not. It lands
before the auth replacement ([003-oidc-authentication](../003-oidc-authentication/readme.md)) and before any high-load
work, so both changes run against it. Design: [00-design.md](./00-design.md).

## Plans

1. [01-two-user-suite](./01-two-user-suite/readme.md) — move the ownership tests to their own file with a two-user
   fixture, add the list cases.

## Conclusions

_Written when the plan is done._
