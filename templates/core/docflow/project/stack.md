---
schema: stack.v1
id: stack
project: {{PROJECT_NAME}}
owner: {{OWNER}}
date: {{DATE}}
---

# Stack & Standards

This document defines project-specific technology choices and standards. Keep it concise and reference the selected packs and their versions.

## Selected Packs (managed by CLI)

- Frontend: <pack-id>@<version>
- Backend: <pack-id>@<version>
- QA: <pack-id>@<version>
- CI: <pack-id>@<version>
- Profile (optional): <profile-id>@<version>

Notes:
- The CLI will populate this section on init/update; keep deviations documented below.

## Deviations & Overrides

- Describe any deviations from pack defaults. Link ADRs for significant changes.

## Open Decisions

- Track unanswered technology choices here until resolved via ADR.

## Platforms & Core Libraries (choose per project)

- Web framework: e.g., Next.js / Remix / SvelteKit
  - Prefer server‑first rendering and progressive streaming where possible.
  - Colocate server endpoints with features; keep client/server boundaries explicit.
- Validation: Zod (or similar) for runtime schemas at boundaries.
- State/data: lightweight client state; server as source of truth.
- Styles: Tailwind CSS or a consistent alternative; avoid ad‑hoc style drift.

## Project Structure (example)

Prefer a `src/` root to keep the repository tidy and support absolute imports.

- `src/app/` routes and layouts (or equivalent)
- `src/components/` UI components (feature and UI subfolders)
- `src/hooks/` custom hooks
- `src/lib/` utilities, adapters, providers
- `src/types/` shared types per domain
- `src/styles/` global styles
- `server/` backend code (if separate), or feature‑scoped `api/` routes

Absolute imports & alias:
- Configure `tsconfig.json` with `baseUrl: "."` and `paths` for `@/*` → `src/*`.

## Conventions

- TypeScript strict: enabled; explicit types on public exports
- Exports: prefer named exports for shared modules
- Errors: never swallow; return helpful messages; log to server
- Env vars: read only on server; never expose secrets to the client
- Data fetching: be explicit about cache semantics

Naming conventions:
- Files: kebab-case (e.g., `user-profile.tsx`, `use-auth-state.ts`)
- Components/classes/types/enums: PascalCase; hooks: `use` + camelCase; constants/env vars: UPPER_SNAKE_CASE

Component rules:
- Single responsibility; well‑typed props; avoid inline styles
- Loading/error states; memoize expensive ops; cleanup effects
- Event handlers prefixed with `handle` and stable when needed

Hook rules:
- Prefix with `use`; stable return values; proper deps; validate inputs

## Type Safety

- No `any`; use `unknown` with proper narrowing
- Fully type params/returns; publish types from `src/types/*`
- Prefer `interface` for objects; `type` for unions/primitives
- Provide type guards where helpful

## Security

- Authorize sensitive operations; validate all inputs server‑side
- Keep secrets on the server; rate limit sensitive endpoints

## Accessibility

- Keyboard navigation, visible focus, ARIA roles/labels

## Testing

- Unit tests co‑located with code; simple end‑to‑end for happy paths

## Performance Targets (example)

- P95 critical interaction latency within defined threshold
- Keep client JS minimal by default

## Example Patterns (illustrative)

Runtime tool with schema validation:

```ts
import { z } from 'zod';

export const extractSchema = z.object({ input: z.string() });
export type ExtractInput = z.infer<typeof extractSchema>;

export async function extract({ input }: ExtractInput) {
  // implement business logic
  return { summary: input.slice(0, 100) };
}
```

Prompt asset location (drafts before implementation):
- Capture early prompt drafts in `docflow/notes/YYYY-MM-DD.md`.
- When implementing, colocate prompts with code (e.g., `src/lib/ai/prompts.ts`). Capture notable changes via daily notes or an ADR.
