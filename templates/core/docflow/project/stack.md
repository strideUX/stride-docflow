---
schema: stack.v1
id: stack
project: {{PROJECT_NAME}}
owner: {{OWNER}}
date: {{DATE}}
---

# Stack & Standards

This document declares the selected packs (framework choices) and the project’s standards. It links to pack standards and records any deviations or decisions.

## Selected Packs (managed by CLI)

- Profile: profile-web-nextjs-convex@1.0.0
- Frontend: frontend-nextjs@1.0.0
- Backend: backend-convex@1.0.0
- QA: qa-web@1.0.0
- CI: ci-github@1.0.0

Source of truth: see `docflow/project/packs.yaml`. Update via CLI; record major changes in an ADR.

## Framework Standards

- Next.js (frontend-nextjs): see pack guides under `templates/packs/frontend-nextjs/v1.0.0/guides/`.
  - When scaffolded by CLI, these are copied to `docflow/project/stack/frontend-nextjs/guides/`.
- Convex (backend-convex): `templates/packs/backend-convex/v1.0.0/guides/`.
- QA (qa-web): `templates/packs/qa-web/v1.0.0/guides/`.
- CI (ci-github): `templates/packs/ci-github/v1.0.0/guides/`.

Examples live in each pack’s `examples/` folder and are copied alongside guides.

## Architecture Principles

- Server-first (web); client for interactivity only.
- Clear boundaries: UI ↔ Actions ↔ Data ↔ Domain.
- Validate inputs at boundaries (Zod or equivalent).
- Deterministic side effects; explicit cache semantics.

## Conventions

- TypeScript strict; named exports for shared modules.
- Kebab-case files; `@/*` → `src/*` alias.
- Never expose secrets to client bundles.

## Security & Auth

- Web: session cookies `httpOnly`, `secure`, `sameSite=strict`; protect routes via middleware.
- Mobile: keep secrets server-side; use secure storage sparingly; validate deep links.
- Record provider-specific choices via ADRs.

## Testing Strategy

- Web: Vitest + RTL; Playwright for key journeys; MSW for network.
- Mobile: Jest + RN Testing Library; Detox optional.
- Coverage targets defined in QA pack configs.

## CI & Quality

- GitHub Actions: lint, typecheck, unit, e2e; fast caches.
- PR template: link items/ADRs; enforce DoR/DoD discipline.

## Deviations & Overrides

- Note deviations from pack defaults here; link to ADRs for significant changes.

## Open Decisions

- Track technology choices to resolve; promote to ADR when decided.

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
