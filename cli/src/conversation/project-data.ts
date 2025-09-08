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
    
    // exact match first
    const exact = stacks.find((x) => x.name.toLowerCase() === s);
    if (exact) return exact.name;
    
    // startsWith or includes
    const starts = stacks.find((x) => x.name.toLowerCase().startsWith(s) || s.startsWith(x.name.toLowerCase()));
    if (starts) return starts.name;
    const includes = stacks.find((x) => x.name.toLowerCase().includes(s) || s.includes(x.name.toLowerCase()));
    if (includes) return includes.name;
    
    // Priority-based tech keyword mapping (most specific combinations first)
    
    // 1. React Native + Convex combination (highest priority)
    if ((s.includes('react') && s.includes('native') && s.includes('convex')) || 
        (s.includes('expo') && s.includes('convex'))) {
        const rn = stacks.find((x) => x.name.toLowerCase() === 'react-native-convex');
        if (rn) return rn.name;
    }
    
    // 2. React Native (without backend specified)
    if (s.includes('react-native') || s.includes('expo')) {
        const rn = stacks.find((x) => x.name.toLowerCase().includes('react-native'));
        if (rn) return rn.name;
    }
    
    // 3. Next.js + Supabase combination
    if (s.includes('next') && s.includes('supabase')) {
        const next = stacks.find((x) => x.name.toLowerCase() === 'nextjs-supabase');
        if (next) return next.name;
    }
    
    // 4. Next.js (without backend specified)
    if (s.includes('next')) {
        const next = stacks.find((x) => x.name.toLowerCase().includes('nextjs'));
        if (next) return next.name;
    }
    
    // 5. Individual backend preferences (only if no frontend specified)
    if (s.includes('supabase') && !s.includes('next') && !s.includes('react')) {
        const supa = stacks.find((x) => x.name.toLowerCase().includes('supabase'));
        if (supa) return supa.name;
    }
    if (s.includes('convex') && !s.includes('next') && !s.includes('react')) {
        const conv = stacks.find((x) => x.name.toLowerCase().includes('convex'));
        if (conv) return conv.name;
    }
    
    // Fallback to first stack
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


