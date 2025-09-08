---
schema: guide.v1
title: "Performance & Security"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Performance & Security

Performance
 • RSC-first; keep client components minimal
 • Cache safely; otherwise rely on Convex query performance
 • Lazy-load expensive components and analytics

Security
 • Validate inputs with zod; never trust client data
 • Secrets server-only; use managed secret stores
 • CSP, HTTPS, and secure cookies in production
