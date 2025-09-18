# Coding Standards

## Project Initialization Standards

### Framework Setup Rules
When initializing any project:
1. **ALWAYS initialize in the current directory**
2. **NEVER create nested project folders**
3. **Use appropriate flags**:
   - Next.js: `npx create-next-app@latest . --typescript`
   - Expo: `npx create-expo-app . --template` or `--no-install`
   - Vite: `npm create vite@latest . -- --template`
4. **If framework creates subfolder, move contents up and delete folder**
5. **Verify you're not nesting: pwd should show /projectname not /projectname/projectname**

## General Principles
- **DRY**: Don't repeat yourself - check dependencies.md first
- **Separation of Concerns**: UI, business logic, and data separate
- **Type Safety**: TypeScript strict mode, no `any` types
- **Error Handling**: All async operations have error states

## Code Organization
/src
├── /components
│   ├── /ui          # Base UI components
│   └── /features    # Feature-specific components
├── /lib             # Utilities and helpers
├── /hooks           # Custom React hooks
└── /types           # Shared TypeScript types

## Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile`)
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase with 'T' or 'I' prefix optional

## Component Standards
- Functional components with TypeScript
- Props interface defined above component
- Default exports for pages, named exports for components
- Colocate styles, tests, and stories with components

## State Management
- Server state: [e.g., Convex queries]
- Client state: [e.g., Zustand for global, useState for local]
- Form state: [e.g., react-hook-form]
- URL state: Search params for filters/pagination

## Testing Requirements
- [ ] Unit tests for utilities
- [ ] Integration tests for critical paths
- [ ] E2E tests for user flows
- Minimum coverage: [e.g., 70%]

## Git Conventions
- **Branch naming**: `type/description` (e.g., `feature/auth`, `bug/user-sync`)
- **Commit format**: `type: description` (e.g., `feat: add login`, `fix: user sync`)
- **PR size**: Aim for < 400 lines changed

## Performance Standards
- Lighthouse score > 90
- Bundle size monitoring
- Image optimization required
- Lazy load below the fold

## Security Standards
- Input sanitization
- SQL injection prevention (if applicable)
- XSS protection
- Environment variables for secrets
- No sensitive data in client code

## Accessibility Standards
- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader tested

## Documentation Requirements
- JSDoc for utility functions
- README for complex features
- Inline comments for complex logic
- Decision log in specs for choices