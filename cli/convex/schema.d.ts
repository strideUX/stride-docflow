declare const _default: import("convex/server").SchemaDefinition<{
    docflow_sessions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        data: any;
        sessionId: string;
        createdAt: string;
        updatedAt: string;
    }, {
        sessionId: import("convex/values").VString<string, "required">;
        data: import("convex/values").VAny<any, "required", string>;
        createdAt: import("convex/values").VString<string, "required">;
        updatedAt: import("convex/values").VString<string, "required">;
    }, "required", "data" | "sessionId" | "createdAt" | "updatedAt" | `data.${string}`>, {
        by_sessionId: ["sessionId", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
