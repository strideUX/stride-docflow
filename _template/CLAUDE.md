# Claude Repo Guide

## Important Reminders

- Never run git commands unless explicitly asked.
- Keep changes tightly scoped; do not modify or remove unrelated code.
- Do not break existing behavior without clear intention and justification.

## Operating Model

- Start with the project’s primary documentation to understand scope and current priorities.
- If using Docflow: start at `docflow/releases/current/index.md`.
- If a project provides an explicit workflow (e.g., Docflow or similar), follow it and keep session/focus and status docs up to date.
- Prefer incremental, verifiable steps; communicate next actions clearly.

## General Principles

- TypeScript always: strict mode, full typing, no any (use unknown with proper narrowing).
- Prefer native primitives over custom abstractions unless a clear benefit exists.
- Separation of concerns: keep data, logic, and view distinct and composable.
- Simple over clever; readability and maintainability first.
- Be explicit and default to immutability.
- Reuse proven patterns; don’t rebuild what already exists.
- Prioritize developer ergonomics and clarity over micro-optimizations.

## Documentation Integration

- Reference project documentation when making architectural or implementation decisions.
- Update documentation when establishing or changing patterns (and record decisions where the project expects them, e.g., ADRs or notes).
- Align implementation with documented requirements and acceptance criteria.

## UI Consistency

- Pattern‑first: analyze 2–3 existing, similar screens before creating new ones.
- Copy and adapt proven layout structures; do not invent new layouts without need.
- Use the established design system/components consistently; avoid mixing libraries.
- Maintain consistency in spacing, typography, color, and interaction patterns.
- Follow existing routing and navigation patterns.
- Red flags (stop and confirm): creating custom layouts when similar exist, introducing a new component library, inventing new styling patterns, adding complex nested
routes without precedent, changing working patterns without instruction.

## Structure & Style

- Use English in code, comments, and documentation.
- Organize by feature; co‑locate files close to usage; avoid overly deep shared trees.
- Prefer absolute imports; if an alias system is not present, discuss before adding.
- Exports: prefer named exports; if using default exports, only one per file.
- Always use semicolons and consistent formatting (follow the project’s lint/format rules).

## TypeScript & React Best Practices

- Declare types for variables, function parameters/returns, component props/state.
- Avoid any; use unknown and refine via type guards or schema validation.
- Use interfaces for objects; types for unions/primitives.
- Validate inputs at boundaries (e.g., forms, network, storage) with a schema validator.
- Components:
    - Single responsibility; well‑defined props; avoid inline styles where a system exists.
    - Handle loading/error states; memoize expensive computation; clean up effects.
    - Event handlers prefixed with handle and stable with useCallback where necessary.
- Hooks:
    - Prefix with use; return stable references; correct dependency arrays.
    - Validate inputs and document behavior; avoid unnecessary state.

## Naming Conventions

- Files/directories: kebab-case (e.g., user-profile.tsx, use-auth-state.ts).
- Components/classes/types/enums: PascalCase.
- Variables/functions/hooks: camelCase (hooks start with use).
- Env vars/constants: UPPER_SNAKE_CASE.
- Avoid magic values; extract to constants, enums, or configuration.

## Functions & Logic

- One function per purpose; keep units small and testable.
- Name functions that encapsulate complex logic, recursion, or public APIs.
- Prefer default parameter values over null/undefined branching.
- Be explicit with side effects; centralize where appropriate.
- Fail fast with helpful errors; avoid silent failures.

## Tooling & Editor Expectations

- Use fast search and scoped reads; avoid dumping large files in one response.
- Do not “clean up” or reformat unrelated files as part of a focused change.
- Fix scoped issues proactively but never remove or refactor functioning code outside the task’s scope without approval.

## Testing & Validation

- Validate the smallest scope first (units you touched), then broaden as appropriate.
- Follow the project’s testing setup; do not introduce new frameworks unless asked.
- Favor lightweight tests that prove behavior of changed code paths.

## Accessibility & Internationalization

- Ensure keyboard navigation, visible focus, and appropriate ARIA roles/labels.
- Be mindful of text alternatives and content order.
- Keep i18n readiness in mind when projects require it (e.g., avoid hardcoded strings).

## Security & Privacy

- Never commit secrets; keep sensitive data out of client code and logs.
- Collect only minimal PII required by the task; sanitize/guard inputs and outputs.

## Change Management

- Make small, focused patches; communicate intent and next steps.
- Record decisions and rationale where the project expects them (notes/ADRs).
- Keep the project’s work tracker or status document updated as you progress.

## Process Quickstart

- Understand: read the project’s primary doc to identify active priorities.
- Focus: set or confirm the active task and its acceptance criteria.
- Execute: implement in small steps; validate frequently; keep notes current.
- Wrap: summarize progress, update status, document next steps and blockers.

## Conflict Resolution

- If any rule here conflicts with project‑specific standards, defer to the project’s standards and document your rationale in the project’s notes/decision log.
