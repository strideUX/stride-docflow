---
schema: guide.v1
title: "Architecture"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Architecture

System Diagram (conceptual)

Outline boundaries and data flow. Keep this section brief; link to ADRs when making durable decisions.

Domain Model

List core entities and relationships; avoid over-detailing. Promote to ADR when structure changes.

Operational Concerns

Observability: logging/metrics/tracing overview
Deployment: target environments, rollout strategy
Backups/Recovery: scope and frequency
Feature Flags: where they live and how to use them
