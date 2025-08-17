import { FileContextStore } from '../context/file-store.js';
import { ContextStore } from '../context/store.js';
import type { ConversationState, ConversationTurn } from './engine.js';

export interface SavedConversation {
    state: ConversationState;
    summary: Record<string, unknown>;
}

export class ConversationSessionManager {
    private store: ContextStore;

    constructor(store?: ContextStore) {
        this.store = store || new FileContextStore();
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
            return { ...prev, state: updatedState };
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
}


