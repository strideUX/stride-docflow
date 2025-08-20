import * as p from '@clack/prompts';
import { DiscoverySummary } from './types.js';

export type Provider = 'openai' | 'anthropic' | 'local';

export interface ConversationTurn {
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: string;
    agentId?: string;
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
    summary: DiscoverySummary;
}

export interface ConversationEngine {
    start(input: ConversationInput, opts?: { nonInteractive?: boolean }): Promise<ConversationOutput>;
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

// Minimal interactive engine for Phase 1
import { parseIdeaWithAI } from '../generators/ai-parser.js';
import { summarizeDiscovery, summarizeDiscoveryWithOpenAI } from './summarizer.js';
import { ConversationSessionManager } from './session.js';
import { ConversationOrchestrator, OrchestratorHooks } from './orchestrator.js';
import { createDiscoveryAgent } from './agent.js';
import { ChatUI } from '../ui/chat.js';

function toArray(text?: string): string[] {
    if (!text || typeof text !== 'string') return [];
    return text
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

export class RealConversationEngine implements ConversationEngine {
    async start(input: ConversationInput, opts?: { nonInteractive?: boolean }): Promise<ConversationOutput> {
        const now = new Date().toISOString();
        const sessionId = `conv-${Math.random().toString(36).slice(2, 10)}`;
        const turns: ConversationTurn[] = [
            { role: 'system', content: 'Starting discovery conversation', timestamp: now },
        ];
        const sessionManager = new ConversationSessionManager();

        // Seed via AI parse or heuristic
        let parsed: any = {};
        if (input.idea && input.idea.trim().length > 0) {
            try {
                parsed = await parseIdeaWithAI(input.idea, input.aiProvider);
                turns.push({ role: 'assistant', content: 'Parsed your idea. I will propose seeds.', timestamp: new Date().toISOString() });
            } catch {
                // ignore
            }
        }

        if (opts?.nonInteractive) {
            const summary: DiscoverySummary = {
                description: parsed.description || input.idea || 'Project generated via conversational mode',
                objectives: parsed.objectives || [],
                targetUsers: parsed.targetUsers || [],
                features: parsed.features || [],
                constraints: parsed.constraints || [],
                stackSuggestion: parsed.suggestedStack,
            };
            const state: ConversationState = { sessionId, phase: 'discovery', turns };
            await sessionManager.createOrUpdate(state, summary as any);
            return { state, summary };
        }

        // Orchestrated dynamic conversation based on gaps
        const agent = createDiscoveryAgent();
        const orchestrator = new ConversationOrchestrator({ aiProvider: input.aiProvider, model: input.model, agent: agent.descriptor });
        const seed: Partial<DiscoverySummary> = {
            description: parsed.description || input.idea,
            objectives: parsed.objectives || [],
            targetUsers: parsed.targetUsers || [],
            features: parsed.features || [],
            constraints: parsed.constraints || [],
            stackSuggestion: parsed.suggestedStack,
        };
        const hooks: OrchestratorHooks = {
            onTurn: async (_turn) => {
                // TODO: Replace with Convex AI persistence when integrated
                return;
            },
        };
        // Persist initial state
        await sessionManager.createOrUpdate(
            { sessionId, phase: 'discovery', turns },
            (seed as any) || {}
        );

        const chat = new ChatUI({
            onAssistantChunk: async (text: string) => {
                try {
                    await sessionManager.appendAssistantChunk(sessionId, text, agent.descriptor.id);
                } catch {}
            },
        });
        const managed = await orchestrator.manageConversation(seed, turns, chat, {
            onTurn: async (turn) => {
                try {
                    await sessionManager.appendTurn(sessionId, turn);
                } catch {
                    // ignore persistence errors for now
                }
            },
        });
        chat.close();

        // No form prompts; summarization will refine stack if needed
        let summary = managed.summary;

        // Provider-aware summarization pass (graceful fallback when no key)
        summary = await summarizeDiscovery(input.aiProvider, input.idea, summary, input.model);

        const state: ConversationState = {
            sessionId,
            phase: 'discovery',
            turns: managed.turns,
        };

        try {
            await sessionManager.createOrUpdate(state, summary as any);
        } catch {
            // ignore persistence errors for now
        }

        return { state, summary };
    }
}


