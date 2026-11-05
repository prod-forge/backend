# AI-Assisted Development

<p align="center">
  <img alt="AI Assisted Development" src="assets/ai-development.png" width="501px" height="401px">
</p>

AI coding agents can significantly speed up development.

At the same time, without proper engineering constraints they often introduce:

- unnecessary abstractions
- duplicated logic
- unrelated refactoring
- inconsistent architecture
- unstable code quality

AI should accelerate implementation, not replace engineering responsibility.

The developer is still responsible for:

- architecture
- correctness
- maintainability
- security
- code quality

This document describes practical approaches for using AI coding agents in real-world projects.

## Quality Gates First

Before integrating AI into your workflow, make sure your project already has strong quality gates.

AI agents naturally follow the rules enforced by the repository. The better your validation pipeline is, the better the
generated code becomes.

At minimum, your project should include:

- strict TypeScript configuration
- ESLint
- Prettier
- pre-commit validation
- CI checks

Useful tools:

- Husky
- lint-staged
- Knip
- nestjs-doctor

Your CI pipeline should validate:

- linting
- formatting
- type checking
- unit tests
- e2e tests

The goal is simple: low-quality code should not be able to enter the repository.

## Architecture Before Generation

AI performs much better when the project structure already exists.

Before generating features with AI, define:

- folder structure
- naming conventions
- module boundaries
- core abstractions
- architectural patterns

AI agents are highly pattern-oriented. Once the project has consistent conventions, generated code becomes much more
stable.

Without clear structure, AI often produces:

- mixed architectural styles
- duplicated utilities
- inconsistent abstractions
- chaotic project structure

This project demonstrates that approach in practice. The layer separation (`src/api/` for controllers, `src/features/`
for business logic, `src/modules/` for infrastructure), naming conventions, and `AGENTS.md` rules were all established
before any AI-assisted feature generation. As a result, generated code naturally fits the existing architecture without
manual correction.

## Workflow

Plan before you generate. For anything beyond a trivial change, planning first produces dramatically more consistent
results.

### Input modes

Claude Code switches input modes with **Shift+Tab**:

- **Default** — reads anything, but asks before edits or shell commands.
- **Accept edits** — applies any change not blocked by `settings.json` permissions.
- **Plan mode** — analysis and planning only, no edits.

Use default mode for unfamiliar code, accept edits for well-scoped work you trust, and plan mode at the start of a
feature.

### Plan, then implement

A reliable flow for a new feature:

1. `/model opus`, then Shift+Tab → **plan mode**.
2. Write a detailed prompt with the task and a checklist of steps to perform.
3. Review the generated plan, validate every point, add anything missing by hand.
4. Ask Claude to save it under `.claude/plans/`.
5. Switch to `/model sonnet` for implementation — faster and cheaper.
6. Point Claude at the saved plan and let it implement, checking off items as it progresses.

Opus plans, Sonnet builds: better thinking where it matters, lower cost where it doesn't. Commit approved plans to the
repo and link them to the ticket — e.g. `.claude/plans/PROJ-142-users-crud.md`.

### Save your prompts

