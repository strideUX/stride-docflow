import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    docflow_sessions: defineTable({
        sessionId: v.string(),
        data: v.any(),
        agentId: v.optional(v.string()),
        createdAt: v.string(),
        updatedAt: v.string(),
    }).index('by_sessionId', ['sessionId']),
});


