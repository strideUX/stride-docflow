import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { DiscoverySummary } from './types.js';
import type { ConversationTurn } from './engine.js';
import { ChatUI } from '../ui/chat.js';

export type Provider = 'openai' | 'anthropic' | 'local';

export interface DocumentRequirement {
    key: keyof DiscoverySummary | 'extras';
    label: string;
    type: 'string' | 'string[]';
    prompt: string;
    required: boolean;
    scope?: 'summary' | 'extras';
    extrasKey?: string; // used when scope === 'extras'
}

const BASE_REQUIREMENTS: DocumentRequirement[] = [
    {
        key: 'description',
        label: 'Project description',
        type: 'string',
        prompt: 'Briefly describe your project in one or two sentences.',
        required: true,
    },
    {
        key: 'stackSuggestion',
        label: 'Preferred technology stack',
        type: 'string',
        prompt: 'Which stack do you prefer (e.g., nextjs-convex, nextjs-supabase, react-native-convex)?',
        required: false,
        scope: 'summary',
    },
    {
        key: 'objectives',
        label: 'Objectives',
        type: 'string[]',
        prompt: 'What are the main objectives? (comma-separated)',
        required: false,
    },
    {
        key: 'targetUsers',
        label: 'Target users',
        type: 'string[]',
        prompt: 'Who are the target users? (comma-separated)',
        required: false,
    },
    {
        key: 'features',
        label: 'Key features',
        type: 'string[]',
        prompt: 'List the key features you want. (comma-separated)',
        required: false,
    },
    {
        key: 'constraints',
        label: 'Constraints',
        type: 'string[]',
        prompt: 'Any constraints or limitations? (comma-separated, optional)',
        required: false,
    },
];

function getDynamicRequirements(current: Partial<DiscoverySummary>): DocumentRequirement[] {
    const reqs: DocumentRequirement[] = [...BASE_REQUIREMENTS];
    const stack = (current.stackSuggestion || '').toLowerCase();
    if (stack.includes('react-native')) {
        reqs.push({
            key: 'extras',
            label: 'Mobile targets',
            type: 'string',
            prompt: 'Target platforms? (iOS, Android, both)',
            required: false,
            scope: 'extras',
            extrasKey: 'mobileTargets',
        });
    }
    if (stack.includes('nextjs')) {
        reqs.push({
            key: 'extras',
            label: 'Auth strategy',
            type: 'string',
            prompt: 'Preferred auth strategy? (email, oauth, enterprise)',
            required: false,
            scope: 'extras',
            extrasKey: 'auth',
        });
    }
    return reqs;
}

export interface OrchestratorOptions {
    aiProvider: Provider;
    model?: string | undefined;
    maxTurns?: number | undefined;
}

export interface OrchestratorHooks {
    onTurn?: (turn: ConversationTurn) => Promise<void> | void;
}

