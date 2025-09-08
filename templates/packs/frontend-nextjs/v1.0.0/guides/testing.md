---
schema: pack.guide.v1
id: frontend-nextjs-testing
title: Testing Strategy
---

# Testing (Web)

- Unit: Vitest for pure logic; RTL for components.
- E2E: Playwright for key flows; keep tests short and stable.
- Mock network with MSW; avoid deep mocking of internals.

