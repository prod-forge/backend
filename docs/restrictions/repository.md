# Repository

<!-- cspell:ignore commitlintrc infile lintstagedrc -->

## English only

- **Rule:** code, comments, docs and the guide are written in English.
- **Where:** `cspell.json` (`"language": "en,en-GB"`). It is not run by a hook; check docs manually with `npx --yes cspell --no-progress 'docs/**/*.md'`.

## Commit messages

- **Rule:** Conventional Commits; allowed types are `ci`, `chore`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`. No `Co-Authored-By` or other AI attribution in commits or pull requests.
- **Reason:** the release changelog is generated from the commit history (`docs/commands.md`, "Commit Convention"); attribution policy is in `AGENTS.md` ("Git Commit Policy").
- **Where:** `.commitlintrc.cjs` (run by `.husky/commit-msg` through `npm run lint:commit`); `.husky/commit-msg` rejects `Co-Authored-By`, `Generated-By` or `Assisted-By` trailers that mention Claude or Anthropic.

## CHANGELOG.md is generated

- **Rule:** never edit `CHANGELOG.md` by hand.
- **Reason:** `release-it` writes it from the commit history on every release.
- **Where:** `.release-it.json` (`@release-it/conventional-changelog`, `infile: CHANGELOG.md`); `.claude/settings.json` denies Edit and Write on it.

## Protected files

- **Rule:** do not edit `database-manager/migrations/`, `package-lock.json`, `.env*` files, `CHANGELOG.md`, `dist/` or `coverage/`.
- **Reason:** migration history, a generated lock file, secrets, generated output (the deny reasons in the hooks).
- **Where:** `.claude/settings.json` — `PreToolUse` hooks on `Edit|Write`. There is no `Bash` hook: commands such as `git push --force` or `git reset --hard` are not blocked by the tooling, so do not run them.

## Git hooks are the first gate

- **Rule:** a commit or push that fails the hooks is fixed, not forced through (`--no-verify` is not used).
- **Reason:** the same checks run in CI (`restrictions/ci-cd.md`); the hooks catch them before a push.
- **Where:** `.husky/pre-commit` (`npm run pre-commit`: lint-staged with Prettier, ESLint, `tsc --noEmit`, `.lintstagedrc.cjs`), `.husky/commit-msg` (commitlint and the attribution check), `.husky/pre-push` (`npm run knip && npm run doctor && npm run test:cov`).

## The OpenAPI contract is committed

- **Rule:** `docs/openapi.json` stays at this path and is regenerated with `npm run openapi:export` in the same change as any route, DTO or Swagger decorator change. Never edit it by hand.
- **Reason:** it is the committed HTTP contract (`guide/documentation.md`, "Swagger / OpenAPI").
- **Where:** `scripts/export-openapi.ts` writes it; `npm run openapi:check` (CI lint job) and `test/openapi.e2e-spec.ts` fail when it drifts; `.release-it.json` regenerates and stages it after the version bump; `cspell.json` ignores it.

## docs/ is not formatted by Prettier

- **Rule:** keep `docs/` out of Prettier.
- **Reason:** these files are written and edited by agents; Prettier has broken their tables, nested lists and checkboxes (`guide/ai-development.md`, "Context belongs to the repository").
- **Where:** `.prettierignore` (`docs/`).
