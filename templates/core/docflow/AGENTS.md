---
schema: guide.v1
id: agents-guide
project: {{PROJECT_NAME}}
owner: {{OWNER}}
year: {{YEAR}}
---

# Agent + Coding Guide

## Standards
- Language/tooling: prefer TypeScript; enable strict mode and linting.
- Docs-first: update specs/design/stack and ADRs alongside code changes.
- Status flow: pending → in_progress → in_review → completed.

## Conventions
- Filenames: kebab-case for code; `ADR-YYYY-MM-DD-NN-slug.md` for decisions.
- Commits: imperative mood, reference item IDs (e.g., F001) and ADRs.
- Tests: colocate with code where feasible; ensure repeatability.

## ADR Rules
- Use `docflow/templates/adr.md` to propose decisions.
- Link ADRs from items and PRs; update status on acceptance.
- Supersede old ADRs explicitly; do not edit accepted content retroactively.

## Item Workflow
- Create from `docflow/templates/item.md` with clear DoR/DoD.
- Keep acceptance criteria testable; link to specs/ADRs.
- Update `iterations/current/features.md` status as work progresses.

## Handoff
- Keep `docflow/active/focus.md` and `docflow/active/session.md` current.
- Summarize what changed, what’s next, and blockers.
