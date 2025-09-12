# df:review — Classification Sweep

## Intent
Route inbox bullets into backlog/worklist/spikes, one by one.

## Read
- docflow/inbox/capture.md

## Loop
For each bullet in “New”:
- Propose route: backlog | worklist (feature|chore|bug|spike) | new spike (file + worklist).
- On approval:
  - Allocate ID (F/C/B/S).
  - Append entry to backlog/features.md or iterations/current/features.md.
  - If spike: create spikes/S###-slug.md and set promoted: true and file: <path> on the entry.
  - Remove the bullet from inbox.

## Response
- Summary of routed items; paths touched; next 1–3 actions.

