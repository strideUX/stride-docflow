---
schema: architecture.v1
id: architecture
project: {{PROJECT_NAME}}
owner: {{OWNER}}
date: {{DATE}}
---

# Architecture Overview

Describe the system at a high level and how it delivers the product’s core value. Keep this document vendor‑neutral and link to ADRs for technology choices.

## Architectural Principles

- Scope clarity and single responsibility for services/components
- Deterministic side effects and minimal magic
- Validate inputs at boundaries; fail fast with helpful errors
- Least privilege for data access; secrets never leave the server
- Observability by default (events, logs, metrics, traces)

## High‑Level Components

- Client/UI
  - Primary user interface and interaction patterns
  - Streaming/progressive UI where appropriate
- Application Runtime
  - Orchestration of business logic and workflows
  - Tool/function calling with schema‑validated inputs/outputs
- Data & Persistence
  - Domain schema and indexes for common access patterns
  - Read/write segregation where it adds clarity
- Integrations (optional)
  - Notifications, scheduling, email, analytics, etc.

## Example Data Model (illustrative)

- entities: { id, type, attributes, createdAt }
- events: { id, entityId, type, payload, createdAt }
- users: { id, email, name, createdAt }

Adapt to your domain; add indexes for frequent filters/sorts.

## Workflow Stages (example)

start → collect → summarize → confirm → act → complete

State transitions should be handled by explicit, testable logic. Persist key decisions and state changes as events for auditing.

## Server‑Side Tools/Functions (example)

- classify(input) → { category }
- extract(data) → { structured }
- score(structured) → { score, tags[] }
- persist(record) → { id }
- notify(target, payload) → { delivered: boolean }

All tools run server‑side; the client never holds secrets or performs privileged actions.

## Security & Privacy

- Collect only minimal required PII
- Consent for data collection where applicable
- Rate limiting and abuse protection on sensitive endpoints
- Secrets via environment variables; rotate and scope appropriately

## Deployment

- Describe environments (dev/staging/prod) and deployment targets
- Document runtime constraints (edge vs node, container vs serverless)

## Environment Variables (example)

- PROVIDER_API_KEY
- DATABASE_URL
- NOTIFY_WEBHOOK_URL
- FEATURE_FLAGS

## Observability

- Emit events for key milestones
- Capture error and performance telemetry

## Sequence (Typical Turn)

1) User action → request hits application runtime
2) Runtime validates input → selects and executes tool/function
3) Tool result informs next step → response streamed or returned
4) Persist changes/events → update state and logs

---

Keep this document aligned with actual implementation. Link to ADRs when introducing significant architectural changes.
