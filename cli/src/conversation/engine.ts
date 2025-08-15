import * as p from '@clack/prompts';

export type Provider = 'openai' | 'anthropic' | 'local';

export interface ConversationTurn {
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ConversationState {
    sessionId: string;
    phase: 'discovery' | 'design' | 'generation';
    turns: ConversationTurn[];
}

export interface ConversationInput {
    idea?: string;
    aiProvider: Provider;
    model?: string;
}

export interface ConversationOutput {
    state: ConversationState;
    summary: {
        name?: string;
        description?: string;
        objectives?: string[];
        targetUsers?: string[];
        features?: string[];
        constraints?: string[];
        stackSuggestion?: string;
    };
}

export interface ConversationEngine {
    start(input: ConversationInput): Promise<ConversationOutput>;
}

export class NoopConversationEngine implements ConversationEngine {
    async start(input: ConversationInput): Promise<ConversationOutput> {
        const now = new Date().toISOString();
        p.note('Conversational mode (stub): collecting minimal inputs from existing flow', '🗣️ Conversational');
        const state: ConversationState = {
            sessionId: `conv-${Math.random().toString(36).slice(2, 10)}`,
            phase: 'discovery',
            turns: [
                { role: 'system', content: 'Start discovery', timestamp: now },
                { role: 'assistant', content: 'Describe your project briefly.', timestamp: now },
                { role: 'user', content: input.idea || 'No idea provided', timestamp: now },
            ],
        };
        return {
            state,
            summary: {
                description: input.idea || 'Project generated via conversational stub',
            },
        };
    }
}


