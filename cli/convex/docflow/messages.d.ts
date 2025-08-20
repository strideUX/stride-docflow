export declare const appendMessage: import("convex/server").RegisteredMutation<"public", {
    agentId?: string;
    chunk?: boolean;
    sessionId: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
}, Promise<void>>;
export declare const listMessages: import("convex/server").RegisteredQuery<"public", {
    sessionId: string;
}, Promise<any>>;
export declare const streamAssistant: import("convex/server").RegisteredAction<"public", {
    model?: string;
    agentId?: string;
    user: string;
    system: string;
    sessionId: string;
    provider: "openai" | "local" | "anthropic";
}, Promise<{
    readonly ok: true;
} | {
    readonly ok: false;
}>>;
