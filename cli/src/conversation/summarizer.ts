import { OpenAI } from 'openai';
import { DiscoverySummary } from './types.js';

export async function summarizeDiscoveryWithOpenAI(
    idea: string | undefined,
    partial: DiscoverySummary,
    model?: string
): Promise<DiscoverySummary> {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return partial;
        }
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        const sys = `You are assisting with project discovery for a documentation generator.
Return strict JSON with fields: description, objectives[], targetUsers[], features[], constraints[], stackSuggestion.`;
        const user = `Project idea: ${idea || ''}
Partial summary: ${JSON.stringify(partial)}`;
        const modelName = model || process.env.DOCFLOW_DEFAULT_MODEL || 'gpt-4o';
        const isO1 = modelName.startsWith('o1-');
        const resp = await openai.chat.completions.create({
            model: modelName,
            messages: isO1 ? [{ role: 'user', content: `${sys}

${user}` }] : [
                { role: 'system', content: sys },
                { role: 'user', content: user },
            ],
            ...(isO1 ? {} : { temperature: 0.2 }),
            max_tokens: 800,
        } as any);
        const text = resp.choices[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return partial;
        const parsed = JSON.parse(match[0]);
        const merged: DiscoverySummary = {
            description: parsed.description || partial.description,
            objectives: parsed.objectives || partial.objectives,
            targetUsers: parsed.targetUsers || partial.targetUsers,
            features: parsed.features || partial.features,
            constraints: parsed.constraints || partial.constraints,
            stackSuggestion: parsed.stackSuggestion || partial.stackSuggestion,
            extras: { ...partial.extras },
        };
        return merged;
    } catch {
        return partial;
    }
}