function toArray(text?: string): string[] {
    if (!text || typeof text !== 'string') return [];
    return text
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

function hasProviderKey(provider: Provider): boolean {
    if (provider === 'openai') return !!process.env.OPENAI_API_KEY;
    if (provider === 'anthropic') return !!process.env.ANTHROPIC_API_KEY;
    return true;
}

async function generateQuestionWithAI(
    provider: Provider,
    model: string | undefined,
    requirement: DocumentRequirement,
    history: ConversationTurn[],
    current: Partial<DiscoverySummary>
): Promise<string | null> {
    try {
        if (!hasProviderKey(provider)) return null;
        const outstanding = getDynamicRequirements(current).filter((r: DocumentRequirement) => {
            const value = current[r.key as keyof DiscoverySummary];
            if (r.type === 'string[]') return !Array.isArray(value) || (value as any[]).length === 0;
            return typeof value !== 'string' || (value as string).trim().length === 0;
        }).map((r) => r.label);

        const system = `You are a senior technical consultant doing project discovery for generating:
 - specs.md (vision, objectives, target users, constraints)
 - architecture.md (tech stack rationale, key components)
 - features.md (feature list with priorities)
 - stack.md (chosen stack and integration details)

Ask the single most effective next question to gather missing information. Keep it specific and single-part. Output ONLY the question text.`;
        const convo = history.slice(-6).map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n');
        const user = `Current known fields: ${JSON.stringify(current)}\nOutstanding fields: ${outstanding.join(', ') || 'None'}\nRequirement to ask about now: ${requirement.label}\nConversation so far:\n${convo}`;

        if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
            const resp = await anthropic.messages.create({
                model: model || 'claude-3-5-sonnet-20241022',
                max_tokens: 200,
                system,
                messages: [{ role: 'user', content: user }],
            });
            const content = resp.content[0];
            const text = content && content.type === 'text' ? content.text : '';
            return text?.trim() || null;
        } else {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
            const modelName = model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o';
            const isO1 = modelName.startsWith('o1-');
            const resp = await openai.chat.completions.create({
                model: modelName,
                messages: isO1
                    ? [{ role: 'user', content: `${system}\n\n${user}` }]
                    : [
                          { role: 'system', content: system },
                          { role: 'user', content: user },
                      ],
                ...(isO1 ? {} : { temperature: 0.2 }),
                max_tokens: 200,
            } as any);
            const text = resp.choices[0]?.message?.content || '';
            return text.trim() || null;
        }
    } catch {
        return null;
    }
}

async function streamQuestionWithAI(
    chat: ChatUI,
    provider: Provider,
    model: string | undefined,
    requirement: DocumentRequirement,
    history: ConversationTurn[],
    current: Partial<DiscoverySummary>
): Promise<string> {
    const fallback = async (): Promise<string> => {
        const q = await generateQuestionWithAI(provider, model, requirement, history, current);
        const question = q || requirement.prompt;
        chat.printAssistantHeader('AI');
        chat.appendAssistantChunk(question);
        chat.endAssistantMessage();
        return question;
    };

    try {
        if (!hasProviderKey(provider)) return await fallback();

        const outstanding = getDynamicRequirements(current).filter((r: DocumentRequirement) => {
            const value = current[r.key as keyof DiscoverySummary];
            if (r.type === 'string[]') return !Array.isArray(value) || (value as any[]).length === 0;
            return typeof value !== 'string' || (value as string).trim().length === 0;
        }).map((r) => r.label);

        const system = `You are a senior technical consultant doing project discovery for generating:
 - specs.md (vision, objectives, target users, constraints)
 - architecture.md (tech stack rationale, key components)
 - features.md (feature list with priorities)
 - stack.md (chosen stack and integration details)

Ask the single most effective next question to gather missing information. Keep it specific and single-part. Output ONLY the question text.`;
        const convo = history.slice(-6).map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n');
        const user = `Current known fields: ${JSON.stringify(current)}\nOutstanding fields: ${outstanding.join(', ') || 'None'}\nRequirement to ask about now: ${requirement.label}\nConversation so far:\n${convo}`;

        chat.printAssistantHeader('AI');

        if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
            const stream = await anthropic.messages.create({
                model: model || 'claude-3-5-sonnet-20241022',
                max_tokens: 200,
                system,
                messages: [{ role: 'user', content: user }],
                stream: true,
            } as any);

            let full = '';
            for await (const event of stream as any) {
                if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                    const text = event.delta.text || '';
                    full += text;
                    chat.appendAssistantChunk(text);
                }
            }
            chat.endAssistantMessage();
            return (full.trim() || requirement.prompt);
        } else {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
            const modelName = model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o-mini';
            const isO1 = modelName.startsWith('o1-');
            if (isO1) {
                // o1 models do not support streaming via chat.completions
                return await fallback();
            }
            const stream = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                temperature: 0.2,
                max_tokens: 200,
                stream: true,
            } as any);
            let full = '';
            for await (const part of stream as any) {
                const delta = part.choices?.[0]?.delta?.content || '';
                if (delta) {
                    full += delta;
                    chat.appendAssistantChunk(delta);
                }
            }
            chat.endAssistantMessage();
            return (full.trim() || requirement.prompt);
        }
    } catch {
        return await fallback();
    }
}

