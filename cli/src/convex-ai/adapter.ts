import { ChatUI } from '../ui/chat.js';

export interface ConvexAIStreamOptions {
    provider: 'openai' | 'anthropic' | 'local';
    model?: string;
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

    // Placeholder: server-driven streaming not yet implemented. Return null to trigger fallback.
    return null;
}


