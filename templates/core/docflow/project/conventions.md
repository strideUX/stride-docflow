---
schema: guide.v1
title: "Conventions"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Conventions

Code
 • Language & version pinned; enforce formatter and linter
 • Unit tests required for pure logic; integration as needed
 • Errors: prefer typed errors; include context and remediation hints

Docs
 • Keep indexes small; promote detail to leaf docs under docflow/*
 • Every docflow file must include front-matter
 • Status vocabulary: pending → in_progress → in_review → completed

IDs
 • Features: F###; Chores: C###; Bugs: B###; Spikes: S###; ADRs: ADR-YYYY-MM-DD-NN-slug
