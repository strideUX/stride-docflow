---
schema: guide.v1
title: "Convex Patterns"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

Convex Patterns

Schema
	•	convex/schema.ts is the single source of truth.
	•	Use v.* validators for all fields.
	•	Add indexes for hot queries and list pages.

Example
```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("guest")),
    isActive: v.boolean(),
    metadata: v.optional(v.object({
      lastLogin: v.optional(v.number()),
      preferences: v.optional(v.any()),
    })),
  })
  .index("by_email", ["email"]) 
  .index("by_role", ["role", "isActive"]),
});
```
Functions (Queries/Mutations/Actions)
	•	Queries: read-only; fast filters via .withIndex.
	•	Mutations: enforce invariants; validate uniqueness; return typed shapes.
	•	Actions: isolate third-party API calls and secrets.

Example
```ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listActive = query({
  args: { role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const q = ctx.db.query("users").withIndex("by_role", iq =>
      args.role ? iq.eq("role", args.role).eq("isActive", true) : iq.eq("isActive", true)
    );
    return q.collect();
  },
});

export const create = mutation({
  args: { email: v.string(), name: v.string(), role: v.union(v.literal("admin"), v.literal("user"), v.literal("guest")) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (existing) throw new Error("User already exists");
    return ctx.db.insert("users", { ...args, isActive: true });
  },
});
```
Auth
	•	Centralize identity; pass userId/roles explicitly.
	•	Guard mutations server-side; never trust client flags.

Performance
	•	Avoid N+1 via indexes and pre-aggregation.
	•	Filter at the DB; paginate long lists; limit result size.

Testing
	•	Unit test pure logic; mock ctx for function tests.
	•	Seed scripts for local development.
