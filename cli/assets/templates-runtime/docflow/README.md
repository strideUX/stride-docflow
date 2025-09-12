---
schema: guide.v1
id: docflow-system-guide
project: {{PROJECT_NAME}}
owner: {{OWNER}}
version: 1
---

# Docflow System Guide

A lightweight, doc-driven workflow that’s both agent-ready and human-friendly. Designed to balance minimal friction with predictable structure, so humans and agents can work together smoothly.

## Purpose & Goals

- Purpose: Provide a repeatable, lightweight system for capturing, planning, and tracking work with docs as the source of truth.
- Goals:
  - Fast capture, clear routing, small docs
  - Consistent schemas and predictable paths
  - Agent-ready (stable IDs, shallow indexes, linkable references)
  - Scalable context (promote detail into leaf docs only when needed)
- Iterations: Variable-length, outcome-based, with a live worklist and archived snapshots.
- Balance: Keep indexes shallow and leaf docs small; promote detail only when it adds value.

## Repository Layout

docflow/
├─ active/         # live focus + session
├─ iterations/     # current iteration + archives (iterations/01, 02, …)
├─ backlog/        # index of future ideas
├─ items/          # promoted feature/chore items
├─ bugs/           # promoted bug reports
├─ spikes/         # timeboxed explorations
├─ notes/          # dated notes
├─ decisions/      # ADRs + index
├─ inbox/          # quick-capture queue
├─ templates/      # skeletons for item, bug, spike, ADR
├─ agents/         # agent contracts and checks (rules + audits)
AGENTS.md          # coding/documentation conventions

## Naming & IDs

- Features/Chores: F###, C###
- Bugs: B###
- Spikes: S###
- Notes (daily file): notes/YYYY-MM-DD.md
- ADRs: ADR-YYYY-MM-DD-NN-slug
- File naming (promoted): items/F123-reset-api-key.md
- Iterations:
  - Current: iterations/current/
  - Archives: iterations/01/, iterations/02/, … (zero-padded numbering)

## Status, Priority, Complexity

- Status flow: pending → in_progress → in_review → completed
- Priority: P0 | P1 | P2
- Complexity: XS | S | M | L | XL (no time estimates)
- Dependencies: optional array of IDs that can block progress (F/C/B/S)

## Token System

Tokens render in both filenames and contents:

- {{PROJECT_NAME}}, {{PROJECT_SLUG}}, {{OWNER}}, {{YEAR}}, {{DATE}}, {{ITER_NUM}}, {{ID}}, {{SLUG}}, {{NN}}

## Schemas (Front-Matter)

- Common fields: schema, id, title, type, status, owner, links, dependencies, date
- focus.v1: daily intent; top 3 outcomes; links to worklist/session
- session.v1: handoff; accomplished/current/next/blockers
- worklist.v1: iteration worklist; id|type|title|status|owner|priority|complexity|dependencies
- iteration.index.v1: iteration overview; goal, outcomes, acceptance criteria; router links
- backlog.v1: backlog index and metadata; optional inline items
- item.v1: feature/chore item; acceptance criteria, DoR/DoD, plan
- bug.v1: bug item; severity, repro steps, expected/actual, suspected area
- spike.v1: spike item; question, state (pending|in_progress|concluded), findings, recommendations, follow-ups
- note.v1: dated note; short, link-heavy
- adr.v1: decision with status and references
- adr.index.v1: ADR catalog
- guide.v1: team + agent conventions

## Core Documents

- active/focus.md (focus.v1): today’s top outcomes
- active/session.md (session.v1): rolling handoff, blockers, continuity
- iterations/current/index.md (iteration.index.v1): iteration goal, router, outcomes
- iterations/current/features.md (worklist.v1): source of truth for work status
- backlog/features.md (backlog.v1): parking lot; promote when ready
- decisions/README.md (adr.index.v1): ADR index
- templates/*.md: canonical skeletons (items, bugs, spikes, ADRs)
- agents/{contract.md, checks.yaml}: agent rules and checks (for automation)
- packs/README.md: available stacks and profiles to choose from
- project/packs.yaml: selected packs and versions (managed by CLI)
- AGENTS.md (guide.v1): coding standards, documentation rules, ADR conventions

## Workflow

### Capture
- Quick note → inbox/capture.md
- Minimal inline entry → iterations/current/features.md

### Classify & Route
- Feature/Chore: add to worklist; promote if it grows
- Bug: create bugs/B###-slug.md or inline if trivial
- Spike: spikes/S###-slug.md; must end with findings + follow-ups (no enforced timebox)
- Decision: draft ADR in decisions/
- Note: notes/YYYY-MM-DD.md for context

### Plan & Execute
- Keep worklist small and current; statuses flow through canonical vocab
- Track dependencies: dependencies: [B012, F034]
- Use focus.md for priorities, session.md for continuity

### Handoff & Update
- End of block → update session.md
- Next day → update focus.md

### Iterations
- Archive: move iterations/current/ → iterations/{{ITER_NUM}}/
- Reset iterations/current/ with fresh index + empty worklist

## Promotion Rules

- Start inline in worklist/backlog
- Promote to per-file when:
  - Description > ~80–120 lines
  - Rich context needed (design, plan, references)
  - Multiple contributors/agents coordinating
- Add promoted: true and file: items/F###-slug.md back into the worklist entry

## Progress & Reporting

- Worklist front-matter: summary counts by status + priority
- Where are we?:
  - iterations/current/index.md → goals/outcomes
  - iterations/current/features.md → status
  - active/focus.md → today’s priorities
  - active/session.md → blockers
- What’s next?: top pending/in_progress P0 items without blockers

## Routing Rules (Agent-Aware)

- Reversible tradeoff: ADR candidate (as decision gate via links)
- User-impacting defect: Bug
- Scoped deliverable: Feature
- Maintenance/infra: Chore
- Unknown/learning: Spike (state required; follow-ups required when concluded)
- Ambient context: Note
- Quick capture: Inbox

## Backlog Strategy

- Keep backlog/features.md light; promote near execution
- An item lives in backlog or the current worklist, not both

## Context Window Strategy

- Keep indexes tiny: router + pointers + counts
- Push detail to leaf docs (items, bugs, spikes, ADRs, notes)
- Use links + dependencies for agent navigation without heavy context loads
## Pack Flow

- Select packs or a profile (frontend, backend, QA, CI) during initialization.
- The CLI writes selections to `project/packs.yaml` and mirrors them in `project/stack.md` under “Selected Packs”.
- Scaffold files from each selected pack’s `files/` directory; optional files controlled by pack params.
- Use `checks.yaml` from each pack to audit setup; agents propose fixes when mismatches are detected.
- On upgrades, update `project/packs.yaml`, scaffold changes with review, and log an ADR if significant.

