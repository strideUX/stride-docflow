---
schema: guide.v1
title: "Testing Strategy"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Testing Strategy

Layers

Unit tests: pure functions; deterministic
Integration: service boundaries; I/O and schema checks
E2E: critical user journeys; smoke paths

Tooling

Test runner:
Coverage target:
Snapshot policy: minimal and stable

Performance Baselines

Web: TTFB/LCP/CLS targets if applicable
Backend: p95 latency, throughput
