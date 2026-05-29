# AI-Assisted Development

<p align="center">
  <img alt="AI Assisted Development" src="https://github.com/prod-forge/backend/blob/main/docs/assets/ai-development.png" width="501px" height="401px">
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
- integration tests
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

## AI Instructions

Most AI tools support project-level instruction files such as **CLAUDE.md**.

Keep these files short and focused.

Good instructions define:

- architectural constraints
- behavioral rules
- workflow expectations

Avoid duplicating things AI can already infer from the project itself, such as:

- ESLint rules
- Prettier configuration
- folder structure
- installed dependencies

Useful instruction examples:

- avoid unrelated refactoring
- reuse existing abstractions
- keep changes minimal
- avoid unnecessary dependencies
- avoid overengineering

The main goal is to keep the AI focused on the current task.

## Task Decomposition

Bad prompt:

```text
Create a service that returns users
```

Good prompt:

```text
Task:
Implement an endpoint for retrieving paginated users from the User table.

Requirements:
- pagination params must be implemented through DTOs
- validation must follow the existing project validation approach
- default values must be applied for missing params
- endpoint must follow existing API conventions
- response format must match current project standards
- swagger documentation must follow existing project patterns
- code must be covered by all existing test types used in the project
- reuse existing test utilities
- code must pass lint/typecheck/tests without configuration changes

Before implementation:
1. Find similar endpoints in the project
2. Use them as a reference implementation
3. Follow the existing abstraction level
4. Avoid introducing unnecessary dependencies

Result:
- show only necessary changes
- avoid unrelated refactoring
- explain the purpose of each change
- provide a list of modified files
```

The more specific the task is, the better the generated result becomes.

Large tasks should be decomposed into smaller isolated steps whenever possible.

## Common AI Problems

AI-generated code often fails in predictable ways.

Typical problems include:

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

Example **CLAUDE.md** section:

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

1. Define the task manually
2. Decompose the task
3. Define constraints
4. Ask AI to analyze existing implementations
5. Request an implementation plan
6. Generate code incrementally
7. Review generated code manually
8. Run all quality checks
9. Commit result incrementally
10. Review all changes very attentive

AI coding agents are most effective when used as controlled engineering accelerators, not autonomous developers.