A good prompt is reusable and worth keeping. Store it next to the plan, link the ticket, and structure it as
**Context → Task → Details → Pattern → Constraints**. The _Pattern_ line is the highest-leverage part — point Claude at
an existing feature folder as a template (see [Task Decomposition](#task-decomposition) for a full example).

## Project Knowledge Files

A few committed files give Claude durable context across sessions and help the whole team.

### MEMORY.md

Non-obvious facts you can't infer from the code. Commit it so the knowledge survives. Rule of thumb: _if a teammate
reading only the code would miss it, write it down._

Worth recording, for example:

- A method with a hidden side effect that can't be renamed because other teams depend on it — the note says "to do X,
  call `safeDoX()`, not `doX()` (which also triggers Y)."
- Scaffolding intentionally left for an upcoming task, so the next person doesn't treat it as dead code.

### REVIEW.md

A code-style reference Claude fills out accurately when the project already has solid lint/Prettier rules and enough
existing code to learn patterns from.

When generating it, also ask for a **reviewer checklist** section so it's useful in PR review. Then add a `Skip` block
by hand for files nobody should review:

```markdown
## Skip

- Generated files: ./database-manager/generated/\*\*
- Lock files: _-lock, _.lock
```

### docs/

Keep at least basic docs (`architecture.md`, `api.md`, `data-schema.md`, `developers-guide.md`) in `docs/` — they help
both agents and developers. `AGENTS.md` holds the rules for any agent, `CLAUDE.md` only imports it (`@AGENTS.md`), and
`guide/` is the human guide. Then tell the agent to keep the docs current via `AGENTS.md`:

```markdown
## Documentation Rules

After every change, update any affected docs in `docs/`:

- architecture.md — modules added/removed, middleware/interceptor/filter wiring, request lifecycle
- api.md — endpoints, request/response shapes, error codes, auth behavior
- data-schema.md — schema changes (models, fields, indexes, relations)
- developers-guide.md — setup, env vars, scripts, feature patterns

Skip docs for internal refactors with no observable effect on architecture, API, schema, or workflow.
```

### Skills

Turn any repeated action into a skill: define it once, invoke it with a slash command. For example, a `commit` skill
that stages changes and writes a message in the project's convention — called with `/commit`. Good candidates: commits,
running a specific test suite, or scaffolding a new feature.

## Pre-Hooks

Pre-hooks are shell commands that run before Claude uses a tool. They can inspect the input and block the action
entirely — useful for protecting files that should never be touched by AI.

All hooks are defined in [`.claude/settings.json`](../.claude/settings.json). If Claude tries to perform a
blocked action, the hook returns a `deny` decision with an explanatory message and the action never happens.

This is the safest way to enforce boundaries — unlike `AGENTS.md` instructions which Claude can accidentally
ignore, a hook is enforced at the tooling level regardless of what was asked.

### Protected files (`Edit|Write`)

| Path                             | Reason                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `database-manager/migrations/**` | Migration files are generated by Prisma — editing them manually corrupts the migration history |
| `package-lock.json`              | Managed by npm automatically — hand-editing breaks the lockfile                                |
| `.env`, `.env.*`                 | Contain secrets and must never be written by AI                                                |
| `CHANGELOG.md`                   | Generated automatically by the release tooling (`release-it`)                                  |
| `dist/**`                        | Build artifacts — generated by the build step, not manually maintained                         |
| `coverage/**`                    | Generated test reports — produced by the test runner                                           |

### Blocked commands (`Bash`)

This repository's `.claude/settings.json` configures only the `Edit|Write` hooks above. A `Bash` matcher is the place to
block destructive commands such as the following, which are worth adding to any project that lets an agent run shell
commands:

| Pattern                            | Reason                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `--legacy-peer-deps`               | Silently alters npm dependency resolution in ways that can mask real conflicts |
| `git push --force` / `git push -f` | Overwrites shared remote history — irreversible without backup                 |
| `git reset --hard`                 | Discards all local changes without recovery — irreversible                     |

## Task Decomposition

Bad prompt:

```text
Create a service that returns users
```

Good prompt:

```text
Context:
NestJS app for learning REST APIs. There is no users module yet. Add a simple in-memory CRUD
to demonstrate the basic structure of a NestJS module.

Task:
Create a Users module with full CRUD.

Details:
- NestJS + TypeScript
- Files: users.module.ts, users.controller.ts, users.service.ts,
  dto/create-user.dto.ts, dto/update-user.dto.ts
- User fields: id (number), name (string), email (string)
- Store data in an in-memory array inside the service
- Endpoints: POST /users, GET /users, GET /users/:id, PATCH /users/:id, DELETE /users/:id
- class-validator: name (required string), email (required valid email)
- Throw NotFoundException when the user does not exist

Pattern:
Use src/features/todos/ as the structural reference for this feature.

Constraints:
- Do not modify existing modules
- Do not add new dependencies
- Code must pass lint/typecheck/tests without configuration changes
```

The more specific the task, the better the result. Decompose large tasks into smaller isolated steps whenever possible.

## Common AI Problems

AI-generated code often fails in predictable ways:

- overengineering
- unnecessary abstractions
- duplicate utilities
- inconsistent naming
- unrelated refactoring
- ignoring existing architecture

Your workflow and instructions should minimize these behaviors.

## Cost Optimization

Large context windows increase both token usage and reasoning instability.

To reduce cost and improve output quality:

- read only relevant files
- avoid scanning the entire repository
- run only affected tests
- keep tasks small and isolated

Example **AGENTS.md** section:

```text
## Cost Saving Rules

- Run only affected tests
- Avoid full test suite runs for isolated changes
- Read only files related to the task
- Avoid repository-wide scans unless necessary
```

Smaller context usually produces both cheaper and better results.

## Quality Control

AI-generated code should always be reviewed and validated manually.

Even strong AI coding agents can:

- miss edge cases
- introduce hidden bugs
- misunderstand business logic
- generate unsafe abstractions
- produce overly complex solutions

AI assistance does not remove engineering responsibility.

### Commit Frequently

Each successful prompt or isolated AI-generated change should ideally become a separate commit.

This makes it much easier to:

- rollback problematic changes
- identify regressions
- understand where issues were introduced
- review generated code incrementally

Small isolated commits are significantly easier to manage than large AI-generated diffs.

### Validate Edge Cases

AI often handles the "happy path" well but misses edge cases.

Always verify:

- invalid inputs
- boundary conditions
- error handling
- empty states
- concurrency scenarios
- permission checks

If edge cases are missing:

- ask the AI to extend the tests
- manually improve the implementation
- add additional validations

### Mandatory Code Review

AI-generated code should go through the same review process as manually written code.

This includes:

- personal review
- team review
- automated analysis tools

Tools such as [SonarCloud/SonarQube](https://www.sonarsource.com/products/sonarqube/cloud/)
can provide additional static analysis during pull request reviews.

This project includes `eslint-plugin-sonarjs` as part of the default ESLint configuration, so a subset of
SonarQube-style rules runs automatically on every commit and CI check — no separate setup required.

### Never Trust AI Blindly

If generated code looks unclear or suspicious:

- ask the AI to explain it
- request a simpler implementation
- ask for refactoring
- rewrite parts manually if necessary

Do not merge code you do not fully understand.

AI is a development tool, not an autonomous engineer.

The final responsibility for the codebase always belongs to the developer and the team.

## Recommended Workflow

A practical AI-assisted workflow usually looks like this:

1. Define the task manually and link it to a ticket
2. Decompose it into isolated steps
3. Generate and validate a plan in plan mode (Opus)
4. Save the plan to `.claude/plans/` and commit it
5. Switch to Sonnet and implement from the saved plan
6. Review generated code manually after each step
7. Run all relevant quality checks
8. Commit each completed step separately
9. Review all changes carefully before opening a pull request

AI coding agents are most effective when used as controlled engineering accelerators, not autonomous developers.
