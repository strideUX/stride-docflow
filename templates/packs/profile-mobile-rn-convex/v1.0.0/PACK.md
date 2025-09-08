---
schema: pack.v1
id: profile-mobile-rn-convex
version: 1.0.0
status: draft
title: Profile – Mobile (React Native + Convex)
description: Convenience bundle composing frontend-react-native-expo, backend-convex, qa-react-native, ci-github.
owner: {{OWNER}}
date: {{DATE}}
targets:
  expo_sdk: 54
  react_native: 0.81
depends_on:
  - frontend-react-native-expo@1.0.0
  - backend-convex@1.0.0
  - qa-react-native@1.0.0
  - ci-github@1.0.0
params:
  ENABLE_DETOX: false
---

# Purpose
One-command setup for your default mobile baseline.

# Included Packs
- frontend-react-native-expo (TS strict)
- backend-convex (functions + schema)
- qa-react-native (Jest, RN Testing Library, Detox optional)
- ci-github (Actions)

# Overrides & Parameters
- Detox disabled by default (toggleable)

# Notes
- Use ADRs for navigation choices and native module decisions
