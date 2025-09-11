# df:start — Session Kickoff

## Intent
Summarize current state; bootstrap iteration if missing; offer next actions.

## Read
- docflow/iterations/current/index.md (if missing → propose bootstrap)
- docflow/iterations/current/features.md
- docflow/active/focus.md
- docflow/active/session.md
- docflow/inbox/capture.md

## Propose (no writes)
- If no current iteration: ask for goal/outcomes; propose bootstrap.
- Show: iteration goals, top 3 P0 (unblocked), current focus, latest blockers, inbox count.
- Offer: Route inbox now; Update focus; Start spike; Start coding.

## On Confirmation (writes)
- If bootstrap: create `iterations/current/{index.md,features.md}` and `active/{focus.md,session.md}`.
- If focus chosen: set item → `in_progress`; write `active/focus.md`.

## Response
- Summary; paths touched; next 1–3 actions.