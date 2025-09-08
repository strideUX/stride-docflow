import { mutation, query } from "convex/_generated/server";
import { v } from "convex/values";

export const get = query(async ({ db }, { id }: { id: string }) => {
  return db.get(id);
});

export const create = mutation({
  args: { title: v.string() },
  handler: async ({ db }, { title }) => db.insert("items", { title, createdAt: Date.now() }),
});

