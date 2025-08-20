export declare const upsertSession: import("convex/server").RegisteredMutation<"public", {
    agentId?: string;
    data: any;
    sessionId: string;
}, Promise<import("convex/values").GenericId<"docflow_sessions">>>;
export declare const getSession: import("convex/server").RegisteredQuery<"public", {
    sessionId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"docflow_sessions">;
    _creationTime: number;
    agentId?: string;
    data: any;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
} | null>>;
export declare const deleteSession: import("convex/server").RegisteredMutation<"public", {
    sessionId: string;
}, Promise<void>>;
