import { DiscoverySummary } from './types.js';
import { ProjectData } from '../prompts/project.js';

function toProjectSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

export interface StackInfo {
    name: string;
    description: string;
    technologies: string[];
}

function chooseStackFromSuggestion(suggestion: string | undefined, stacks: StackInfo[]): string {
    if (!stacks || stacks.length === 0) return 'nextjs-convex';
    if (!suggestion) return stacks[0]!.name;
    const s = suggestion.toLowerCase();
    // exact
    const exact = stacks.find((x) => x.name.toLowerCase() === s);
    if (exact) return exact.name;
    // startsWith or includes
    const starts = stacks.find((x) => x.name.toLowerCase().startsWith(s) || s.startsWith(x.name.toLowerCase()));
    if (starts) return starts.name;
    const includes = stacks.find((x) => x.name.toLowerCase().includes(s) || s.includes(x.name.toLowerCase()));
    if (includes) return includes.name;
    // tech keyword mapping
    if (s.includes('supabase')) {
        const supa = stacks.find((x) => x.name.toLowerCase().includes('supabase'));
        if (supa) return supa.name;
    }
    if (s.includes('convex')) {
        const conv = stacks.find((x) => x.name.toLowerCase().includes('convex'));
        if (conv) return conv.name;
    }
    if (s.includes('react-native')) {
        const rn = stacks.find((x) => x.name.toLowerCase().includes('react-native'));
        if (rn) return rn.name;
    }
    return stacks[0]!.name;
}

export function buildProjectDataFromSummary(
    summary: DiscoverySummary,
    aiProvider: 'openai' | 'anthropic' | 'local',
    model: string | undefined,
    stacks: StackInfo[]
): ProjectData {
    const name = summary.name && summary.name.trim().length > 0 ? summary.name : 'Project App';
    const stack = chooseStackFromSuggestion((summary as any).stackSuggestion as string | undefined, stacks);
    const projectSlug = toProjectSlug(name);

    const project: ProjectData = {
        name,
        projectSlug,
        description: summary.description || 'Project generated via conversational mode',
        stack,
        objectives: summary.objectives || [],
        targetUsers: summary.targetUsers || [],
        features: summary.features || [],
        constraints: summary.constraints || [],
        timeline: undefined,
        designInput: undefined,
        aiProvider,
        model,
    } as ProjectData;

    return project;
}


