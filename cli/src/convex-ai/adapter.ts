import { ChatUI } from '../ui/chat.js';
import { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

export interface ConvexAIStreamOptions {
    provider: 'openai' | 'anthropic' | 'local';
    model: string | undefined;
    sessionId: string;
    system: string;
    user: string;
    agentId?: string;
}

export async function streamQuestionViaConvex(
    chat: ChatUI,
    opts: ConvexAIStreamOptions
): Promise<string | null> {
    // Feature flag to enable Convex AI path when backend action is ready
    const useConvex = String(process.env.DOCFLOW_USE_CONVEX_AI || '').trim() === '1';
    if (!useConvex) return null;

    // Call placeholder server action for now; return null to fallback until implemented
    try {
        const url =
            process.env.CONVEX_URL ||
            process.env.NEXT_PUBLIC_CONVEX_URL ||
            process.env.EXPO_PUBLIC_CONVEX_URL ||
            process.env.DOCFLOW_CONVEX_ADMIN_URL;
        if (!url) return null;
        const client = new ConvexClient(String(url));
        const res = await client.action((api as any).docflow.messages.streamAssistant, {
            sessionId: opts.sessionId,
            system: opts.system,
            user: opts.user,
            provider: opts.provider as any,
            ...(opts.model ? { model: opts.model } : {}),
            ...(opts.agentId ? { agentId: opts.agentId } : {}),
        } as any);
        if ((res as any)?.ok) {
            return '';
        }
        return null;
    } catch {
        return null;
    }
}


