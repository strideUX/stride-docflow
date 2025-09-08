---
schema: pack.v1
id: frontend-react-native-expo
version: 1.0.0
status: draft
title: React Native (Expo) – TypeScript Strict
description: Opinionated Expo app with TS, ESLint, testing (Jest + RN Testing Library), optional Detox.
owner: {{OWNER}}
date: {{DATE}}
targets:
  expo_sdk: 54
  react_native: 0.81
  react: 19
params:
  ENABLE_DETOX: false
compatibility:
  expo: ">=54"   # Expo-managed projects pin RN; see SDK table
  react_native: ">=0.81"  # For Bare RN projects; Expo SDK maps to its RN version
  react: ">=19"
---

# Purpose
Deliver a clean Expo baseline with strong typing, testing, and predictable structure; avoid lock-in choices unless ADR-backed.

# Targets
- Expo SDK 54 • React 19 • React Native 0.81 (Bare)

# Opinionated Defaults
- TypeScript strict; ESLint; Prettier
- Module resolver for `@/*`
- Testing: Jest + RN Testing Library; Detox optional
- Expo Router optional via ADR

# Directory Structure (Recommended)
- `app/` or `src/` (choose one)
- `components/`, `lib/`, `hooks/`
- `tests/unit/`, `tests/e2e/` (Detox optional)
- `assets/` for images/fonts

# Config & Scripts (Overview)
- `tsconfig.json` with path aliases
- `eslint` with RN/Expo rules
- `jest.config.ts` with RN presets
- `detox.config.ts` (optional)
- `app.json`/`app.config.ts` minimal

# Patterns & Examples
- Simple screen + hook with tests
- Navigation example (Expo Router optional)

# Testing Guidance
- Unit/Component: Jest + RN Testing Library
- E2E: Detox (optional); keep flows short and stable

# CI/CD Hooks
- Lint → Typecheck → Unit → (Optional Detox)
- EAS optional; document in ADR if used

# Security & Env
- Minimal env in Expo; prefer server-side secrets

# ADRs & Decisions
- Navigation system choice; deep linking; native modules

# Upgrade Notes
- Track Expo SDK releases; verify configs after upgrades

# Checks (Agent)
- Jest config exists; tests pass; no forbidden APIs

# Parameters
- `ENABLE_DETOX`: adds Detox config + example test
