---
schema: guide.v1
title: "Environment & Secrets"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Environment & Secrets

Centralize what must exist to run {{PROJECT_NAME}} across environments.

## Required Environment Variables
Document all variables needed to boot the system. Packs may extend this section.
```txt
# Example
APP_BASE_URL=
LOG_LEVEL=info
```
Secret Management
- Local: .env.local (never committed)
- CI/CD: provider secrets manager
- Production: managed secret store with RBAC and rotation policy

Configuration Strategy
- Prefer env vars for secrets and endpoints
- Validate on startup and fail fast with clear error messages
- Keep NEXT_PUBLIC_ (or equivalents) limited to truly public config

Migration & Rotation
- How to rotate keys without downtime
- How to add/remove variables safely

