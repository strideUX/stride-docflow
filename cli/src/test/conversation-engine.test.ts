import { describe, it, expect } from 'vitest';
import { NoopConversationEngine, RealConversationEngine } from '../conversation/engine.js';
import { summarizeDiscoveryWithOpenAI } from '../conversation/summarizer.js';

describe('NoopConversationEngine', () => {
    it('starts and returns a minimal summary', async () => {
        const engine = new NoopConversationEngine();
        const result = await engine.start({ idea: 'Build a todo app', aiProvider: 'local' });
        expect(result.state.sessionId).toMatch(/^conv-/);
        expect(result.state.phase).toBe('discovery');
        expect(result.summary.description).toContain('todo');
        expect(result.state.turns.length).toBeGreaterThan(0);
    });
});

describe('RealConversationEngine (non-interactive)', () => {
    it('returns a seed summary from idea without prompting when nonInteractive', async () => {
        const engine = new RealConversationEngine();
        const result = await engine.start({ idea: 'A simple todo app for teams', aiProvider: 'local' }, { nonInteractive: true });
        expect(result.state.sessionId).toMatch(/^conv-/);
        expect(result.summary.description).toBeTruthy();
        expect(Array.isArray(result.summary.objectives)).toBe(true);
    });
});

describe('Summarizer', () => {
    it('merges partial summary with OpenAI result (falls back without key)', async () => {
        const out = await summarizeDiscoveryWithOpenAI('An app', { description: 'test' }, 'gpt-4o');
        expect(out.description).toBeTruthy();
    });
});


