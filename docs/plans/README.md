# Plans

Every plan of the repository lives here. Before writing a plan, read [goal.md](../goal.md),
[architecture/](../architecture/) and [restrictions/](../restrictions/).

## Format

- A **global plan** is a numbered folder `NNN-<name>/` with `readme.md` (header, goal, its plans in order,
  conclusions) and `00-design.md` (the design it argues from).
- Inside it, each **plan** is a folder `NN-<name>/` with `readme.md` (header, its steps in order, conclusions) and one
  file per **step**: `NN-<name>.md`.
- Every global plan, plan and step opens with the same header:

  ```
  **Status:** <status> · **Version:** <target version> · **Date:** YYYY-MM-DD · **Modules:** <what it touches>
  ```

- Statuses: 📝 draft · ✅ approved · 🔨 in progress · ⏸ hold · ✔️ done · 🔒 closed (stopped, with the reason) ·
  ❌ failed (tried, did not work; linked to `../postmortem/`).
- A step is small enough for one session and one commit: the files, the interfaces it produces for later steps, the
  tests that prove it is done.

## Design

`00-design.md` covers the intent (the user's task in their words), goals, non-goals, the design itself, and ends with:

- **Open questions** — what cannot be decided without the user.
- **Decisions** — the user's answers, dated. Not revisited.
- **Agent's calls (to check)** — choices made without the user, each waiting for a confirm or an overrule.

Only ✅ approved plans are implemented. A plan is ✔️ done when its **Conclusions** section is written (what was
measured, decided, learned) and the user has looked at its result.

## Priority list

Rows are in priority order: the order they are implemented in.

| #   | Global plan | Status | Version | Modules |
| --- | ----------- | ------ | ------- | ------- |

No global plan is open at the moment.
