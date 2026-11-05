# No CD workflow for the dev environment

- **What:** the terraform repository defines a `dev` and a `prod` environment, but `.github/workflows/cd.yml`, `rollback.yml` and `show-ecs-revisions.yml` target `prod` only. Nothing deploys the backend to dev.
- **Where:** `.github/workflows/` (every AWS job declares `environment: prod`); the GitHub variables of the `prod` environment (`guide/release-management.md`, "GitHub Variables").
- **Why deferred:** found in the 2026-11-05 review; deploying dev through CD was never built, and the docs now say CD deploys prod only.
- **What a fix needs:** a `dev` GitHub environment with the variables from `terraform output` of the dev root, a deploy role that trusts `environment: dev`, and a trigger (for example a push to `main` or a manual `workflow_dispatch`) that reuses the CD jobs with the environment as an input. Then update `guide/release-management.md` and remove this file.
