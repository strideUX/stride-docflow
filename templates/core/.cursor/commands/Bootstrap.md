# Bootstrap – Initialize or Sync Docflow (Project‑Agnostic)

## Purpose
Set up or synchronize the Docflow documentation system in any repository. Works for:
- Blank/new projects (create the full `docflow/` structure and scaffolds)
- Existing codebases without Docflow (analyze code, generate initial docs, and propose a starting backlog)

## Usage
- `/df-bootstrap` – run in chat and follow the interactive prompts

## Modes (auto‑detected)
1) Blank directory (no `docflow/`, no app sources)
   - Generate complete `docflow/` structure and minimal scaffolds
   - Interview to fill Specs, Architecture, Design, and Release basics
2) Existing codebase without `docflow/`
   - Analyze repo to infer stack, domains, and entrypoints
   - Generate `docflow/` with drafts based on findings
   - Interview to confirm/adjust, then outline the initial release/features
3) Docflow present
   - Offer to sync/repair structure, then continue with `/df-start`

## What It Creates (Blank or Missing)
- `docflow/project/`
  - `specs.md` – product goals, users, problem/solution
  - `architecture.md` – high‑level components, data model (if known), integrations
  - `design.md` – conversation/UX stages, UI components, accessibility baseline
  - `stack.md` – coding standards and guidelines; framework‑agnostic
- `docflow/iterations/current/`
  - `index.md` – goals, outcomes, acceptance criteria, router
  - `features.md` – initial worklist
- `docflow/active/`
  - `focus.md` – current item + next steps
  - `session.md` – handoff notes
- `docflow/backlog/features.md` – future ideas
- `docflow/decisions/README.md` – ADR index
- `docflow/templates/` – item.md + adr.md
- `docflow/notes/YYYY-MM-DD.md` – session notes (created on first note)
- `docflow/inbox/` – quick capture

## Interview (Blank Project)
- Project name, purpose, audience, and primary goals
- Problems to solve and constraints (timeline, budget signals, compliance)
- Out‑of‑scope (for now)
- Success criteria (quant + qual)
- Initial feature list (3–7)
- Risks/unknowns and decisions to defer

## Analysis (Existing Codebase)
- Detect package manager, languages, frameworks (e.g., TS/JS, Node/React/Native)
- Identify entry points, app dirs (e.g., `src/app`, `app`, `index`), and domain folders
- Readme/Docs to extract stated goals/constraints
- Infer initial features from routes/modules and open TODOs
- Summarize current architecture and conventions observed

## Process
1) Detect mode and confirm with you
2) Show plan: files to create/update
3) For Blank: create scaffolds → run interview → populate drafts
4) For Existing: analyze repo → generate drafts → confirm and refine
5) Create initial iteration (Setup/Scaffolding as F000) and set active focus
6) Summarize next steps and offer `/df-start` or `/df-focus F000`

## Safety & Idempotence
- Never overwrite existing files without confirmation
- Create missing folders/files only
- No git commands or destructive actions

## Response Format
"🧭 Docflow Bootstrap
- Mode: <Blank | Existing | Present>
- Actions: [list of files to create/update]
- Questions: [first 3 interview prompts]
Reply with answers or 'skip' to accept defaults."
