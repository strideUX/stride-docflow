---
schema: guide.v1
title: "Environment & Secrets"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Environment & Secrets

Required Environment Variables

List required variables here. Packs may extend this section with stack-specific variables.

Secret Management

Local: .env.local (never committed)
CI/CD: provider secrets manager
Production: managed secret store; strict RBAC

Config Strategy

Prefer environment variables for secrets and endpoints. Validate at startup; fail fast with clear errors.
