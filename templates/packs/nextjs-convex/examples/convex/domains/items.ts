import { mutation, query } from "convex/server";
import { v } from "convex/values";

export const list = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, a) =>
    ctx.db.query("items")
      .withIndex("by_owner", q => q.eq("ownerId", a.ownerId))
      .collect()
});

export const add = mutation({
  args: { ownerId: v.id("users"), title: v.string() },
  handler: async (ctx, a) =>
    ctx.db.insert("items", { ownerId: a.ownerId, title: a.title, done: false, createdAt: Date.now() })
});
