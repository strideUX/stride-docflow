# Docflow — Project Workflow Template

Docflow is a lightweight, project‑agnostic workflow you can duplicate and fill to kickstart or manage ongoing projects. It keeps scope, decisions, priorities, and daily activity organized without coupling to any specific tech stack.

## Quick Start

- Copy `docflow/` into your repo.
- Open `iterations/current/index.md` and set the iteration goal, outcomes, and acceptance criteria.
- Add 3–7 items to `iterations/current/features.md` (F000, F001…), set initial statuses.
- Set today’s `active/focus.md` with concrete next steps.
- Capture any key choices as ADRs under `decisions/` and update the index.
- Start a dated note in `notes/` for context and decisions.
- Work the plan; keep statuses and handoff (`active/session.md`) updated.

## Start Here

- Router: `docflow/iterations/current/index.md`
  - Links to the active focus, session handoff, worklist, backlog, and decisions.
  - Defines the current release goal, outcomes, and acceptance criteria.

## Daily Flow

1) Set Focus: `docflow/active/focus.md`
- Capture the single most important item (e.g., F000) and list concrete next steps.

2) Plan Work: `docflow/iterations/current/features.md`
- Track the worklist for the current iteration. Use the status flow: pending → in_progress → in_review → completed.
- Keep items small and reference templates where useful.

3) Execute & Update
- Update feature status as you work. Link to notes, ADRs, or specs/design as needed.

4) Record Decisions: `docflow/decisions/`
- For impactful choices, add an ADR using `docflow/templates/adr.md` and update the `README.md` index in that folder.

5) Capture Notes: `docflow/notes/`
- Add dated notes for milestones, context, and meeting outcomes. Keep entries concise and actionable.

6) Handoff Session: `docflow/active/session.md`
- Summarize what was accomplished, current state, next priorities, and blockers for continuity.

## Files & Folders

- `iterations/current/index.md`: Router and iteration scope (goal, outcomes, acceptance).
- `iterations/current/features.md`: Worklist for the active iteration; item IDs like F000, F001…
- `backlog/features.md`: Future ideas/deferred work; use the item template.
- `decisions/`: ADRs and index; each ADR is a small, link‑rich record.
- `templates/adr.md`: Quick ADR scaffold.
- `templates/item.md`: Standard work item scaffold (includes DoR/DoD checklists).
- `active/focus.md`: Today/now focus and immediate steps.
- `active/session.md`: Handoff summary for continuity between sessions.
- `project/specs.md`: Project specs (vision, scope, requirements, success criteria).
- `project/design.md`: UX flows and component patterns.
- `project/architecture.md`: System overview and principles (vendor‑neutral).
- `project/stack.md`: Stack standards/conventions (adjust per project).
 
- `notes/`: Dated notes for decisions, milestones, and context.

## Status & Conventions

- Status flow: pending → in_progress → in_review → completed.
- IDs: Prefix features with `F` (e.g., F000). Keep IDs stable and referenceable.
- DoR/DoD: Use the checklists in `templates/item.md` to make scope explicit and verify completion.
- Links: Prefer relative links to specs/design/architecture/ADRs/notes for traceability.

## How To Use For a New Project

1) Duplicate the `docflow/` folder into your repo.
2) Fill in `iterations/current/index.md` with the iteration goals and acceptance criteria.
3) Add or prune items in `iterations/current/features.md` and set your initial focus in `active/focus.md`.
4) Capture any notable initial choices as ADRs under `decisions/` and index them.
5) Keep `project/specs.md`, `project/design.md`, and `project/architecture.md` aligned as scope evolves.
6) Use `notes/` for dated context and `active/session.md` for handoffs.

## Operating Principles

- Project‑agnostic: keep docs vendor‑neutral; record tech picks in ADRs when needed.
- Small, verifiable steps: prefer incremental updates and clear acceptance criteria.
- Separation of concerns: specs ↔ design ↔ architecture ↔ implementation.
- Type and quality: define inputs/outputs and validation at boundaries in your codebase.
- Change management: keep the iteration router accurate; update ADRs and notes as decisions evolve.

Tip: Treat Docflow docs as living, high‑signal artifacts. Keep them concise, current, and linked to the work.
