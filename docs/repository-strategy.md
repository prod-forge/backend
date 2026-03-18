# Repository Strategy

<p align="center">
  <img alt="Repository Strategy" src="https://github.com/prod-forge/backend/blob/main/assets/repo-strategy.png" width="512px" height="488px">
</p>

One of the first architectural decisions when starting a project is choosing the repository structure.

In practice, there are two common approaches:

- **Monorepo** – all services and applications live in a single repository
- **Single repository per service** – each service is maintained independently

Both approaches have advantages and trade-offs.

## When Monorepos Work Well

In my experience, monorepos work best in **small teams** where engineers have strong shared ownership of the entire
codebase.

This setup allows developers to quickly make cross-project changes.
For example, when implementing a new backend endpoint, it can be convenient to immediately update the frontend component
that consumes it.

For small teams and rapid prototyping, this can be very efficient.

## A Real-World Problem With Monorepos

However, monorepos can introduce serious problems as teams grow.

I once worked as a team lead on a project where multiple teams shared a monorepo.
Our team owned a specific service inside the repository.

One day we arrived at work and noticed that:

- our service started behaving incorrectly
- tests were failing
- and the commit history showed changes made by another team

Someone from a neighboring team had modified our module directly in order to unblock their own work.

We discussed the situation and introduced processes:

- versioning rules
- changelog requirements
- deprecation policies

However, the same issue happened again later.

The reason is simple:
when engineers are blocked, modifying someone else's code in a monorepo often feels like the fastest solution.

But in a multi-team environment, **this bypasses the collaboration process**.

The correct approach should look more like this:

1. Introduce the required change
2. Publish a changelog
3. Provide migration instructions
4. Notify dependent teams
5. Allow those teams to schedule upgrades
6. Deprecate the old functionality
7. Remove it only in a future release

Without these steps, teams can accidentally break each other's systems.

## Why Repository Boundaries Matter

If each service had been maintained in **separate repositories**, other teams would not have had direct access to modify
our code.

Instead, they would need to:

- open an issue
- propose a change
- or depend on a versioned release

This creates clear **ownership boundaries** between teams.
