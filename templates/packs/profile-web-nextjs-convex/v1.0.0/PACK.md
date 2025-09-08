---
schema: pack.v1
id: profile-web-nextjs-convex
version: 1.0.0
status: draft
title: Profile – Web (Next.js + Convex)
description: Convenience bundle composing frontend-nextjs, backend-convex, qa-web, ci-github.
owner: {{OWNER}}
date: {{DATE}}
depends_on:
  - frontend-nextjs@1.0.0
  - backend-convex@1.0.0
  - qa-web@1.0.0
  - ci-github@1.0.0
params:
  ENABLE_TAILWIND: true
  ENABLE_PLAYWRIGHT: true
---

# Purpose
One-command setup for the common web baseline you use most.

# Included Packs
- frontend-nextjs (App Router, TS strict)
- backend-convex (functions + schema)
- qa-web (Vitest, RTL, Playwright)
- ci-github (Actions)

# Overrides & Parameters
- Enable Tailwind and Playwright by default (toggleable)

# Notes
- Consider an ADR for auth provider selection and data modeling choices

