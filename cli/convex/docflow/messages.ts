import { v } from 'convex/values';
import { action, mutation, query } from '../_generated/server';
import { api } from '../_generated/api';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
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
        try {
            const nowIso = () => new Date().toISOString();
            // Fetch session and map to agent thread
            const sess = await ctx.runQuery(api.docflow.contexts.getSession as any, { sessionId: args.sessionId } as any);
            let agentOrder = Number((((sess as any)?.data?.agentOrder) as number | undefined) || 0);
            const order = agentOrder + 1;
            let agentThreadId: string | undefined = (sess as any)?.data?.agentThreadId;
            const agent = new Agent((components as any).agent, {
                name: args.agentId || 'docflow-discovery',
                languageModel: undefined,
                // We let provider/model be chosen via streamText args
                saveStreamDeltas: true,
            } as any);
            if (!agentThreadId) {
                const { threadId } = await agent.createThread(ctx as any, { title: `Docflow ${args.sessionId}` } as any);
                agentThreadId = threadId as any;
                await ctx.runMutation(api.docflow.contexts.upsertSession as any, { sessionId: args.sessionId, data: { ...((sess as any)?.data || {}), agentThreadId, agentOrder: 0 } } as any);
            }
            const { thread } = await agent.continueThread(ctx as any, { threadId: agentThreadId } as any);
            const modelName = args.model || (args.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : (process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o'));
            const stream = await thread.streamText({
                system: args.system,
                prompt: args.user,
                model: modelName,
                providerOptions: { provider: args.provider },
            } as any, { saveStreamDeltas: true } as any);
            // Consume stream server-side to drive DeltaStreamer
            await stream.consumeStream();
            await ctx.runMutation(api.docflow.contexts.upsertSession as any, { sessionId: args.sessionId, data: { ...((sess as any)?.data || {}), agentOrder: order } } as any);
            return { ok: true } as const;
            
            return { ok: false } as const;
        } catch {
            return { ok: false } as const;
        }
    },
});


