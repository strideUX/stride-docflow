# df:promote — Promote Item to Per-File Doc

## Intent
Create per-file doc and wire it back to the worklist.

## Input
- ID (F/C/B/S) and optional slug.

## Write
- Create docflow/items|bugs|spikes/<ID>-<slug>.md from the appropriate template.
- Update the worklist/backlog entry with promoted: true and file: <relative path>.

## Response
- Summary; paths touched; next steps.

