# Contributing to OpenHostel

First of all, thank you for contributing to **OpenHostel**.

This project is built as a community-driven open-source initiative where students gain real software development experience by working on production-quality features.

Please read this guide before creating your first Pull Request.

---

# Development Workflow

The contribution workflow follows the same process used in professional software teams.

1. Fork the repository
2. Clone your fork
3. Create a new branch
4. Solve an assigned GitHub issue
5. Test your changes
6. Commit using the standard format
7. Open a Pull Request
8. Address review comments
9. Merge after approval

---

# Before You Start

Before writing any code, make sure you have:

* Read `README.md`
* Read `docs/PRODUCT_VISION.md`
* Read `docs/MVP.md`
* Checked existing GitHub Issues
* Confirmed the issue is not already assigned

Never start implementing a feature without a corresponding GitHub Issue.

---

# Project Structure

```text
OpenHostel/

apps/
  web/
  api/

packages/
  ui/
  database/
  auth/

docs/
.github/
```

Keep new code inside the appropriate module.

---

# Branch Naming Convention

Create branches using the following format.

| Type          | Example                        |
| ------------- | ------------------------------ |
| Feature       | `feature/student-registration` |
| Bug Fix       | `fix/qr-validation`            |
| Documentation | `docs/mvp-update`              |
| Refactor      | `refactor/auth-service`        |

Avoid working directly on the `main` branch.

---

# Commit Message Convention

Use conventional commit messages.

```text
feat: add student registration

fix: prevent duplicate meal attendance

docs: update roadmap

refactor: simplify auth middleware
```

Types:

* `feat`
* `fix`
* `docs`
* `refactor`
* `test`
* `chore`

---

# Pull Request Guidelines

Every Pull Request should contain:

### Title

```text
feat: implement mess subscription API
```

### Description

* Issue number
* What was implemented
* Screenshots (if UI)
* Testing performed
* Breaking changes (if any)

Example:

```markdown
## Summary

Implemented student mess subscription.

## Closes

#42

## Tested

- Student login
- Apply plan
- Duplicate prevention

## Screenshots

(Attach images)
```

---

# Coding Standards

## General

* Write readable code
* Prefer small reusable functions
* Avoid duplicated logic
* Use TypeScript types
* Keep components modular

## Naming

| Item            | Convention |
| --------------- | ---------- |
| Components      | PascalCase |
| Variables       | camelCase  |
| Database Models | PascalCase |
| API Routes      | kebab-case |

Example:

```ts
StudentCard.tsx

createSubscription()

MessSubscription
```

---

# Issue Labels

| Label              | Meaning                 |
| ------------------ | ----------------------- |
| `good first issue` | Beginner friendly       |
| `easy`             | Small feature           |
| `medium`           | Moderate implementation |
| `hard`             | Complex feature         |
| `bug`              | Bug fix                 |
| `documentation`    | Docs only               |

Choose issues according to your experience level.

---

# Definition of Done

A feature is considered complete only if:

* It solves the GitHub issue
* Code follows project standards
* No TypeScript errors
* No lint errors
* Documentation updated if required
* PR approved by a maintainer

---

# Reporting Bugs

Include:

* Expected behavior
* Actual behavior
* Steps to reproduce
* Screenshots
* Browser/device information

Incomplete bug reports may be closed.

---

# Feature Requests

Before requesting a feature:

1. Check the roadmap.
2. Search existing issues.
3. Explain the problem.
4. Propose a solution.
5. Describe who benefits.

Features outside MVP will usually be moved to future milestones.

---

# Code Review Rules

Maintainers review for:

* Code quality
* Architecture
* Security
* Performance
* Documentation
* UI consistency

Changes may be requested before merging.

---

# Community Values

We expect every contributor to:

* Be respectful
* Welcome constructive feedback
* Help new contributors
* Write maintainable code
* Prioritize collaboration over competition

OpenHostel grows through community contributions, and every merged Pull Request becomes part of a real product used by students.
