---
schema: guide.v1
title: "Next.js + Convex Pack"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---
# Next.js + Convex Pack

A lightweight pack containing standards, patterns, and minimal examples for Next.js + Convex projects.

## What's Inside
- `docs/`
  - `standards.md` — coding and architecture standards
  - `convex-patterns.md` — Convex schema/function patterns
  - `folder-structure.md` — reference directory layout
  - `perf-security.md` — performance and security guidance
- `examples/`
  - Minimal Next.js app shell (PPR enabled), API health route
  - Minimal Convex schema and domain functions
  - Base config: `tsconfig.json`, `.eslintrc.json`, `.prettierrc`, `.env.example`

## When To Use
- New projects using Next.js + Convex
- Audits/retrofits where the target stack is Next.js + Convex

## How To Scaffold (planned CLI)
Once the CLI is available:
```bash
# scaffold a project's docflow and this pack
docflow init {{PROJECT_SLUG}} --pack nextjs-convex --owner "{{OWNER}}"
```
This will:
	1.	Copy core docflow docs into docflow/
	2.	Copy this pack under docflow/packs/nextjs-convex/ or the chosen location
	3.	Render tokens in contents and filenames

Keep It Current
	•	Prefer small, composable examples over large starters
	•	Update docs when ADRs change architecture
	•	Validate env vars and configs across CI and production

