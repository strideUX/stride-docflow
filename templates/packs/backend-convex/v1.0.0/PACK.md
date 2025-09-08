---
schema: pack.v1
id: backend-convex
version: 1.0.0
status: draft
title: Convex Backend – Functions and Data Modeling
description: Structured Convex setup with schema patterns, server functions, and testing guidance.
owner: {{OWNER}}
date: {{DATE}}
---

# Purpose
Provide consistent organization for Convex functions, schemas, and auth, with simple testing strategies.

# Opinionated Defaults
- `convex/` dir with `schema.ts`, `auth.ts`, function modules
- Data modeling patterns with indexes; explicit validation
- Access control in functions; keep client thin

# Directory Structure (Recommended)
- `convex/schema.ts` (schema + indexes)
- `convex/auth.ts` (auth helpers)
- `convex/<domain>.ts` (functions per domain)
- `tests/convex/` (server function tests)

# Patterns & Examples
- CRUD example with validation
- Auth-guarded function pattern

# Testing Guidance
- Unit test server functions; mock context where needed
- Avoid hitting real services in unit tests

# CI/CD Hooks
- Typecheck Convex; run server tests

# Security & Env
- Secrets in server env only; never leak to client

# ADRs & Decisions
- Data modeling choices; auth provider integration

# Upgrade Notes
- Follow Convex changelogs; update schema/index patterns

# Checks (Agent)
- schema.ts exists; functions use validation; no client secrets
# Compatibility
- Node: ">=20"
- React (for client apps): ">=19"