export class ConversationOrchestrator {
    private options: OrchestratorOptions;

    constructor(options: OrchestratorOptions) {
        this.options = { ...options, maxTurns: options.maxTurns ?? 12 };
    }

    assessCompleteness(current: Partial<DiscoverySummary>): { done: boolean; missing: DocumentRequirement[] } {
        const requirements = getDynamicRequirements(current);
        const missing = requirements.filter((r: DocumentRequirement) => {
            const val = current[r.key];
            if (r.scope === 'extras') {
                const extras = (current.extras as Record<string, unknown> | undefined) || {};
                const eVal = r.extrasKey ? (extras as any)[r.extrasKey] : undefined;
                if (r.type === 'string[]') return !Array.isArray(eVal) || (eVal as any[]).length === 0;
                return typeof eVal !== 'string' || (eVal as string).trim().length === 0;
            }
            if (r.type === 'string[]') return !Array.isArray(val) || (val as any[]).length === 0;
            return typeof val !== 'string' || (val as string).trim().length === 0;
        });
        return { done: missing.length === 0, missing };
    }

    async manageConversation(
        seed: Partial<DiscoverySummary>,
        history: ConversationTurn[],
        chat: ChatUI,
        hooks?: OrchestratorHooks
    ): Promise<{ turns: ConversationTurn[]; summary: DiscoverySummary }> {
        const turns: ConversationTurn[] = [...history];
        let current: Partial<DiscoverySummary> = { ...seed };

        for (let i = 0; i < (this.options.maxTurns as number); i++) {
            const { done, missing } = this.assessCompleteness(current);
            if (done) break;

            const requirement = missing[0]!; // Ask about the highest priority missing field

            // Generate a dynamic question (streamed to UI, fallback to default)
            const question = await streamQuestionWithAI(
                chat,
                this.options.aiProvider,
                this.options.model,
                requirement,
                turns,
                current
            );

            const qTurn: ConversationTurn = {
                role: 'assistant',
                content: question,
                timestamp: new Date().toISOString(),
            };
            turns.push(qTurn);
            if (hooks?.onTurn) await hooks.onTurn(qTurn);

            const answer = await chat.promptUser('You');

            const aTurn: ConversationTurn = {
                role: 'user',
                content: String(answer),
                timestamp: new Date().toISOString(),
            };
            turns.push(aTurn);
            if (hooks?.onTurn) await hooks.onTurn(aTurn);

            // Map answer into structured summary
            if (requirement.scope === 'extras') {
                const extras: Record<string, unknown> = { ...(current.extras as Record<string, unknown> | undefined) };
                if (requirement.type === 'string') {
                    if (requirement.extrasKey) extras[requirement.extrasKey] = String(answer).trim();
                } else if (requirement.type === 'string[]') {
                    if (requirement.extrasKey) extras[requirement.extrasKey] = toArray(String(answer));
                }
                (current as any).extras = extras;
            } else {
                if (requirement.type === 'string') {
                    (current as any)[requirement.key] = String(answer).trim();
                } else if (requirement.type === 'string[]') {
                    (current as any)[requirement.key] = toArray(String(answer));
                }
            }
        }

        const summaryBase: DiscoverySummary = {
            description: (current.description || seed.description || 'Project generated via conversational mode') as string,
            objectives: (current.objectives as string[] | undefined) || [],
            targetUsers: (current.targetUsers as string[] | undefined) || [],
            features: (current.features as string[] | undefined) || [],
            constraints: (current.constraints as string[] | undefined) || [],
        };
        const summary: DiscoverySummary = { ...summaryBase };
        if (current.stackSuggestion) {
            (summary as any).stackSuggestion = current.stackSuggestion as string;
        }
        if (current.extras) {
            (summary as any).extras = current.extras as Record<string, unknown>;
        }

        return { turns, summary };
    }
}


