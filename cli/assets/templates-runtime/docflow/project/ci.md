---
schema: guide.v1
title: "CI/CD"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# CI/CD

Make the happy path easy and safe to follow.

Pipelines

Typical flow:
```txt
lint → typecheck → unit → integration → build → deploy
```

Block merges on any failure.

Branch & PR Policy
- Small, frequent PRs; draft early
- Descriptive titles: type(scope): subject
- Link to docflow item IDs (e.g., F123) and ADRs when relevant

Environments & Releases
- Iteration-based delivery; archive when outcomes met
- Tag releases (e.g., v0.1.0) or iteration snapshots (e.g., iter-03)
- Keep changelog scoped and factual

Protections
- Required checks on main
- Enforce code owners where it matters (security-sensitive areas)

Rollbacks
- Keep rollback steps documented (runtime + data)
- Automate where reasonable; verify post-rollback health

