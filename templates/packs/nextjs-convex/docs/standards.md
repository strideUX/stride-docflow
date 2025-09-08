schema: guide.v1
title: “Next.js + Convex Architecture Standards”
project: “{{PROJECT_NAME}}”
owner: “{{OWNER}}”
version: 1

Next.js + Convex Architecture Standards

Reusable standards for all Next.js/Convex projects

1. Project Structure

Required Directory Layout

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

convex/                           # Convex backend
├── _generated/                   # Generated files
├── schema.ts                     # Database schema
├── [table].ts                    # Table queries/mutations
├── auth.ts                       # Auth functions
└── lib/                          # Shared backend logic

2. Naming Conventions

Files & Folders
 • Components: kebab-case.tsx (e.g., user-profile.tsx)
 • Hooks: use-kebab-case.ts (e.g., use-auth-state.ts)
 • Types: kebab-case.types.ts (e.g., user.types.ts)
 • Utils: kebab-case.ts (e.g., date-helpers.ts)
 • Routes: kebab-case/page.tsx

Code Entities
 • Components: PascalCase (UserProfile)
 • Hooks: camelCase with “use” prefix (useAuthState)
 • Types/Interfaces: PascalCase (UserProfile, IUserData)
 • Functions: camelCase (formatDate)
 • Constants: UPPER_SNAKE_CASE (MAX_RETRIES)
 • Enums: PascalCase (UserRole)

3. Component Architecture

Template (reference)
 • Single responsibility
 • Props interface always defined
 • No inline styles (prefer Tailwind/CSS modules)
 • Event handlers prefixed with handle
 • Handle loading/error states
 • Memoize expensive operations
 • Cleanup effects

4. Type Safety

Type Definition Standards
 • No any; use unknown for dynamic
 • Fully type params and returns
 • Interfaces for objects; types for unions/primitives
 • Type guards where runtime validation is needed
 • TSDoc for public APIs

Example (reference)
 • user roles enum, IUser, CreateUserInput, UpdateUserInput
 • ApiResponse union type
 • isUser type guard

5. Convex Patterns

Schema Definition
 • defineSchema in convex/schema.ts
 • Use v.* validators; index hot paths
 • Optional metadata on documents with v.optional

Query/Mutation Pattern
 • Queries read-only; Mutations write-only
 • Use .withIndex for efficient filters
 • Validate uniqueness (e.g., by_email) before inserts

6. Hook Patterns

Custom Hook Template
 • Input validation
 • state/loading/error
 • memoized values
 • stable callbacks
 • cleanup in effects
 • return stable API

7. State Management

Context Pattern
 • Provider with memoized value and stable actions
 • useContext guard to ensure usage inside provider

8. Performance Standards
 • Partial Pre-rendering (Next 15+) where appropriate
 • Streaming with Suspense for progressive loading
 • Server Actions for form-like mutations
 • Parallel data fetching with Promise.all
 • next/image with sizes/placeholder/quality
 • Route segment config per page needs (runtime, revalidate, dynamic)

Optimization Checklist
 • PPR, streaming, server actions, parallel fetch
 • memo/useMemo/useCallback where needed
 • dynamic imports, debounce, virtual lists
 • suspense boundaries
 • edge runtime where appropriate
 • cache strategies (static/dynamic/ISR)
 • optimistic updates, prefetch, bundle analysis, font optimization

9. Error Handling
 • Route-level error boundaries
 • Try/catch in async ops
 • Friendly messages; structured logging
 • Graceful recovery paths

10. Authentication Architecture
 • Middleware for protected routes
 • httpOnly cookies for sessions; no sensitive JWT payload
 • CSRF protection on mutations; secure cookies in prod
 • Role checks on the server
 • Convex integration to load the current user in queries

11. Code Quality
 • ESLint strict, Prettier, TS strict
 • No console.log in production; no commented code
 • Functions < 50 lines; files < 300 lines

12. Testing
 • Testing Library for UI; unit/integration/e2e hierarchy
 • Keep tests deterministic and focused on behavior

13. Documentation
 • TSDoc for public APIs
 • README for complex features
 • ADRs for lasting tradeoffs
 • Inline comments only for unusual logic

14. Security
 • Validate all inputs (e.g., zod)
 • Rate limit APIs; set secure headers
 • Secrets only in server env; never commit .env
 • Dependency scanning and vulnerability checks

15. Accessibility
 • Semantic HTML, ARIA as needed
 • Keyboard/focus management
 • Contrast/alt text; screen reader checks

16. Environment Configuration
 • Document .env.local variables; NEXT_PUBLIC_ only when required
 • Validate env on startup; typed env accessor

Implementation Priority
 • Phase 1: structure, naming, type safety, component patterns
 • Phase 2: error handling, performance, testing, docs
 • Phase 3: accessibility, security, monitoring, CI/CD
