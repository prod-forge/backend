# `main` has no branch protection

- **What:** CI runs on every pull request and on `main`, and the git hooks run lint, knip, doctor and `test:cov` before a push, but nothing on GitHub requires the CI jobs to pass before a merge or a direct push to `main`.
- **Where:** the repository settings on GitHub (no branch protection rule or ruleset for `main`); the checks themselves are in `.github/workflows/ci.yml` and `.husky/`.
- **Why deferred:** found in the 2026-11-05 review; the owner chose not to enable protection yet. Until then `docs/goal.md` describes the checks as run in CI and the `pre-push` hook, not as a merge gate.
- **What a fix needs:** a ruleset for `main` that requires a pull request and the CI jobs `Linting`, `Unit Tests`, `E2E Tests` and `Build Application` (plus CodeQL if wanted) to pass; it must still let the release commit `chore(release)` be pushed by `npm run release`, or release through a pull request. Then update `docs/goal.md`, `docs/restrictions/ci-cd.md` and remove this file.
