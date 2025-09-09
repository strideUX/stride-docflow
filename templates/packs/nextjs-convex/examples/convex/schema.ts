import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  users: defineTable({ email: v.string(), createdAt: v.number() })
    .index("by_email", ["email"]),
  items: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    done: v.boolean(),
    createdAt: v.number()
  }).index("by_owner", ["ownerId"])
});
