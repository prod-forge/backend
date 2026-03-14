# Contributing to Prod Forge

Thank you for your interest in contributing.

Prod Forge is an open-source guide to building production-ready backend systems. Contributions that improve the quality, clarity, and completeness of that guide are welcome.

---

## What we are looking for

### Content contributions

- Corrections to technical inaccuracies
- Improvements to existing explanations
- New sections covering topics not yet addressed
- Real-world examples and case studies that illustrate a concept

### Code contributions

- Improvements to the backend application
- Infrastructure improvements
- CI/CD pipeline improvements
- New test coverage

### Other contributions

- Typo and grammar fixes
- Broken link fixes
- Diagram improvements
- Translation (if you would like to maintain a translated version)

---

## What we are NOT looking for

- Suggestions to switch the core stack without strong justification
- Changes that make the project more like a boilerplate
- New features that increase complexity without educational value
- Opinionated changes that reflect personal preference rather than industry practice

When in doubt, open an issue before writing code.

---

## How to contribute

### 1. Open an issue first

For any non-trivial change, open an issue before submitting a pull request.

This allows us to discuss the proposed change and avoid wasted effort.

For small fixes (typos, broken links), you can submit a pull request directly.

### 2. Fork the repository

```shell
git clone https://github.com/prod-forge/backend.git
cd backend
```

### 3. Create a branch

Follow the branch naming convention used in the project:

```shell
feat/short-description
fix/short-description
docs/short-description
```

### 4. Make your changes

Keep changes focused. One pull request should address one thing.

If you are adding a new section to the README, follow the existing writing style:

- short paragraphs
- plain language
- no unnecessary jargon
- concrete examples where possible
- explain the **why**, not just the **what**

### 5. Commit your changes

Follow the conventional commit format:

```text
docs(readme): add section on feature flags
fix(ci): correct workflow trigger condition
feat(observability): add alerting configuration example
```

### 6. Open a pull request

Include in the PR description:

- what the change does
- why it is needed
- any relevant context or references

---

## Writing style guide

This project has a specific tone. Please follow it when contributing content.

**Keep it simple.**
Write for a senior developer who is scanning quickly. Every sentence should earn its place.

**Explain the why.**
The value of this project is not in showing _what_ to do, but _why_ it matters. If you add a section, always include the reasoning.

**Use real examples.**
Abstract advice is easy to ignore. Concrete scenarios stick. When possible, illustrate a concept with a situation a developer would actually encounter.

**Be opinionated but honest.**
It is fine to take a position. But acknowledge trade-offs. Nothing in software engineering is universally correct.

**No buzzwords.**
Avoid phrases like "best-in-class", "battle-tested", "industry-leading". Write plainly.

---

## Code of conduct

Be respectful. Disagreements about technical approach are normal and healthy. Personal attacks are not.

---

## Questions

If you are unsure about anything, open a GitHub Discussion or an issue.

We would rather answer a question than have someone spend time on a contribution that does not fit the project's direction.
