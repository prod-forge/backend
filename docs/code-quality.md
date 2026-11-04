# Code Quality

<p align="center">
  <img alt="Code Quality" src="assets/code-quality.png" width="512px" height="432px">
</p>

Maintaining consistent code quality is essential for long-term project sustainability.

In this project, code quality is protected by a **six-layer defense system**.

## Layer 1. Code Formatting And Consistency

The first layer ensures that the entire codebase follows consistent formatting rules.

We use two tools for this purpose:

- **EditorConfig** - ensures consistent formatting across different editors and IDEs
- **Prettier** - enforces automatic code formatting

These tools eliminate stylistic discussions during code reviews and ensure a uniform code style across the project.

## Layer 2. Static Analysis With ESLint

The second layer introduces stricter rules through **ESLint**.

While ESLint can be configured in many different ways, this project uses the following plugins:

- `typescript-eslint` - TypeScript-specific linting rules (`strictTypeChecked` and `stylisticTypeChecked`)
- `eslint-plugin-import-lite` - default export in modules are prohibited
- `eslint-plugin-no-only-tests` - only statement in tests are prohibited
- `eslint-plugin-regexp` - validation and best practices for regular expressions
- `eslint-plugin-prettier` - integration with Prettier
- `eslint-plugin-perfectionist` - sorting of imports and object properties
- `eslint-plugin-package-json` - validation rules for `package.json`
- `eslint-plugin-check-file` - file naming conventions
- `eslint-plugin-sonarjs` - SonarQube-style bug and code smell rules
- `eslint-plugin-unicorn` - additional best-practice rules
- `eslint-plugin-jest` - rules for test files
- `@eslint/json` - additional validation for JSON files
- `@eslint/js` - JavaScript linting support for auxiliary scripts

Even in TypeScript projects, it is useful to lint JavaScript files that may exist in tooling scripts or configuration
files.

ESLint should be integrated with your IDE so that checks run automatically **on save or paste**.

This ensures developers receive immediate feedback during development.

## Layer 3. Pre-commit Protection

The third layer prevents problematic code from entering the repository.

This is implemented using **Husky** and **lint-staged**.

Before each commit (`.husky/pre-commit` runs `lint-staged`):

- staged `*.ts` and `*.json` files are formatted with Prettier and fixed with `eslint --fix`
- staged `*.md` files are formatted with Prettier
- the whole project is type-checked (`npm run lint:ts`) when a `*.ts` file is staged

The `commit-msg` hook runs commitlint and rejects AI attribution trailers. Before each push, `.husky/pre-push` runs
`npm run knip`, `npm run doctor` and `npm test`.

This ensures that commits do not break the CI pipeline or introduce formatting issues.

## Layer 4. Commitlint Configuration

Consistent commit messages are an important part of maintaining a readable and traceable project history. Clear commit
messages help developers understand what changed, why it changed, and make it easier to navigate the codebase over time.

In this project we use commitlint to enforce a standardized commit message format. This ensures that all commits follow
the same structure and remain meaningful.

Standardized commits also allow us to automatically generate a clean and structured changelog using tools like
release-it during the release process.

This approach improves:

- readability of the git history
- traceability of changes
- automated changelog generation
- overall release management workflow

## Layer 5. Continuous Integration Checks

The final layer runs full validation during the **CI pipeline**.

At this stage the entire codebase is analyzed to ensure:

- linting rules pass (`npm run lint`, `npm run knip`, `npm run doctor`)
- formatting rules are satisfied
- unit and e2e tests run successfully
- the production Docker image builds
- the committed OpenAPI contract matches the code (`npm run openapi:check`)

The pipeline runs on every pull request and on every push to `main`. Supply-chain controls run alongside it:

- `npm audit --omit=dev --audit-level=high` fails the lint job on high or critical production dependency advisories
- CodeQL (`codeql.yml`) analyzes JavaScript/TypeScript on pull requests, on `main` and weekly
- Trivy scans the built Docker image for fixed HIGH and CRITICAL vulnerabilities
- the release image is pushed with an SBOM and provenance attestation
- Dependabot opens weekly updates for npm (minor and patch grouped), GitHub Actions and Docker

This final check acts as a safeguard before any changes are merged into the main branch.

## Layer 6. Dependency Locking

To keep builds stable and predictable, avoid using `^` versions in `package.json`.

Minor dependency updates can still introduce breaking changes and unexpectedly break CI or releases even without code
changes.

Recommended setup:

- use exact dependency versions
- commit `package-lock.json`
- use `npm ci` in CI environments
- add to `.npmrc`:

```shell
save-exact=true
```

For dependency updates, use:

```shell
npm i -g npm-check-updates
ncu -u
npm install
```
