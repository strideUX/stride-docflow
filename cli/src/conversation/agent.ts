import type { AgentDescriptor } from './types.js';

export interface Agent {
    descriptor: AgentDescriptor;
}

export function createDiscoveryAgent(): Agent {
    return {
        descriptor: {
            id: 'discovery-default',
            name: 'Discovery Agent',
            role: 'discovery',
        },
    };
}


