import * as p from '@clack/prompts';
import { DiscoverySummary } from './types.js';

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
import { getAvailableStacks } from '../templates/stack-registry.js';
import { summarizeDiscoveryWithOpenAI } from './summarizer.js';

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
            return { state, summary };
        }

        // Description
        const description = await p.text({
            message: 'Briefly describe your project (one sentence):',
            placeholder: parsed.description || input.idea || 'A concise description...',
            initialValue: parsed.description || undefined,
            validate: (val) => (val && val.length >= 10 ? undefined : 'Please provide at least 10 characters'),
        });
        if (p.isCancel(description)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        turns.push({ role: 'assistant', content: 'Describe your project.', timestamp: new Date().toISOString() });
        turns.push({ role: 'user', content: String(description), timestamp: new Date().toISOString() });

        // Objectives
        const objectivesInput = await p.text({
            message: 'Main objectives? (comma-separated, optional):',
            placeholder: parsed.objectives?.join(', '),
        });
        if (p.isCancel(objectivesInput)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        turns.push({ role: 'assistant', content: 'Objectives?', timestamp: new Date().toISOString() });
        turns.push({ role: 'user', content: String(objectivesInput || ''), timestamp: new Date().toISOString() });

        // Target users
        const usersInput = await p.text({
            message: 'Target users? (comma-separated, optional):',
            placeholder: parsed.targetUsers?.join(', '),
        });
        if (p.isCancel(usersInput)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        turns.push({ role: 'assistant', content: 'Target users?', timestamp: new Date().toISOString() });
        turns.push({ role: 'user', content: String(usersInput || ''), timestamp: new Date().toISOString() });

        // Features
        const featuresInput = await p.text({
            message: 'Key features? (comma-separated, optional):',
            placeholder: parsed.features?.join(', '),
        });
        if (p.isCancel(featuresInput)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        turns.push({ role: 'assistant', content: 'Features?', timestamp: new Date().toISOString() });
        turns.push({ role: 'user', content: String(featuresInput || ''), timestamp: new Date().toISOString() });

        // Constraints
        const constraintsInput = await p.text({
            message: 'Constraints? (comma-separated, optional):',
            placeholder: parsed.constraints?.join(', '),
        });
        if (p.isCancel(constraintsInput)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        turns.push({ role: 'assistant', content: 'Constraints?', timestamp: new Date().toISOString() });
        turns.push({ role: 'user', content: String(constraintsInput || ''), timestamp: new Date().toISOString() });

        // Stack suggestion
        const stacks = await getAvailableStacks();
        const stackOptions = stacks.map((s) => ({ label: `${s.name} - ${s.description}`, value: s.name as any }));
        const stackSuggestion = await p.select({
            message: 'Choose a technology stack (you can refine later):',
            options: stackOptions,
            initialValue: parsed.suggestedStack || undefined,
        });
        if (p.isCancel(stackSuggestion)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }
        turns.push({ role: 'assistant', content: 'Choose stack.', timestamp: new Date().toISOString() });
        turns.push({ role: 'user', content: String(stackSuggestion), timestamp: new Date().toISOString() });

        // Initial summary
        let summary = {
            description: String(description),
            objectives: toArray(String(objectivesInput || '')),
            targetUsers: toArray(String(usersInput || '')),
            features: toArray(String(featuresInput || '')),
            constraints: toArray(String(constraintsInput || '')),
            stackSuggestion: String(stackSuggestion || ''),
        } as DiscoverySummary;

        // Branching follow-ups based on stack selection
        if (summary.stackSuggestion?.includes('react-native')) {
            const mobileTargets = await p.text({
                message: 'Target platforms? (iOS, Android, both)',
                placeholder: 'iOS, Android',
            });
            if (p.isCancel(mobileTargets)) { p.cancel('Operation cancelled.'); process.exit(0); }
            summary.extras = { ...(summary.extras || {}), mobileTargets };
        }
        if (summary.stackSuggestion?.includes('nextjs')) {
            const auth = await p.select({
                message: 'Auth strategy?',
                options: [
                    { label: 'Email/password', value: 'email' as any },
                    { label: 'OAuth (Google/Github, etc.)', value: 'oauth' as any },
                    { label: 'Enterprise (SAML/OIDC)', value: 'enterprise' as any },
                ],
            });
            if (p.isCancel(auth)) { p.cancel('Operation cancelled.'); process.exit(0); }
            summary.extras = { ...(summary.extras || {}), auth };
        }

        // OpenAI summarization pass (graceful fallback when no key)
        summary = await summarizeDiscoveryWithOpenAI(input.idea, summary, input.model);

        const state: ConversationState = {
            sessionId,
            phase: 'discovery',
            turns,
        };

        return { state, summary };
    }
}


