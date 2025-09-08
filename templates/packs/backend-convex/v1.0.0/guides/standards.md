---
schema: pack.guide.v1
id: convex-standards
title: Convex Standards
---

# Convex Standards

## Schema Definition
```typescript
// convex/schema.ts
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

## Query/Mutation Pattern
```typescript
// convex/users.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** List all active users */
export const list = query({
  args: { role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("users")
      .withIndex("by_role", (idx) => (args.role ? idx.eq("role", args.role).eq("isActive", true) : idx.eq("isActive", true)));
    return await q.collect();
  },
});

/** Create a new user */
export const create = mutation({
  args: { email: v.string(), name: v.string(), role: v.union(v.literal("admin"), v.literal("user"), v.literal("guest")) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (idx) => idx.eq("email", args.email))
      .first();
    if (existing) throw new Error("User already exists");
    return await ctx.db.insert("users", { ...args, isActive: true });
  },
});
```

## Rules
- Group functions by domain; validate all inputs; enforce auth for protected ops.
