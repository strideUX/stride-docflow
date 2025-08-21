import { ChatUI } from '../ui/chat.js';
import { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

export interface ConvexAIStreamOptions {
    provider: 'openai' | 'anthropic' | 'local';
    model: string | undefined; // accept undefined explicitly due to exactOptionalPropertyTypes
    sessionId: string;
    system: string;
    user: string;
    agentId?: string;
}

export async function streamQuestionViaConvex(
    chat: ChatUI,
    opts: ConvexAIStreamOptions
): Promise<string | null> {
    // Re-enable Convex streaming now that deployment is fixed
    const useConvex = String(process.env.DOCFLOW_USE_CONVEX_AI || '').trim() === '1';
    if (!useConvex) return null;

    try {
        const url = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL || process.env.DOCFLOW_CONVEX_ADMIN_URL;
        if (!url) return null;
        const client = new ConvexClient(String(url));

        // Call the namespaced Convex action with detailed error logging
        console.log('🔄 Attempting Convex streaming...');
        const res = await client.action(api.docflow.messages.streamAssistant, {
            sessionId: opts.sessionId,
            system: opts.system,
            user: opts.user,
            provider: opts.provider as any,
            model: opts.model as string | undefined,
            agentId: opts.agentId,
        } as any);

        console.log('✅ Convex streaming response:', res);
        if ((res as any)?.ok) {
            return ''; // Return empty string as content is streamed via callbacks
        }
        return null;
    } catch (error) {
        console.error('❌ Convex streaming error:', error);
        return null;
    }
}


