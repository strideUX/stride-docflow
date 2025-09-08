---
schema: guide.v1
id: packs-index
owner: {{OWNER}}
date: {{DATE}}
---

# Packs Index

Composable, versioned packs you can mix and match per project. Profiles bundle common choices.

## Frontend
- frontend-nextjs@1.0.0: Next.js 15, React 19, Node 20+ (App Router, TS strict)
- frontend-react-native-expo@1.0.0: Expo SDK 54, React 19, RN 0.81 (Jest + RNTL)

## Backend
- backend-convex@1.0.0: Convex functions + schema patterns
- backend-supabase@1.0.0: SQL migrations + RLS + typed client

## Quality
- qa-web@1.0.0: Vitest, RTL, Playwright
- qa-react-native@1.0.0: Jest, RNTL, Detox (optional)
- ci-github@1.0.0: GitHub Actions (lint, typecheck, test, e2e, preview)
- quality-guild@1.0.0: PR conventions, DoR/DoD, review heuristics

## Profiles
- profile-web-nextjs-convex@1.0.0 → frontend-nextjs + backend-convex + qa-web + ci-github
- profile-mobile-rn-convex@1.0.0 → frontend-react-native-expo + backend-convex + qa-react-native + ci-github

Notes:
- Packs include PACK.md (standards) and checks.yaml (agent audits).
- Profiles declare depends_on and optional params (e.g., ENABLE_TAILWIND, ENABLE_DETOX).
