import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const appendMessage = mutation({
    args: {
        sessionId: v.string(),
        role: v.union(v.literal('system'), v.literal('user'), v.literal('assistant')),
        content: v.string(),
        timestamp: v.string(),
    },
    handler: async (ctx, args) => {
        // Ensure session exists
        const existing = await ctx.db
            .query('docflow_sessions')
            .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
            .first();
        if (!existing) {
            const now = new Date().toISOString();
            await ctx.db.insert('docflow_sessions', {
                sessionId: args.sessionId,
                data: { turns: [] },
                createdAt: now,
                updatedAt: now,
            });
        }
        // Store message as an append-only record in session doc data.turns for simplicity
        const now = new Date().toISOString();
        const sess = await ctx.db
            .query('docflow_sessions')
            .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
            .first();
        if (sess) {
            const turns = Array.isArray((sess as any).data?.turns) ? (sess as any).data.turns : [];
            const next = { turns: [...turns, { role: args.role, content: args.content, timestamp: args.timestamp }] };
            await ctx.db.patch(sess._id, { data: next, updatedAt: now });
        }
    },
});

export const listMessages = query({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        const sess = await ctx.db
            .query('docflow_sessions')
            .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
            .first();
        const turns = sess ? ((sess as any).data?.turns || []) : [];
        return turns;
    },
});


