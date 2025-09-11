# df:accept — Acceptance Flow ("this is done")

## Intent
Move an item to in_review or completed, sync files, propose next focus.

## Input
- ID; or infer from current focus.

## Logic
- If item is `in_progress`, ask: move to `in_review` or `completed`?
- Update worklist status accordingly.
- Sync per-item file (worklist is source of truth).
- Append a handoff line to `active/session.md`.
- If the completed item was the active focus, clear/update `active/focus.md`.
- Propose next best unblocked P0 and ask to focus it.

## Spike Extras
- If the item is a spike and you say “conclude”, set `state: concluded`.
- Offer to create follow-up features/chores or an ADR.

## Response
- Summary; paths touched; next suggested action.