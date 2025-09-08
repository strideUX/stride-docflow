---
schema: pack.guide.v1
id: frontend-nextjs-standards
title: Next.js Standards
---

# Next.js Standards (App Router, React 19)

This standard applies once a project is created with Next.js 15 (App Router) and configured with TypeScript strict. No boilerplate is copied; this document defines how to structure and write code after setup.

## 1. Project Structure

### Required Directory Layout
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   ├── (dashboard)/              # Dashboard route group
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── forms/                    # Form components
│   ├── layouts/                  # Layout components
│   └── features/                 # Feature-specific components
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts
│   ├── use-debounce.ts
│   └── use-[feature].ts
├── lib/                          # Core application logic
│   ├── utils.ts                  # Utility functions
│   ├── constants.ts              # App constants
│   └── validators.ts             # Validation logic
├── types/                        # TypeScript definitions
│   ├── globals.d.ts
│   └── [domain].types.ts
├── providers/                    # Context providers
│   └── [provider-name].tsx
└── styles/                       # Additional styles
    └── [component].module.css

convex/                           # Convex backend (if selected)
├── _generated/                   # Generated files
├── schema.ts                     # Database schema
├── [table].ts                    # Table queries/mutations
├── auth.ts                       # Auth functions
└── lib/                          # Shared backend logic
```

## 2. Naming Conventions

### Files and Folders
- Components: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-auth-state.ts`)
- Types: `kebab-case.types.ts` (e.g., `user.types.ts`)
- Utils: `kebab-case.ts` (e.g., `date-helpers.ts`)
- Routes: `kebab-case/page.tsx`

### Code Entities
- Components: `PascalCase` (e.g., `UserProfile`)
- Hooks: `camelCase` with `use` prefix (e.g., `useAuthState`)
- Types/Interfaces: `PascalCase` (e.g., `IUser`, `UserRole`)
- Functions: `camelCase` (e.g., `formatDate`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Enums: `PascalCase` (e.g., `UserRole`)

## 3. Component Architecture

### Component Template
```typescript
/**
 * ComponentName - Brief description
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LocalComponent } from '@/components/ui/local';
import { useCustomHook } from '@/hooks/use-custom';

interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: boolean;
  onAction?: (value: string) => void;
}

export function ComponentName({ requiredProp, optionalProp = false, onAction }: ComponentNameProps) {
  const [localState, setLocalState] = useState('');
  const customValue = useCustomHook();
  const computedValue = useMemo(() => expensiveComputation(requiredProp), [requiredProp]);
  const handleClick = useCallback(() => onAction?.(localState), [localState, onAction]);
  useEffect(() => () => {}, []);
  return <div className="component-wrapper">{/* JSX */}</div>;
}
```

### Component Rules
- Single responsibility; props interface always defined
- No inline styles (Tailwind/CSS modules)
- Event handlers prefixed with `handle*`
- Loading/error states handled
- Memoize expensive operations; cleanup effects

## 4. Type Safety

### Type Definition Standards
```typescript
export enum UserRole { Admin = 'admin', User = 'user', Guest = 'guest' }
export interface IUser { id: string; email: string; name: string; role: UserRole; createdAt: Date; updatedAt: Date }
export type CreateUserInput = Pick<IUser, 'email' | 'name' | 'role'>;
export type UpdateUserInput = Partial<Omit<IUser, 'id' | 'createdAt'>>;
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
export function isUser(value: unknown): value is IUser { /* guard body */ return typeof value === 'object' && value !== null && 'id' in value && 'email' in value; }
```

### Type Rules
- No `any`; prefer `unknown` and refine
- Fully type function params and returns
- Interfaces for objects; types for unions/primitives
- Use type guards for runtime validation; TSDoc on public APIs

## 5. Convex Patterns (if Convex selected)

See the Convex pack standards. Outline:
- Schema: `convex/schema.ts` with indexes and strong validation
- Queries/Mutations: validate args with `convex/values` and guard auth

## 6. Hook Patterns

### Custom Hook Template
```typescript
export function useFeature(config?: FeatureConfig) {
  const [state, setState] = useState<State>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const derivedValue = useMemo(() => computeValue(state), [state]);
  const execute = useCallback(async () => { /* async logic */ }, []);
  useEffect(() => () => {}, []);
  return useMemo(() => ({ state, loading, error, execute, derivedValue }), [state, loading, error, execute, derivedValue]);
}
```

### Hook Rules
- Prefix with `use`; return stable references
- Handle loading/error; validate inputs; correct dependencies

## 7. State Management

### Context Pattern
```typescript
const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);
export function FeatureProvider({ children }: { children: React.ReactNode }) { /* ... */ }
export function useFeature() { const ctx = useContext(FeatureContext); if (!ctx) throw new Error('useFeature must be used within FeatureProvider'); return ctx; }
```

### State Rules
- Context for global; local state for component-specific
- Derived state via `useMemo`; immutable updates; no redundant state

## 8. Performance Standards (Next.js 15+)

### Partial Pre-rendering (PPR)
```typescript
// next.config.ts
export default { experimental: { ppr: true } } satisfies import('next').NextConfig;
```

### Streaming and Suspense
```typescript
export default function ProductsPage() { return (<div><Suspense fallback={<Skeleton/>}><ProductList /></Suspense></div>); }
```

### Server Actions (Next.js 15+)
```typescript
'use server';
export async function updateUser(formData: FormData) { /* validate, update, revalidate, redirect */ }
```

### Data Cache and Revalidation
```typescript
export const revalidate = 3600; export const dynamic = 'force-static';
```

### Optimistic Updates
```typescript
'use client';
const [optimistic, add] = useOptimistic(initial, (s,n)=>s+n);
```

### Parallel Data Fetching
```typescript
const [a,b,c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
```

### Image Optimization
```typescript
<Image src={src} alt={alt} width={800} height={600} priority={false} loading="lazy" quality={75} />
```

### Route Segment Config
```typescript
export const runtime = 'edge'; export const preferredRegion = 'auto';
export const fetchCache = 'force-cache'; export const revalidate = 3600; export const dynamic = 'error';
```
