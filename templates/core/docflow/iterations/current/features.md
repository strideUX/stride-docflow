---
schema: worklist.v1
id: iteration-{{ITER_NUM}}-features
project: {{PROJECT_NAME}}
owner: {{OWNER}}
status: in_progress
statuses: [pending, in_progress, in_review, completed]
summary:
  total: 0
  pending: 0
  in_progress: 0
  in_review: 0
  completed: 0
  p0: 0
items: []
---

# Current Iteration – Worklist

This is the living worklist. Keep items scoped, statused, and linked to ADRs/notes.

## Columns
- id | type | title | status | owner | priority | complexity | dependencies | promoted? | file?

## Guidance
- Status flow: pending → in_progress → in_review → completed
- Link ADRs in item body and/or `links` field.
