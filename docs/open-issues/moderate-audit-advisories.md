# Moderate audit advisories in the production tree

- **What:** `npm audit --omit=dev` reports 5 moderate advisories: `glob` 9–14 (GHSA-3g3m-2fjr-6pw4) and `minimatch` 7–11 (GHSA-g3hv-75wg-m249), pulled in through `rimraf` 5.
- **Where:** `@opentelemetry/auto-instrumentations-node` → `@opentelemetry/resource-detector-gcp` → `gcp-metadata` 8.1.4 → `gaxios` 7.1.3 → `rimraf` 5.0.10. `gcp-metadata` pins `gaxios` to exactly 7.1.3, so `npm audit fix` cannot move it; `gaxios` 7.3 no longer depends on `rimraf`.
- **Why deferred:** found in the 2026-11-05 review. The CI and CD gate is `--audit-level=high`, so the build is green, and the code is never reached: `gaxios` 7.1.3 lists `rimraf` in `dependencies` but its build never imports it. An override would need a roadmap entry ([restrictions/dependencies.md](../restrictions/dependencies.md), "Overrides are temporary").
- **What a fix needs:** a `gcp-metadata` release that accepts `gaxios` >=7.3 (then a plain `npm update`), or a scoped override `"gcp-metadata": { "gaxios": "7.3.1" }` tracked in `roadmap.md` until that release. Then remove this file.
