import { describe, it, expect } from 'vitest';
import { NoopConversationEngine } from '../conversation/engine.js';

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


