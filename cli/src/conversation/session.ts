import { FileContextStore } from '../context/file-store.js';
import { ContextStore } from '../context/store.js';
import { ConvexContextStore } from '../context/convex-store.js';
import type { ConversationState, ConversationTurn } from './engine.js';

export interface SavedConversation {
    state: ConversationState;
    summary: Record<string, unknown>;
}

export class ConversationSessionManager {
    private store: ContextStore;

    constructor(store?: ContextStore) {
        if (store) {
            this.store = store;
        } else {
            const useConvex = !!(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL || process.env.DOCFLOW_CONVEX_ADMIN_URL);
            this.store = useConvex ? new ConvexContextStore() : new FileContextStore();
        }
    }

    async createOrUpdate(state: ConversationState, summary: Record<string, unknown>): Promise<void> {
        await this.store.update(state.sessionId, (prev) => ({
            ...prev,
            state,
            summary,
        }));
    }

    async appendTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
        await this.store.update(sessionId, (prev) => {
            const current = (prev?.state as ConversationState | undefined);
            const updatedState: ConversationState | undefined = current
                ? { ...current, turns: [...(current.turns || []), turn] }
                : undefined;
            // Ephemeral marker understood by ConvexContextStore to also append to messages
            return { ...prev, state: updatedState, __appendTurn: turn, ...(turn.agentId ? { agentId: turn.agentId } : {}) } as any;
        });
    }

    async appendAssistantChunk(sessionId: string, content: string, agentId?: string): Promise<void> {
        const now = new Date().toISOString();
        await this.store.update(sessionId, (prev) => {
            return { ...prev, __appendTurnChunk: { role: 'assistant', content, timestamp: now, ...(agentId ? { agentId } : {}) }, ...(agentId ? { agentId } : {}) } as any;
        });
    }

    async load(sessionId: string): Promise<SavedConversation | null> {
        const session = await this.store.get(sessionId);
        if (!session) return null;
        const state = (session.data as any)?.state as ConversationState | undefined;
        const summary = (session.data as any)?.summary as Record<string, unknown> | undefined;
        if (!state || !summary) return null;
        return { state, summary };
    }

    async delete(sessionId: string): Promise<void> {
        await this.store.delete(sessionId);
    }
}


