# DocFlow - Spec-Driven Development System

A lightweight, spec-driven workflow for managing features, bugs, and ideas through their lifecycle while maintaining clear documentation and preventing code duplication.

## Directory Structure

``` markdown
/.cursor/rules
└── docflow.mdc            # Main workflow rules (always included)
/docflow
├── ACTIVE.md              # Pointer to current focus item(s)
├── INDEX.md               # Living document of all features/bugs/status
├── /context
│   ├── overview.md        # What the app is and does
│   ├── stack.md           # Technical stack, frameworks, patterns
│   └── standards.md       # Coding standards, testing, linting, MCPs
├── /specs
│   ├── /active            # Currently implementing
│   ├── /backlog           # Future items
│   └── /complete          # Shipped items
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

## Getting Started

1. Review the specs in `/specs/backlog/`
2. Move a spec to `/specs/active/` when ready to work
3. Update `ACTIVE.md` with your current focus
4. Open this folder in Cursor and start building!

## Current Project: Contact Form

A simple contact form application with Next.js frontend and Convex backend.

### Backlog
1. **feature-setup**: Initialize Next.js and Convex environments
2. **feature-contact-form**: Create contact form with database storage

Start by moving `feature-setup.md` to `/specs/active/` and updating `ACTIVE.md`!