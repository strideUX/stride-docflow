# df:iterate — Bootstrap / Archive Iteration

## Bootstrap
- If `iterations/current/` is missing, create:
  - `iterations/current/index.md` (goal/outcomes/acceptance)
  - `iterations/current/features.md` (empty `items: []`)
  - `active/focus.md`, `active/session.md`

## Archive
- Move `iterations/current/` → `iterations/NN/` (zero-padded).
- Create fresh `iterations/current/` as in Bootstrap.
- Copy forward unresolved items if requested (reset to `pending`).

## Response
- Summary; paths touched; next steps.