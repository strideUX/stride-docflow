---
schema: guide.v1
title: "Convex Patterns"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

# Convex Patterns

Schema
 • convex/schema.ts is the source of truth; validators via v.*
 • Add indexes for list views and hot queries

Functions
 • Queries read-only; Mutations write-only; Actions for third-party calls
 • Co-locate by domain under convex/domains/*
 • Keep handlers small; validate inputs; return typed shapes

Auth
 • Centralize identity; pass userId/roles into functions
 • Guard mutations; avoid client-trusted flags

Performance
 • Avoid N+1 with indexes and pre-aggregation
 • Prefer filtering at the DB; limit result size

Testing
 • Unit test pure logic; mock ctx for function tests
 • Seed local data with scripts
