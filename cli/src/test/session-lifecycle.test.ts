import { describe, it, expect } from 'vitest';
import { ConversationSessionManager } from '../conversation/session.js';
import { InMemoryContextStore } from '../context/store.js';

describe('ConversationSessionManager lifecycle', () => {
	it('creates, appends, loads, and deletes sessions', async () => {
		const store = new InMemoryContextStore();
		const manager = new ConversationSessionManager(store as any);
		const sessionId = 'sess-123';

		await manager.createOrUpdate({ sessionId, phase: 'discovery', turns: [] }, { description: 'x' });
		await manager.appendTurn(sessionId, { role: 'assistant', content: 'Hello', timestamp: new Date().toISOString() });
		const loaded1 = await manager.load(sessionId);
		expect(loaded1).not.toBeNull();
		expect(loaded1!.state.turns.length).toBe(1);

		await manager.delete(sessionId);
		const loaded2 = await manager.load(sessionId);
		expect(loaded2).toBeNull();
	});
});

