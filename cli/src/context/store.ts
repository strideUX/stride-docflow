export interface SessionContext {
    id: string;
    data: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface ContextStore {
    get(sessionId: string): Promise<SessionContext | null>;
    set(session: SessionContext): Promise<void>;
    update(
        sessionId: string,
        updater: (previous: Record<string, unknown>) => Record<string, unknown>
    ): Promise<SessionContext>;
    delete(sessionId: string): Promise<void>;
}

export class InMemoryContextStore implements ContextStore {
    private store: Map<string, SessionContext> = new Map();

    async get(sessionId: string): Promise<SessionContext | null> {
        return this.store.get(sessionId) || null;
    }

    async set(session: SessionContext): Promise<void> {
        this.store.set(session.id, session);
    }

    async update(
        sessionId: string,
        updater: (previous: Record<string, unknown>) => Record<string, unknown>
    ): Promise<SessionContext> {
        const existing = this.store.get(sessionId);
        const now = new Date().toISOString();
        if (!existing) {
            const created: SessionContext = {
                id: sessionId,
                data: updater({}),
                createdAt: now,
                updatedAt: now,
            };
            this.store.set(sessionId, created);
            return created;
        }
        const updated: SessionContext = {
            ...existing,
            data: updater(existing.data || {}),
            updatedAt: now,
        };
        this.store.set(sessionId, updated);
        return updated;
    }

    async delete(sessionId: string): Promise<void> {
        this.store.delete(sessionId);
    }
}


