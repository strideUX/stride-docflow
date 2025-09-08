---
schema: pack.v1
id: qa-react-native
version: 1.0.0
status: draft
title: QA – React Native (Jest, RN Testing Library, Detox)
description: Testing patterns for React Native projects.
owner: {{OWNER}}
date: {{DATE}}
targets:
  react_native: 0.81
  expo_sdk: 54
---

# Purpose
Provide reliable testing guidance suitable for mobile apps.

# Opinionated Defaults
- Jest + RN Testing Library; Detox optional
- Minimal mocks; stable selectors

# Structure
- `tests/unit/**`, `tests/e2e/**`

# Conventions
- Keep Detox scenarios short; isolate flakey flows

# CI Hooks
- Separate unit vs e2e; device/simulator setup documented

# Checks (Agent)
- Config presence; predictable test naming; Detox gated by param
