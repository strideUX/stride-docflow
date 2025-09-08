import { defineSchema, defineTable } from "convex/schema";

export default defineSchema({
  items: defineTable({
    title: "string",
    createdAt: "number"
  }).index("by_createdAt", ["createdAt"]),
});

