import * as p from '@clack/prompts';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { DiscoverySummary } from './types.js';
import type { ConversationTurn } from './engine.js';

export type Provider = 'openai' | 'anthropic' | 'local';

export interface DocumentRequirement {
    key: keyof DiscoverySummary;
    label: string;
    type: 'string' | 'string[]';
    prompt: string;
    required: boolean;
}

const REQUIREMENTS: DocumentRequirement[] = [
    {
        key: 'description',
        label: 'Project description',
        type: 'string',
        prompt: 'Briefly describe your project in one or two sentences.',
        required: true,
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

export interface OrchestratorOptions {
    aiProvider: Provider;
    model?: string;
    maxTurns?: number;
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
        const outstanding = REQUIREMENTS.filter((r) => {
            const value = current[r.key as keyof DiscoverySummary];
            if (r.type === 'string[]') return !Array.isArray(value) || (value as any[]).length === 0;
            return typeof value !== 'string' || (value as string).trim().length === 0;
        }).map((r) => r.label);

        const system = `You are a senior technical consultant doing project discovery to generate documentation (specs.md, architecture.md, features.md, stack.md).
Ask the single most effective next question to gather missing information. Output ONLY the question text.`;
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

export class ConversationOrchestrator {
    private options: OrchestratorOptions;

    constructor(options: OrchestratorOptions) {
        this.options = { ...options, maxTurns: options.maxTurns ?? 12 };
    }

    assessCompleteness(current: Partial<DiscoverySummary>): { done: boolean; missing: DocumentRequirement[] } {
        const missing = REQUIREMENTS.filter((r) => {
            const val = current[r.key];
            if (r.type === 'string[]') return !Array.isArray(val) || (val as any[]).length === 0;
            return typeof val !== 'string' || (val as string).trim().length === 0;
        });
        return { done: missing.length === 0, missing };
    }

    async manageConversation(
        seed: Partial<DiscoverySummary>,
        history: ConversationTurn[]
    ): Promise<{ turns: ConversationTurn[]; summary: DiscoverySummary }> {
        const turns: ConversationTurn[] = [...history];
        let current: Partial<DiscoverySummary> = { ...seed };

        for (let i = 0; i < (this.options.maxTurns as number); i++) {
            const { done, missing } = this.assessCompleteness(current);
            if (done) break;

            const requirement = missing[0]!; // Ask about the highest priority missing field

            // Generate a dynamic question (fallback to default prompt)
            let question = await generateQuestionWithAI(
                this.options.aiProvider,
                this.options.model,
                requirement,
                turns,
                current
            );
            if (!question) question = requirement.prompt;

            const qTurn: ConversationTurn = {
                role: 'assistant',
                content: question,
                timestamp: new Date().toISOString(),
            };
            turns.push(qTurn);

            const answer = await p.text({ message: question });
            if (p.isCancel(answer)) {
                p.cancel('Operation cancelled.');
                process.exit(0);
            }

            const aTurn: ConversationTurn = {
                role: 'user',
                content: String(answer),
                timestamp: new Date().toISOString(),
            };
            turns.push(aTurn);

            // Map answer into structured summary
            if (requirement.type === 'string') {
                current[requirement.key] = String(answer).trim();
            } else if (requirement.type === 'string[]') {
                current[requirement.key] = toArray(String(answer));
            }
        }

        const summary: DiscoverySummary = {
            description: current.description || seed.description || 'Project generated via conversational mode',
            objectives: current.objectives || [],
            targetUsers: current.targetUsers || [],
            features: current.features || [],
            constraints: current.constraints || [],
            stackSuggestion: current.stackSuggestion,
            extras: current.extras,
        };

        return { turns, summary };
    }
}


