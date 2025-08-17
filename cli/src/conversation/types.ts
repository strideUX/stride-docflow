export interface DiscoverySummary {
    name?: string;
    description?: string;
    objectives?: string[];
    targetUsers?: string[];
    features?: string[];
    constraints?: string[];
    stackSuggestion?: string;
    extras?: Record<string, unknown>;
}


