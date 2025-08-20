import { v } from 'convex/values';
import { action, mutation, query } from '../_generated/server';
import { api } from '../_generated/api';
import { Agent } from '@convex-dev/agent';
import { components } from '../_generated/api';
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
            const turns = Array.isArray(sess.data?.turns) ? sess.data.turns : [];
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
        const turns = sess ? (sess.data?.turns || []) : [];
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
        try {
            const nowIso = () => new Date().toISOString();
            // Fetch session and map to agent thread
            const sess = await ctx.runQuery(api.docflow.contexts.getSession, { sessionId: args.sessionId });
            let agentOrder = Number((sess?.data?.agentOrder) || 0);
            const order = agentOrder + 1;
            let agentThreadId = sess?.data?.agentThreadId;
            const agent = new Agent(components.agent, {
                name: args.agentId || 'docflow-discovery',
                languageModel: undefined,
                // We let provider/model be chosen via streamText args
                saveStreamDeltas: true,
            });
            if (!agentThreadId) {
                const { threadId } = await agent.createThread(ctx, { title: `Docflow ${args.sessionId}` });
                agentThreadId = threadId;
                await ctx.runMutation(api.docflow.contexts.upsertSession, { sessionId: args.sessionId, data: { ...(sess?.data || {}), agentThreadId, agentOrder: 0 } });
            }
            const { thread } = await agent.continueThread(ctx, { threadId: agentThreadId });
            const modelName = args.model || (args.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : (process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o'));
            const stream = await thread.streamText({
                system: args.system,
                prompt: args.user,
                model: modelName,
                providerOptions: { provider: args.provider },
            }, { saveStreamDeltas: true });
            // Consume stream server-side to drive DeltaStreamer
            await stream.consumeStream();
            await ctx.runMutation(api.docflow.contexts.upsertSession, { sessionId: args.sessionId, data: { ...(sess?.data || {}), agentOrder: order } });
            return { ok: true };
            return { ok: false };
        }
        catch {
            return { ok: false };
        }
    },
});
//# sourceMappingURL=messages.js.map