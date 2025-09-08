---
schema: rules.v1
id: agent-contract
version: 1
owner: {{OWNER}}
---

# Docflow Agent Contract

## Invariants
- Exactly one iterations/current/; archives are zero-padded (iterations/01, 02, …).
- Index docs stay small; leaf docs hold detail.
- Items exist in either backlog or current worklist, not both.
- Status flow is only: pending → in_progress → in_review → completed.
- Dependencies contain only existing F/C/B/S IDs; ADRs are decision gates via links.
- Spikes with state: concluded must include findings, recommendation, and non-empty follow_ups.
- Worklist summary matches computed counts from items.
- Iteration index contains router links to focus, session, worklist, backlog, decisions, inbox.
- Inbox triaged at least daily (no stale entries beyond a reasonable window).

## Routing Rules
- Tradeoff or architecture choice → propose ADR (link from item, not as dependency).
- Defect impacting users → Bug (bug.v1).
- Scoped deliverable → Feature (item.v1).
- Maintenance/infra → Chore (item.v1, type: chore).
- Unknown/learning → Spike (spike.v1; state required; follow_ups upon conclusion).
- Ambient context → Note (note.v1 in daily file).

## Cadence
- Daily: triage inbox, update focus.md, update session.md.
- Iteration close: archive current to iterations/{{ITER_NUM}}/, refresh current.

