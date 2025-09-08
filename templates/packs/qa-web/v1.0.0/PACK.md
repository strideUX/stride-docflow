---
schema: pack.v1
id: qa-web
version: 1.0.0
status: draft
title: QA – Web (Vitest, RTL, Playwright)
description: Testing patterns and configs for web apps.
owner: {{OWNER}}
date: {{DATE}}
---

# Purpose
Define a practical test pyramid and conventions for web projects.

# Opinionated Defaults
- Unit with Vitest; components with RTL; e2e with Playwright
- MSW for network; data builders for fixtures
- Coverage thresholds (e.g., 80% lines)

# Structure
- `tests/unit/**`, `tests/e2e/**`, `tests/fixtures/**`

# Conventions
- Test file naming: `*.test.ts(x)`; colocate or centralize per project policy
- Prefer user-driven RTL queries; avoid testing implementation details

# CI Hooks
- Separate jobs: unit vs e2e; cache dependencies and browsers

# Checks (Agent)
- Presence of configs; e2e tagged; MSW used where appropriate

