---
schema: pack.v1
id: ci-github
version: 1.0.0
status: draft
title: CI – GitHub Actions
description: Modular GitHub Actions for lint, typecheck, unit, e2e, and preview.
owner: {{OWNER}}
date: {{DATE}}
targets:
  node: 20+
---

# Purpose
Ship a minimal, fast CI pipeline that scales with packs.

# Workflows (Overview)
- lint.yml – ESLint
- typecheck.yml – TS tsc
- test.yml – unit
- e2e.yml – Playwright/Detox (optional)
- preview.yml – Vercel/Expo previews (optional)

# Conventions
- Node version matrix minimal; cache deps; artifact retention short

# Checks (Agent)
- Workflows present; jobs reference correct package scripts
