**Status:** ⏸ hold · **Version:** 1.0.2 · **Date:** 2026-11-17 · **Modules:** CI, docs

# 01 — `oasdiff` job

## Files

- `.github/workflows/ci.yml` — job `api-contract`, `if: github.event_name == 'pull_request'`, `permissions:
contents: read`, checkout with `fetch-depth: 0`:
  1. `git show "origin/${{ github.base_ref }}:docs/openapi.json" > "$RUNNER_TEMP/base.json"`; if the base has no file,
     the job passes with a notice.
  2. `docker run --rm -v ...:/specs tufin/oasdiff:<exact version> breaking /specs/base.json /specs/openapi.json
--fail-on ERR --format text`, output saved and appended to `$GITHUB_STEP_SUMMARY`.
  3. When the PR has the label `api-breaking-approved`, the step reports but does not fail.
     The base ref and label are passed through `env:`, never interpolated into `run:`.
- `docs/restrictions/ci-cd.md` — the new job in the job list.
- `docs/commands.md` — the local `docker run` command against `git show origin/main:docs/openapi.json`.
- `guide/release-management.md` — the job in the CI section.

## Tests

- A scratch pull request (owner-run, not merged) that removes `description` from `TodoResponseDto`: the job fails and
  names the removed property. Then the same PR with the label: the job passes and still prints the report.
- A pull request that adds an optional response field: the job passes.
- `actionlint` on `ci.yml`, if installed locally.
