export interface DiscoverySummary {
    name?: string;
    description: string;
    objectives?: string[];
    targetUsers?: string[];
    features?: string[];
    constraints?: string[];
    stackSuggestion?: string;
    extras?: Record<string, unknown>;
}

export interface AgentDescriptor {
    id: string;
    name: string;
    role: 'discovery';
}


