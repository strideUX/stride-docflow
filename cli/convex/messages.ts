import { v } from 'convex/values';
import { action, mutation, query } from './_generated/server';

export const appendMessage = mutation({
    args: {
        sessionId: v.string(),
        role: v.union(v.literal('system'), v.literal('user'), v.literal('assistant')),
        content: v.string(),
        timestamp: v.string(),
        agentId: v.optional(v.string()),
        chunk: v.optional(v.boolean()),
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
            const nextTurn = { role: args.role, content: args.content, timestamp: args.timestamp, ...(args.agentId ? { agentId: args.agentId } : {}), ...(args.chunk ? { chunk: true } : {}) };
            const next = { turns: [...turns, nextTurn] };
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

// Server-side streaming action (placeholder): integrate with agent SDK later
export const streamAssistant = action({
    args: {
        sessionId: v.string(),
        system: v.string(),
        user: v.string(),
        provider: v.union(v.literal('openai'), v.literal('anthropic'), v.literal('local')),
        model: v.optional(v.string()),
        agentId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // TODO: Use @convex-dev/agent once agent defined. For now, no-op.
        return { ok: false } as const;
    },
});


