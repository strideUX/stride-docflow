import { mutation, query } from "convex/_generated/server";
import { v } from "convex/values";

export const list = query(async ({ db }) => {
  return db.query("items").withIndex("by_createdAt").collect();
});

export const add = mutation({
  args: { title: v.string() },
  handler: async ({ db }, { title }) => {
    return db.insert("items", { title, createdAt: Date.now() });
  },
});

