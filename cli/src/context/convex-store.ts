import { ContextStore, SessionContext } from './store.js';
import { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

export class ConvexContextStore implements ContextStore {
    private client: ConvexClient;
    private url: string;

    constructor(url?: string) {
        const envUrl =
            process.env.CONVEX_URL ||
            process.env.NEXT_PUBLIC_CONVEX_URL ||
            process.env.EXPO_PUBLIC_CONVEX_URL ||
            process.env.DOCFLOW_CONVEX_ADMIN_URL;
        this.url = url || String(envUrl || '');
        if (!this.url) {
            throw new Error('Convex URL not configured. Set DOCFLOW_CONVEX_ADMIN_URL in .env');
        }
        this.client = new ConvexClient(this.url);
    }

    async get(sessionId: string): Promise<SessionContext | null> {
        const rec = await this.client.query(api.contexts.getSession, { sessionId });
        if (!rec) return null;
        return {
            id: rec.sessionId as string,
            data: (rec as any).data,
            createdAt: (rec as any).createdAt,
            updatedAt: (rec as any).updatedAt,
        };
    }

    async set(session: SessionContext): Promise<void> {
        const { __appendTurn, agentId, ...data } = (session.data || {}) as any;
        await this.client.mutation(api.contexts.upsertSession, {
            sessionId: session.id,
            data,
            ...(agentId ? { agentId } : {}),
        } as any);
    }

    async update(sessionId: string, updater: (previous: Record<string, unknown>) => Record<string, unknown>): Promise<SessionContext> {
        const existing = await this.get(sessionId);
        const nextDataRaw = updater(existing?.data || {});
        const { __appendTurn, __appendTurnChunk, agentId, ...nextData } = (nextDataRaw || {}) as any;
        await this.client.mutation(api.contexts.upsertSession, { sessionId, data: nextData, ...(agentId ? { agentId } : {}) } as any);
        // If updater appended a turn, also push to messages
        const maybeTurn = __appendTurn;
        if (maybeTurn && maybeTurn.role && maybeTurn.content) {
            await this.client.mutation(api.messages.appendMessage, {
                sessionId,
                role: String(maybeTurn.role) as any,
                content: String(maybeTurn.content),
                timestamp: String(maybeTurn.timestamp || new Date().toISOString()),
                ...(agentId ? { agentId: String(agentId) } : {}),
                chunk: false,
            });
        }
        const maybeChunk = __appendTurnChunk;
        if (maybeChunk && maybeChunk.role && maybeChunk.content) {
            await this.client.mutation(api.messages.appendMessage, {
                sessionId,
                role: String(maybeChunk.role) as any,
                content: String(maybeChunk.content),
                timestamp: String(maybeChunk.timestamp || new Date().toISOString()),
                ...(agentId ? { agentId: String(agentId) } : {}),
                chunk: true,
            });
        }
        const updated = await this.get(sessionId);
        if (!updated) {
            const now = new Date().toISOString();
            return { id: sessionId, data: nextData, createdAt: now, updatedAt: now };
        }
        return updated;
    }

    async delete(sessionId: string): Promise<void> {
        await this.client.mutation(api.contexts.deleteSession as any, { sessionId } as any);
    }
}


