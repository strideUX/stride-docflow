# Docflow Constitution (Tool-Agnostic)

## Invariants
- Worklist is source of truth; per-item files mirror it.
- Items live in backlog or current worklist, not both.
- Status machine: pending → in_progress → in_review → completed (safe backsteps only).
- Spike state: pending ↔ in_progress ↔ concluded; follow-ups/ADR upon conclusion when relevant.
- IDs: F###, C###, B###, S###; never reused.
- Iterations: exactly one `iterations/current/`; archives in `iterations/NN/`.
- Inbox bullets are removed after routing.
- ADRs: supersede; never rewrite history.
- Notes/day files are append-only.

## Allowed Operations
- Discover, Capture, Route, Plan, Focus, Promote, Decide, Handoff, Iterate (see runtime rules).
- Conflict resolution: sync per-item files to the worklist if they diverge.

## Responsibilities
- Human: iteration goals/outcomes; classification; acceptance; iteration boundaries; ADR approval.
- Agent/IDE: enforce invariants; propose next steps; perform mechanical edits; summarize state.

## Response Contract
Always return: short summary, paths touched, next 1–3 actions; or clear failure with next step.