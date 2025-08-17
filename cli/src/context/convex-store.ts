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
        await this.client.mutation(api.contexts.upsertSession, {
            sessionId: session.id,
            data: session.data,
        });
    }

    async update(sessionId: string, updater: (previous: Record<string, unknown>) => Record<string, unknown>): Promise<SessionContext> {
        const existing = await this.get(sessionId);
        const nextData = updater(existing?.data || {});
        await this.client.mutation(api.contexts.upsertSession, { sessionId, data: nextData });
        const updated = await this.get(sessionId);
        if (!updated) {
            const now = new Date().toISOString();
            return { id: sessionId, data: nextData, createdAt: now, updatedAt: now };
        }
        return updated;
    }
}


