import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { DiscoverySummary, AgentDescriptor } from './types.js';
import type { ConversationTurn } from './engine.js';
import { ChatUI } from '../ui/chat.js';
import { ConversationSessionManager } from './session.js';
import { streamQuestionViaConvex } from '../convex-ai/adapter.js';

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

export type DocumentArea = 'specs' | 'architecture' | 'features' | 'stack';

export interface DocumentGap extends DocumentRequirement {
    doc: DocumentArea;
    weight: number; // priority weight (higher means more urgent)
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

function isArrayFieldMissing(value: unknown): boolean {
    return !Array.isArray(value) || (value as unknown[]).length === 0;
}

function isStringFieldMissing(value: unknown): boolean {
    return typeof value !== 'string' || (value as string).trim().length === 0;
}

function isEnoughForDocs(current: Partial<DiscoverySummary>): boolean {
    const hasDescription = !isStringFieldMissing(current.description);
    const hasObjectives = !isArrayFieldMissing(current.objectives);
    const hasTargetUsers = !isArrayFieldMissing(current.targetUsers);
    const hasFeatures = !isArrayFieldMissing(current.features);
    return hasDescription && hasObjectives && hasTargetUsers && hasFeatures;
}

function computeOutstandingGaps(current: Partial<DiscoverySummary>, history: ConversationTurn[]): DocumentGap[] {
    const gaps: DocumentGap[] = [];

    // Base/specs gaps
    const baseReqs = getDynamicRequirements(current);
    for (const r of baseReqs) {
        let missing = false;
        if (r.scope === 'extras') {
            const extras = (current.extras as Record<string, unknown> | undefined) || {};
            const eVal = r.extrasKey ? (extras as any)[r.extrasKey] : undefined;
            if (r.type === 'string[]') missing = isArrayFieldMissing(eVal);
            else missing = isStringFieldMissing(eVal);
        } else {
            const val = (current as any)[r.key];
            if (r.type === 'string[]') missing = isArrayFieldMissing(val);
            else missing = isStringFieldMissing(val);
        }
        if (missing) {
            gaps.push({ ...(r as any), doc: 'specs', weight: r.required ? 10 : 5 });
        }
    }

    // Architecture gaps (extras-first model)
    const extras = (current.extras as Record<string, unknown> | undefined) || {};
    const lastUser = [...history].reverse().find((t) => t.role === 'user')?.content?.toLowerCase() || '';

    const archExtras: Array<{ key: string; label: string; prompt: string }> = [
        { key: 'platforms', label: 'Target platforms', prompt: 'Are you targeting web, iOS, Android, desktop, or a combination?' },
        { key: 'deployment', label: 'Deployment strategy', prompt: 'How will you deploy? (Vercel, Netlify, self-hosted, app stores)' },
        { key: 'data', label: 'Data storage', prompt: 'What data do you store and which database/backend do you prefer?' },
        { key: 'auth', label: 'Auth strategy', prompt: 'What authentication do you need? (email, OAuth providers, enterprise SSO)' },
        { key: 'testing', label: 'Testing approach', prompt: 'Do you have a preferred testing approach or tools?' },
        { key: 'ciCd', label: 'CI/CD needs', prompt: 'Do you use CI/CD? Which provider and what workflows?' },
    ];
    for (const a of archExtras) {
        const val = (extras as any)[a.key];
        if (isStringFieldMissing(val)) {
            let weight = 4;
            if (lastUser.includes('mobile') || lastUser.includes('react native') || lastUser.includes('ios') || lastUser.includes('android')) {
                if (a.key === 'platforms') weight = 9;
            }
            if (lastUser.includes('testing')) {
                if (a.key === 'testing') weight = 8;
            }
            if (lastUser.includes('ci') || lastUser.includes('cicd') || lastUser.includes('pipeline')) {
                if (a.key === 'ciCd') weight = 8;
            }
            gaps.push({
                key: 'extras',
                label: a.label,
                type: 'string',
                prompt: a.prompt,
                required: false,
                scope: 'extras',
                extrasKey: a.key,
                doc: 'architecture',
                weight,
            });
        }
    }

    // Features prioritization
    if (Array.isArray(current.features) && current.features.length > 0) {
        const hasPriorities = typeof (extras as any).featurePriorities === 'string' && (extras as any).featurePriorities.trim().length > 0;
        if (!hasPriorities) {
            gaps.push({
                key: 'extras',
                label: 'Feature priorities',
                type: 'string',
                prompt: 'Which features are P0 vs P1? (e.g., "P0: auth, feed; P1: notifications")',
                required: false,
                scope: 'extras',
                extrasKey: 'featurePriorities',
                doc: 'features',
                weight: 6,
            });
        }
    }

    // Stack doc - if no stack suggestion, or unclear
    if (isStringFieldMissing(current.stackSuggestion)) {
        gaps.push({
            key: 'stackSuggestion',
            label: 'Preferred technology stack',
            type: 'string',
            prompt: 'Any stack preference? (nextjs-convex, nextjs-supabase, react-native-convex, or tell your constraints)',
            required: false,
            scope: 'summary',
            doc: 'stack',
            weight: 7,
        });
    }

    // If user said "minimal" recently, clarify what minimal means
    if (lastUser.includes('minimal')) {
        const hasMinimalClarified = typeof (extras as any).minimalMeans === 'string' && (extras as any).minimalMeans.trim().length > 0;
        if (!hasMinimalClarified) {
            gaps.push({
                key: 'extras',
                label: 'What does minimal mean?',
                type: 'string',
                prompt: 'When you say minimal, what do you explicitly want to include or avoid?',
                required: false,
                scope: 'extras',
                extrasKey: 'minimalMeans',
                doc: 'specs',
                weight: 9,
            });
        }
    }

    // De-duplicate
    const seen = new Set<string>();
    const unique = gaps.filter((g) => {
        const key = `${g.doc}:${g.scope === 'extras' ? `extras:${g.extrasKey}` : `${String(g.key)}`}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    unique.sort((a, b) => b.weight - a.weight);
    return unique;
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
        const outstanding = computeOutstandingGaps(current, history).map((g) => ({
            doc: g.doc,
            label: g.label,
            field: g.scope === 'extras' ? `extras.${g.extrasKey}` : String(g.key),
            weight: g.weight,
        }));

        const system = `You are a senior technical consultant conducting a discovery interview to generate four documents:
- specs.md: vision, objectives, target users, constraints
- architecture.md: tech stack rationale, key components, platforms, auth, data, deployment, testing/CI
- features.md: key features with priorities (P0, P1)
- stack.md: chosen stack and integration rationale

Guidelines:
- Read the recent conversation and be curious. Ask smart follow-ups based on what the user actually said (e.g., if they say "mobile app", clarify platforms and deployment; if they say "minimal", ask what that means; if they mention testing, ask about testing and CI/CD).
- Choose the SINGLE most impactful next question that will reduce the biggest information gap for the docs above. Do not ask multi-part lists.
- Keep tone natural, consultant-like. Avoid generic phrasing.
- Output ONLY the question text.`;
        const convo = history.slice(-8).map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n');
        const user = `Current known fields (partial JSON): ${JSON.stringify(current)}\nOutstanding gaps: ${JSON.stringify(outstanding)}\nFocus gap: ${requirement.label}\nConversation so far:\n${convo}`;

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

        const outstanding = computeOutstandingGaps(current, history).map((g) => ({
            doc: g.doc,
            label: g.label,
            field: g.scope === 'extras' ? `extras.${g.extrasKey}` : String(g.key),
            weight: g.weight,
        }));

        const system = `You are a senior technical consultant conducting a discovery interview to generate four documents:
- specs.md: vision, objectives, target users, constraints
- architecture.md: tech stack rationale, key components, platforms, auth, data, deployment, testing/CI
- features.md: key features with priorities (P0, P1)
- stack.md: chosen stack and integration rationale

Guidelines:
- Read the recent conversation and be curious. Ask smart follow-ups based on what the user actually said (e.g., if they say "mobile app", clarify platforms and deployment; if they say "minimal", ask what that means; if they mention testing, ask about testing and CI/CD).
- Choose the SINGLE most impactful next question that will reduce the biggest information gap for the docs above. Do not ask multi-part lists.
- Keep tone natural, consultant-like. Avoid generic phrasing.
- Output ONLY the question text.`;
        const convo = history.slice(-8).map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n');
        const user = `Current known fields (partial JSON): ${JSON.stringify(current)}\nOutstanding gaps: ${JSON.stringify(outstanding)}\nRequirement to ask about now: ${requirement.label}\nConversation so far:\n${convo}`;

        chat.printAssistantHeader('AI');
        // Try Convex AI streaming first (feature-flagged), then fall back
        const outstanding2 = computeOutstandingGaps(current, history).map((g) => ({
            doc: g.doc,
            label: g.label,
            field: g.scope === 'extras' ? `extras.${g.extrasKey}` : String(g.key),
            weight: g.weight,
        }));
        const system2 = `You are a senior technical consultant conducting a discovery interview to generate four documents:
- specs.md: vision, objectives, target users, constraints
- architecture.md: tech stack rationale, key components, platforms, auth, data, deployment, testing/CI
- features.md: key features with priorities (P0, P1)
- stack.md: chosen stack and integration rationale

Guidelines:
- Read the recent conversation and be curious. Ask smart follow-ups based on what the user actually said (e.g., if they say "mobile app", clarify platforms and deployment; if they say "minimal", ask what that means; if they mention testing, ask about testing and CI/CD).
- Choose the SINGLE most impactful next question that will reduce the biggest information gap for the docs above. Do not ask multi-part lists.
- Keep tone natural, consultant-like. Avoid generic phrasing.
- Output ONLY the question text.`;
        const convo2 = history.slice(-8).map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n');
        const user2 = `Current known fields (partial JSON): ${JSON.stringify(current)}\nOutstanding gaps: ${JSON.stringify(outstanding2)}\nRequirement to ask about now: ${requirement.label}\nConversation so far:\n${convo2}`;
        const convexAttempt = await streamQuestionViaConvex(chat, {
            provider,
            model,
            sessionId: process.env.DOCFLOW_SESSION_ID || 'unknown',
            system: system2,
            user: user2,
        });
        if (convexAttempt) {
            return convexAttempt;
        }

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
            const modelName = model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o';
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

async function extractFieldsWithAI(
    provider: Provider,
    model: string | undefined,
    history: ConversationTurn[],
    current: Partial<DiscoverySummary>
): Promise<Partial<DiscoverySummary>> {
    try {
        if (!hasProviderKey(provider)) return {};
        const lastUser = [...history].reverse().find((t) => t.role === 'user')?.content || '';
        const outstanding = computeOutstandingGaps(current, history).map((g) => ({
            doc: g.doc,
            label: g.label,
            field: g.scope === 'extras' ? `extras.${g.extrasKey}` : String(g.key),
        }));
        const system = `You are extracting structured discovery data from a conversation. Return STRICT JSON only with fields:
{
  "description": string?,
  "objectives": string[]?,
  "targetUsers": string[]?,
  "features": string[]?,
  "constraints": string[]?,
  "stackSuggestion": string?,
  "extras": {
    "platforms"?: string,
    "deployment"?: string,
    "data"?: string,
    "auth"?: string,
    "testing"?: string,
    "ciCd"?: string,
    "mobileTargets"?: string,
    "featurePriorities"?: string,
    "minimalMeans"?: string
  }
}
Rules:
- Infer fields from the latest user reply when possible, but do not hallucinate.
- Preserve existing values unless the new information is clearly more specific.
- Do not include any text outside the JSON.`;
        const user = `Outstanding gaps: ${JSON.stringify(outstanding)}\nLatest user reply: ${lastUser}\nKnown so far: ${JSON.stringify(current)}\nReturn updated fields as strict JSON.`;

        if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
            const resp = await anthropic.messages.create({
                model: model || 'claude-3-5-sonnet-20241022',
                max_tokens: 400,
                system,
                messages: [{ role: 'user', content: user }],
            });
            const text = resp.content[0] && resp.content[0].type === 'text' ? (resp.content[0] as any).text : '';
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) return {};
            const parsed = JSON.parse(match[0]);
            return parsed as Partial<DiscoverySummary>;
        } else {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
            const modelName = model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o';
            const isO1 = modelName.startsWith('o1-');
            const resp = await openai.chat.completions.create({
                model: modelName,
                messages: isO1 ? [{ role: 'user', content: `${system}\n\n${user}` }] : [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                ...(isO1 ? {} : { temperature: 0 }),
                max_tokens: 400,
            } as any);
            const text = resp.choices[0]?.message?.content || '';
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) return {};
            const parsed = JSON.parse(match[0]);
            return parsed as Partial<DiscoverySummary>;
        }
    } catch {
        return {};
    }
}

function mergeSummary(current: Partial<DiscoverySummary>, update: Partial<DiscoverySummary>): Partial<DiscoverySummary> {
    const merged: Partial<DiscoverySummary> = { ...current };
    if (typeof update.description === 'string' && update.description.trim().length > 0) merged.description = update.description.trim();
    if (Array.isArray(update.objectives) && update.objectives.length > 0) merged.objectives = update.objectives;
    if (Array.isArray(update.targetUsers) && update.targetUsers.length > 0) merged.targetUsers = update.targetUsers;
    if (Array.isArray(update.features) && update.features.length > 0) merged.features = update.features;
    if (Array.isArray(update.constraints) && update.constraints.length > 0) merged.constraints = update.constraints;
    if (typeof (update as any).stackSuggestion === 'string' && (update as any).stackSuggestion.trim().length > 0) (merged as any).stackSuggestion = (update as any).stackSuggestion.trim();
    if (update.extras && typeof update.extras === 'object') {
        merged.extras = { ...(merged.extras as Record<string, unknown> | undefined), ...update.extras } as Record<string, unknown>;
    }
    return merged;
}

function heuristicExtract(answer: string, current: Partial<DiscoverySummary>): Partial<DiscoverySummary> {
    const lower = answer.toLowerCase();
    const update: Partial<DiscoverySummary> = {};
    const extras: Record<string, unknown> = { ...(current.extras as Record<string, unknown> | undefined) };

    if (lower.includes('features') || lower.includes('feature:') || lower.includes('feature ')) {
        const arr = toArray(answer);
        if (arr.length > 0) update.features = arr;
    }
    if (lower.includes('objectives') || lower.includes('objective')) {
        const arr = toArray(answer);
        if (arr.length > 0) update.objectives = arr;
    }
    if (lower.includes('users') || lower.includes('audience') || lower.includes('target')) {
        const arr = toArray(answer);
        if (arr.length > 0) update.targetUsers = arr;
    }
    if (lower.includes('constraint') || lower.includes('limitations')) {
        const arr = toArray(answer);
        if (arr.length > 0) update.constraints = arr;
    }
    if (lower.includes('ios') || lower.includes('android')) {
        (extras as any).platforms = 'iOS and Android';
        (extras as any).mobileTargets = (extras as any).mobileTargets || 'both';
    }
    if (lower.includes('react native')) {
        (update as any).stackSuggestion = 'react-native-convex';
        (extras as any).platforms = (extras as any).platforms || 'iOS and Android';
    }
    if (lower.includes('next.js') || lower.includes('nextjs')) {
        (update as any).stackSuggestion = (update as any).stackSuggestion || 'nextjs-convex';
        (extras as any).platforms = (extras as any).platforms || 'Web';
    }
    if (lower.includes('minimal')) {
        (extras as any).minimalMeans = (extras as any).minimalMeans || 'Keep scope limited to core features and simple UI';
    }
    if (lower.includes('testing')) {
        (extras as any).testing = (extras as any).testing || 'Unit + E2E';
    }
    if (lower.includes('ci/cd') || lower.includes('cicd') || lower.includes('pipeline')) {
        (extras as any).ciCd = (extras as any).ciCd || 'GitHub Actions';
    }
    if (Object.keys(extras).length > 0) (update as any).extras = extras;
    return update;
}

export class ConversationOrchestrator {
    private options: OrchestratorOptions;
    private agent: AgentDescriptor | null = null;

    constructor(options: OrchestratorOptions & { agent?: AgentDescriptor }) {
        const { agent, ...rest } = options as any;
        this.options = { ...rest, maxTurns: rest.maxTurns ?? 12 };
        this.agent = agent || null;
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
        // Consider conversation done when minimal doc set is covered
        return { done: missing.length === 0 || isEnoughForDocs(current), missing };
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

            // Compute adaptive gaps and pick the highest-weight question
            const gaps = computeOutstandingGaps(current, turns);
            const gapToAsk = gaps[0] || missing[0]!;

            // Generate a dynamic question (streamed to UI, fallback to default)
            const question = await streamQuestionWithAI(
                chat,
                this.options.aiProvider,
                this.options.model,
                gapToAsk,
                turns,
                current
            );

            const qTurn: ConversationTurn = {
                role: 'assistant',
                content: question,
                timestamp: new Date().toISOString(),
                ...(this.agent ? { agentId: this.agent.id } : {}),
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

            // AI-assisted extraction into structured fields; fallback to heuristics
            let extracted: Partial<DiscoverySummary> = {};
            try {
                extracted = await extractFieldsWithAI(this.options.aiProvider, this.options.model, turns, current);
            } catch {}
            if (!extracted || Object.keys(extracted).length === 0) {
                extracted = heuristicExtract(String(answer), current);
            }
            current = mergeSummary(current, extracted);

            // Early stop if we have enough for docs
            if (isEnoughForDocs(current)) break;
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


