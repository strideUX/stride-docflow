# DocFlow - Spec-Driven Development System

A lightweight, spec-driven workflow for managing features, bugs, and ideas through their lifecycle while maintaining clear documentation and preventing code duplication.

## Directory Structure

``` markdown
/.cursor/rules
└── docflow.md             # Main workflow rules (always included)
/docflow
├── ACTIVE.md              # Pointer to current focus item(s)
├── INDEX.md               # Living document of all features/bugs/status
├── /context
│   ├── overview.md        # What the app is and does
│   ├── stack.md           # Technical stack, frameworks, patterns
│   └── standards.md       # Coding standards, testing, linting, MCPs
├── /specs
│   ├── /active            # Currently implementing
│   │   ├── feature-auth.md
│   │   └── bug-user-sync.md
│   ├── /backlog           # Future items
│   │   ├── feature-search.md
│   │   └── idea-ai-assist.md
│   └── /complete          # Shipped items
│       └── /2024-Q4
│           ├── feature-login.md
│           └── bug-cache-fix.md
└── /shared
    └── dependencies.md    # Cross-cutting components, APIs, data models
```

## Workflow

### 1. Starting Work

backlog → active → complete

- New ideas go in `/specs/backlog` (can be rough)
- When ready to work, refine into proper spec and move to `/specs/active`
- Update `ACTIVE.md` to point to current focus
- When shipped, move to `/specs/complete/[YYYY-QQ]/`

### 2. Spec Types

- **feature-[name].md** - New functionality
- **bug-[name].md** - Fixes and issues  
- **idea-[name].md** - Rough concepts (backlog only)

### 3. Spec Template

```markdown
# [Type]: [Name]

## Context
Why this exists, what problem it solves

## User Story / Bug Description
As a... I want... So that...
-or-
When... Then... Instead of...

## Acceptance Criteria
- [ ] Specific testable criteria
- [ ] User can X
- [ ] System does Y

## Technical Notes
Implementation details, constraints, approach

## Dependencies
- Uses: [existing features/systems]
- Modifies: [what it changes]
- Blocks: [what depends on this]

## Decision Log
- YYYY-MM-DD: Initial spec created
- YYYY-MM-DD: [Key decisions and why]
- YYYY-MM-DD: [Pivots and reasoning]
```

### 4. Idea Template

``` markdown
# Idea: [Name]

## Sketch
[Brain dump - no structure required]

## Potential Value
[Why this might be worth doing]

## Questions
- [ ] Things to figure out
- [ ] Unknowns to research
```

## Key Files

### ACTIVE.md

``` markdown
# Currently Active

## Primary Focus
- feature-auth.md - Implementing OAuth flow

## Secondary
- bug-user-sync.md - Fixing sync issues

Last Updated: 2024-12-28
```

### INDEX.md

``` markdown
# Feature Index

## Active
- feature-auth: OAuth implementation (Started 2024-12-20)
- bug-user-sync: Fix user data sync (Started 2024-12-27)

## Backlog Priority
1. feature-search: Global search
2. feature-notifications: Real-time notifications
3. bug-cache-invalidation: Fix stale cache

## Completed
- 2024-Q4
  - feature-login: Basic auth (Shipped 2024-12-15)
  - bug-token-refresh: Fix token expiry (Shipped 2024-12-10)
```

### shared/dependencies.md

``` markdown
# Shared Dependencies

## User System
- Convex Tables: `users`, `userPreferences`
- Key Mutations: `users.create`, `users.updateProfile`
- Key Queries: `users.getById`, `users.getCurrentUser`
- Components: `<UserAvatar />`, `<UserProfileCard />`
- Modified by: feature-auth, feature-profile
- Used by: feature-comments, feature-notifications

## Comment System
- Convex Tables: `comments`, `commentReactions`
- Key Mutations: `comments.create`, `comments.flag`
- Key Queries: `comments.byPost`, `comments.withReplies`
- Components: `<CommentThread />`, `<CommentComposer />`
- Modified by: feature-comments, feature-reactions
- Used by: feature-moderation, feature-notifications

[Add sections as shared code emerges]
```

### .cursor/rules/docflow.md

The main rules file at `.cursor/rules/docflow.md` will:

- Load Context - Always aware of app overview, stack, and standards
- Check Active Work - Know what's currently being worked on
- Prevent Duplication - Check dependencies before creating new code
- Maintain Specs - Update status and dependencies as work progresses

```markdown
# DocFlow Workflow Rules

## Context Loading Priority
1. Always load: /docflow/context/overview.md
2. Always load: /docflow/ACTIVE.md
3. For current work: Load active spec from /docflow/specs/active/
4. For technical details: Load /docflow/context/stack.md and standards.md
5. For shared code: Load /docflow/shared/dependencies.md

## Before Creating ANY New Code

### Check Existing Code
1. Review /docflow/shared/dependencies.md for existing functionality
2. For Convex: Check /convex directory for existing queries/mutations
3. For Components: Check if similar component exists
4. For Utils: Check if utility function exists

### If Creating New Shared Code
1. Add entry to /docflow/shared/dependencies.md
2. Note which feature/bug created it
3. Document who uses it

## When Working on Specs

### Starting New Work
1. Spec must exist in /docflow/specs/active/
2. Update ACTIVE.md with current focus
3. Review dependencies in the spec

### During Implementation
1. Update spec's Decision Log with key decisions and pivots
2. Update Dependencies if new connections found
3. Keep Acceptance Criteria current

### Completing Work
1. Verify all Acceptance Criteria met
2. Update INDEX.md
3. Add final Decision Log entry with completion notes
4. Move spec to /docflow/specs/complete/[YYYY-QQ]/
5. Update ACTIVE.md

## Code Principles
- No duplicate Convex functions - expensive DB operations
- No duplicate components - maintenance burden
- Shared code goes in appropriate shared directories
- Every shared item tracked in dependencies.md

## Decision Documentation
When making technical decisions, always update the Decision Log:
- Architecture choices (why X over Y)
- Scope changes (what was cut and why)
- Performance trade-offs
- Security considerations
- Breaking changes

## Ask Before Acting
If unsure whether functionality exists, explicitly check:
"I need to [X]. Let me check dependencies.md and existing code first..."
```

## Getting Started

- Create the `/docflow` directory structure
- Create `.cursor/rules/docflow.md` with the workflow rules
- Write initial `overview.md`, `stack.md`, and `standards.md`
- Start with empty `ACTIVE.md` and `INDEX.md`
- Create your first spec in `/specs/backlog/`
- When ready to code, refine spec and move to `/specs/active/`
- Update `ACTIVE.md` to point to your current work

## Tips

- Keep specs focused - one clear goal per spec
- Bugs follow the same flow as features
- Ideas can be rough sketches until ready to refine
- Update Decision Log when making important choices
- Update dependencies.md as you build shared code
- Archive completed work quarterly for easy reference
- Let INDEX.md be your single source of truth for project status

## Benefits

✅ Clear focus on current work
✅ No lost ideas (backlog captures everything)
✅ Prevents duplicate code via dependencies tracking
✅ Decision history for understanding "why" later
✅ Cursor AI always has correct context
✅ Simple enough to maintain, powerful enough to scale