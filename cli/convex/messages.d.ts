export declare const appendMessage: import("convex/server").RegisteredMutation<"public", {
    sessionId: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
}, Promise<void>>;
export declare const listMessages: import("convex/server").RegisteredQuery<"public", {
    sessionId: string;
}, Promise<any>>;
