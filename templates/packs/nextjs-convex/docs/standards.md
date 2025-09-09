---
schema: guide.v1
title: "Next.js + Convex Architecture Standards"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Next.js + Convex Architecture Standards
Reusable standards for all Next.js/Convex projects.

## 1. Project Structure

### Required Directory Layout
```txt
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   ├── (dashboard)/              # Dashboard route group
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI primitives
│   ├── forms/                    # Form components
│   ├── layouts/                  # Layout wrappers
│   └── features/                 # Feature-specific components
├── hooks/                        # Custom hooks
├── lib/                          # Utilities, constants, validators
├── types/                        # TypeScript definitions
├── providers/                    # Context providers
└── styles/                       # CSS modules/tokens

convex/
├── _generated/                   # Generated (do not edit)
├── schema.ts                     # Database schema (source of truth)
├── auth.ts                       # Auth helpers (optional)
├── lib/                          # Shared backend logic
└── domains/                      # Domain-oriented functions
```

2. Naming Conventions

Files & Folders
	•	Components: kebab-case.tsx (e.g., user-profile.tsx)
	•	Hooks: use-kebab-case.ts (e.g., use-auth-state.ts)
	•	Types: kebab-case.types.ts (e.g., user.types.ts)
	•	Utils: kebab-case.ts (e.g., date-helpers.ts)
	•	Routes: kebab-case/page.tsx

Code Entities
	•	Components: PascalCase (e.g., UserProfile)
	•	Hooks: camelCase with use prefix (e.g., useAuthState)
	•	Types/Interfaces: PascalCase (e.g., User, IUserData)
	•	Functions: camelCase (e.g., formatDate)
	•	Constants: UPPER_SNAKE_CASE (e.g., MAX_RETRIES)
	•	Enums: PascalCase (e.g., UserRole)

3. Component Architecture

Reference Template
```ts
/**
 * ComponentName - Brief description
 * @remarks Additional implementation notes
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: boolean;
  onAction?: (value: string) => void;
}

export function ComponentName({ requiredProp, optionalProp = false, onAction }: ComponentNameProps) {
  const [localState, setLocalState] = useState<string>('');
  const computed = useMemo(() => expensiveComputation(requiredProp), [requiredProp]);
  const handleClick = useCallback(() => onAction?.(localState), [localState, onAction]);
  useEffect(() => { return () => { /* cleanup */ } }, []);
  return <div className="component-wrapper">{/* JSX */}</div>;
}
```

Rules
	•	Single responsibility; small components.
	•	Always define typed props; no implicit any.
	•	No inline styles; use Tailwind/CSS modules.
	•	Event handlers prefixed with handle.
	•	Explicit loading/error states.
	•	Memoize expensive work; cleanup effects.

4. Type Safety

Standards
	•	No any; prefer unknown for dynamic input.
	•	Fully type parameters and returns.
	•	Interfaces for objects; types for unions/primitives.
	•	Provide type guards when runtime validation is needed.
	•	TSDoc on public APIs.

Example
```ts
export enum UserRole { Admin = 'admin', User = 'user', Guest = 'guest' }

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserInput = Pick<IUser, 'email' | 'name' | 'role'>;
export type UpdateUserInput = Partial<Omit<IUser, 'id' | 'createdAt'>>;

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

export function isUser(value: unknown): value is IUser {
  return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}
```

5. Convex Integration (high-level)
	•	convex/schema.ts is the data source of truth.
	•	Queries are read-only; Mutations write-only; Actions for third-party calls.
	•	Co-locate functions by domain in convex/domains/*.
	•	Index hot filters; validate uniqueness before inserts.

6. Hook Patterns
	•	Input validation; expose a stable API shape.
	•	Return { state, loading, error, actions } or similar stable object.
	•	Use useCallback/useMemo; cleanup effects.

7. State Management
	•	Use Context providers for global state; memoize values.
	•	Custom hooks must throw if used outside their provider.

8. Performance Standards (Next.js 15+)
	•	Partial Pre-rendering (PPR) where applicable.
	•	Streaming with Suspense for progressive loading.
	•	Server Actions for form-like mutations.
	•	Parallel data fetching with Promise.all.
	•	next/image with sizes/quality.
	•	Route segment config (runtime, revalidate, dynamic) per page.

9. Error Handling
	•	Route-level error boundaries.
	•	Try/catch in async ops; structured logging.
	•	Friendly user messages; graceful recovery.

10. Authentication
	•	Middleware-protected routes.
	•	httpOnly cookies for sessions; no sensitive JWT payload.
	•	Server-side role checks; integrate Convex identity.

11. Code Quality
	•	ESLint strict; Prettier; strict: true in TS.
	•	Functions < 50 lines; files < 300 lines (guidelines).

12. Testing
	•	Testing Library for UI.
	•	Unit → integration → e2e layering; keep tests deterministic.

13. Documentation
	•	TSDoc for public APIs.
	•	ADRs for lasting tradeoffs; lightweight READMEs per complex feature.

14. Security
	•	Validate inputs (e.g., zod) at boundaries.
	•	Secure headers; rate-limiting on APIs.
	•	Secrets only in server env; never commit .env.

15. Accessibility
	•	Semantic HTML; ARIA where needed.
	•	Keyboard/focus management; contrast/alt text.

16. Environment
	•	Document .env variables; NEXT_PUBLIC_ only when required.
	•	Validate env on startup; fail fast with helpful errors.
