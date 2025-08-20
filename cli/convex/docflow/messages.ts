import { v } from 'convex/values';
import { action, mutation, query } from '../_generated/server';
import { api } from '../_generated/api';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

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
            // Track lightweight agent order in session data (no full agent thread yet)
            const sess = await ctx.runQuery(api.contexts.getSession as any, { sessionId: args.sessionId } as any);
            let agentOrder = Number((((sess as any)?.data?.agentOrder) as number | undefined) || 0);
            const order = agentOrder + 1;
            if (args.provider === 'anthropic') {
                const anthropic = new (Anthropic as any)({ apiKey: process.env.ANTHROPIC_API_KEY! });
                const stream = await anthropic.messages.create({
                    model: args.model || 'claude-3-5-sonnet-20241022',
                    max_tokens: 200,
                    system: args.system,
                    messages: [{ role: 'user', content: args.user }],
                    stream: true,
                } as any);
                for await (const event of stream as any) {
                    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                        const text = event.delta.text || '';
                        if (text) {
                            await ctx.runMutation(api.messages.appendMessage, {
                                sessionId: args.sessionId,
                                role: 'assistant',
                                content: text,
                                timestamp: nowIso(),
                                ...(args.agentId ? { agentId: args.agentId } : {}),
                                chunk: true,
                            } as any);
                        }
                    }
                }
                await ctx.runMutation(api.contexts.upsertSession as any, { sessionId: args.sessionId, data: { ...((sess as any)?.data || {}), agentOrder: order } } as any);
                return { ok: true } as const;
            } else if (args.provider === 'openai') {
                const openai = new (OpenAI as any)({ apiKey: process.env.OPENAI_API_KEY! });
                const modelName = args.model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o';
                const isO1 = typeof modelName === 'string' && modelName.startsWith('o1-');
                if (isO1) {
                    // Fallback non-streaming: single append
                    const resp = await openai.chat.completions.create({
                        model: modelName,
                        messages: [{ role: 'user', content: `${args.system}\n\n${args.user}` }],
                        max_tokens: 200,
                    } as any);
                    const content = resp.choices?.[0]?.message?.content || '';
                    if (content) {
                        await ctx.runMutation(api.messages.appendMessage, {
                            sessionId: args.sessionId,
                            role: 'assistant',
                            content,
                            timestamp: nowIso(),
                            ...(args.agentId ? { agentId: args.agentId } : {}),
                            chunk: false,
                        } as any);
                        await ctx.runMutation(api.contexts.upsertSession as any, { sessionId: args.sessionId, data: { ...((sess as any)?.data || {}), agentOrder: order } } as any);
                    }
                    return { ok: true } as const;
                }
                const stream = await openai.chat.completions.create({
                    model: modelName,
                    messages: [
                        { role: 'system', content: args.system },
                        { role: 'user', content: args.user },
                    ],
                    temperature: 0.2,
                    max_tokens: 200,
                    stream: true,
                } as any);
                for await (const part of stream as any) {
                    const delta = part.choices?.[0]?.delta?.content || '';
                    if (delta) {
                        await ctx.runMutation(api.messages.appendMessage, {
                            sessionId: args.sessionId,
                            role: 'assistant',
                            content: delta,
                            timestamp: nowIso(),
                            ...(args.agentId ? { agentId: args.agentId } : {}),
                            chunk: true,
                        } as any);
                    }
                }
                await ctx.runMutation(api.contexts.upsertSession as any, { sessionId: args.sessionId, data: { ...((sess as any)?.data || {}), agentOrder: order } } as any);
                return { ok: true } as const;
            }
            return { ok: false } as const;
        } catch {
            return { ok: false } as const;
        }
    },
});


