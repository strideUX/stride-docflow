---
schema: guide.v1
title: "Testing Strategy"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Testing Strategy

Deliver confidence with the minimum effective test suite.

Layers & Scope
- Unit: pure logic; fast and deterministic
- Integration: service boundaries (DB, queues, auth); contract and schema checks
- E2E/Smoke: critical user journeys; minimal but reliable

Tooling
- Test runner and utils:
- Coverage baseline: threshold(s) meaningful to this codebase
- Snapshot policy: only for stable UI or data shapes

Data & Fixtures
- Keep fixtures small and explicit
- Prefer builders/factories for readability

Performance Baselines
- Web: LCP/CLS thresholds; test on CI with budgets if applicable
- API: p95 latency targets for hot endpoints

CI Integration
- Run unit + integration on PRs; E2E on main or nightly as needed
- Fail the build on flaky tests until addressed
