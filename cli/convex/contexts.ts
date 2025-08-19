import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const upsertSession = mutation({
    args: {
        sessionId: v.string(),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();
        const existing = await ctx.db
            .query('docflow_sessions')
            .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { data: args.data, updatedAt: now });
            return existing._id;
        }
        return await ctx.db.insert('docflow_sessions', {
            sessionId: args.sessionId,
            data: args.data,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const getSession = query({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('docflow_sessions')
            .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
            .first();
        return existing || null;
    },
});

export const deleteSession = mutation({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('docflow_sessions')
            .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
            .first();
        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});


