---
schema: guide.v1
title: "Folder Structure (Reference)"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

Folder Structure (Reference)
```txt
src/app/                # App Router (layouts, routes, handlers)
src/components/         # ui, forms, layouts, features
src/hooks/              # custom hooks
src/lib/                # helpers, constants, validators
src/types/              # domain types
src/providers/          # React context providers
src/styles/             # CSS modules/tokens

convex/schema.ts        # DB schema
convex/domains/*.ts     # per-domain queries/mutations
convex/auth.ts          # optional auth helpers
convex/lib/*            # shared backend utilities
```

- Keep feature concerns together; avoid deep nesting.
- Co-locate tests alongside code where reasonable.
