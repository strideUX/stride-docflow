---
schema: guide.v1
title: "Conventions"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Conventions

Team rules that make code and docs predictable across projects.

## Code
- Language & version pinned; enforce formatter and linter in CI
- Prefer pure functions; keep I/O at the edges
- Errors: typed errors; include context and remediation hints
- Modules: one responsibility; avoid files > 300 lines, functions > 50 lines (guidelines)
- Naming: descriptive and domain-driven; avoid abbreviations

## Docs
- Keep indexes small; promote detail to leaf docs in `docflow/*`
- All docflow files must include front-matter (schema/id/title/…)
- Status vocabulary: `pending → in_progress → in_review → completed`
- IDs: `F###` (feature), `C###` (chore), `B###` (bug), `S###` (spike), `ADR-YYYY-MM-DD-NN-slug`
- Tokens: `{{PROJECT_NAME}} {{PROJECT_SLUG}} {{OWNER}} {{DATE}} {{ITER_NUM}} {{ID}} {{SLUG}}`

## Reviews
- PRs small and focused; include context + screenshots for UI
- Block on failing checks; request review from relevant owners
