---
schema: worklist.v1
id: release-{{DATE}}-features
project: {{PROJECT_NAME}}
owner: {{OWNER}}
status: in_progress
statuses: [pending, in_progress, in_review, completed]
items:
  - id: F000
    title: Bootstrap {{PROJECT_SLUG}} scaffolding
    type: feature
    status: pending
    owner: {{OWNER}}
    priority: P0
---

# Current Release – Worklist

This is the living worklist. Keep items scoped, statused, and linked to ADRs/notes.

## Columns
- id | type | title | status | owner | priority

## Guidance
- Status flow: pending → in_progress → in_review → completed
- Link ADRs in item body and/or `links` field.
