---
schema: guide.v1
title: "Architecture"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Architecture

Keep this document short. Durable choices go into ADRs; diagrams/POCs live in feature docs.

## System Diagram (Conceptual)
Describe boundaries, data flow, and external systems in a few bullets. Link to a diagram if available.

## Domain Model
List core entities and their key relationships. Avoid implementation detail; promote to ADRs if structure changes.

## Operational Concerns
- **Observability**: logs, metrics, tracing; which tools and minimum signals
- **Deployment**: environments, rollout strategy, IaC pointers (if any)
- **Backups/Recovery**: scope, frequency, and restore testing cadence
- **Feature Flags**: where flags live and the safe-rollout policy

## Performance Budgets
- **Web**: target TTFB/LCP/CLS, largest page(s) size budget
- **API**: p95 latency, throughput expectations

## Security & Privacy
List the primary trust boundaries and sensitive data classes. Link to ADRs and security docs for details.

## Stack Standards
For implementation standards and patterns, see the applicable pack docs:
- `templates/packs/nextjs-convex/docs/standards.md`
- `templates/packs/nextjs-convex/docs/convex-patterns.md`
- `templates/packs/nextjs-convex/docs/folder-structure.md`
- `templates/packs/nextjs-convex/docs/perf-security.md`

If a different stack is used, replace these links with the relevant pack and keep this section.

