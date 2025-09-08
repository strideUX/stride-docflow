schema: guide.v1
title: “Folder Structure (Reference)”
project: “{{PROJECT_NAME}}”
owner: “{{OWNER}}”
version: 1

Folder Structure (Reference)

src/app/… (App Router, layouts, routes)
src/components/… (ui, forms, layouts, features)
src/hooks/… (custom hooks)
src/lib/… (utils, constants, validators)
src/types/… (domain types)
src/providers/… (context providers)
src/styles/… (module css or tokens)

convex/schema.ts (database schema)
convex/domains/.ts (per-domain queries/mutations)
convex/auth.ts (auth functions)
convex/lib/ (shared backend helpers)
