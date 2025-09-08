---
schema: pack.v1
id: backend-supabase
version: 1.0.0
status: draft
title: Supabase Backend – SQL + RLS
description: Opinionated Supabase setup with migrations, RLS patterns, and typed client usage.
owner: {{OWNER}}
date: {{DATE}}
targets:
  node: 20+
  react: 19
---

# Purpose
Provide safe defaults for schema migrations, RLS, and typed queries using the Supabase client.

# Opinionated Defaults
- `supabase/` migrations; RLS-first mindset
- Typed client; service-role only on server
- Edge functions optional via ADR

# Directory Structure (Recommended)
- `supabase/migrations/` SQL files
- `supabase/policies/` RLS examples
- `src/lib/supabase.ts` client factory (server/client variants)
- `tests/db/` integration tests (optional)

# Patterns & Examples
- Table and policy templates; row-level security patterns
- Auth flow notes

# Testing Guidance
- Prefer migration tests in CI; simple query integration tests

# CI/CD Hooks
- Run migrations in CI against ephemeral DB; seed minimal data

# Security & Env
- Keys kept server-side; RLS enforced; no admin keys in client

# ADRs & Decisions
- Table design conventions; RLS strategy

# Upgrade Notes
- Track breaking changes in Postgres extensions and client SDK

# Checks (Agent)
- Migrations present; policies applied; client not used with admin keys client-side
# Compatibility
- Node: ">=20"
- React (for client apps): ">=19" (if applicable)
