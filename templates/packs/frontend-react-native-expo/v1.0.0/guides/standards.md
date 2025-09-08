---
schema: pack.guide.v1
id: rn-expo-standards
title: React Native (Expo) Standards
---

# RN/Expo Standards

## Structure
- `app/` (Expo Router) or `src/` with screens/components/hooks/services.
- Use path alias `@/*` → `src/*`.

## Separation of Concerns
- UI components (pure) ↔ hooks (state) ↔ services (network/storage).

## Performance & A11y
- Avoid unnecessary re-renders; memoize where significant.
- Provide accessibility roles/labels; focus order is important.

