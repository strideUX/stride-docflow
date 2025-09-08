---
schema: pack.v1
id: frontend-nextjs
version: 1.0.0
status: draft
title: Next.js (App Router) – TypeScript Strict
description: Opinionated Next.js app setup with server-first defaults, TS strict, ESLint, optional Tailwind, and testing patterns.
owner: {{OWNER}}
date: {{DATE}}
params:
  ENABLE_TAILWIND: true
  ENABLE_PLAYWRIGHT: true
compatibility:
  node: ">=20"
  next: ">=15"
  react: ">=19"
---

# Purpose
Provide a clean, server-first Next.js foundation with TypeScript strict, predictable structure, and testable patterns. Keep vendor choices minimal and documented via ADRs.

# Targets
- Next.js 15 • React 19 • Node 20+

# Opinionated Defaults
- App Router (Next.js 15); server-first rendering; client components only where needed
- TypeScript strict; ESLint `next/core-web-vitals`; Prettier
- Zod for boundary validation; simple forms patterns
- Optional Tailwind; reset styles minimal
- Testing: Vitest (unit), React Testing Library (components), Playwright (e2e)
- MSW for network mocking

# Directory Structure (Recommended)
- `app/` routes, layouts, metadata
- `components/` UI components (feature-scoped when possible)
- `lib/` utilities, adapters, providers
- `styles/` CSS (Tailwind optional)
- `tests/unit/` (vitest + RTL)
- `tests/e2e/` (playwright)

# Config & Scripts (Overview)
- `tsconfig.json`: baseUrl=".", paths `@/*` → `src/*` (or root)
- `eslint`: extends `next/core-web-vitals`, project rules
- `next.config.ts`: minimal; Server Actions enabled where appropriate
- `vitest.config.ts`, `playwright.config.ts` if enabled

# Patterns & Examples
- Server Actions with schema validation (React 19 + Next 15)
- Data fetching with explicit cache semantics
- Component testing with RTL
- E2E route smoke test with Playwright

# Testing Guidance
- Unit: Vitest for pure logic; RTL for components
- E2E: Lightweight Playwright flows; mark slow tests separately
- Mocking: MSW for network boundaries; avoid deep mocks

# CI/CD Hooks
- Lint → Typecheck → Unit → E2E (optional) pipeline
- Cache node_modules and playwright browsers

# Security & Env
- `.env` for server-only secrets; never expose in client
- Document secrets in stack or ADRs; keep minimal surface

# ADRs & Decisions
- Record deviations (e.g., styling lib, data fetching mode) via ADR

# Upgrade Notes
- Track Next.js release notes; pin major rules in ESLint config

# Checks (Agent)
- Required dirs exist; configs lint; tests run
- No client-side secrets; server-first patterns respected

# Parameters
- `ENABLE_TAILWIND`: adds Tailwind config + base files
- `ENABLE_PLAYWRIGHT`: adds Playwright config + e2e example
