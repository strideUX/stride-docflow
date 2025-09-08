import { describe, it, expect } from 'vitest';
import { InMemoryContextStore } from '../context/store.js';
import { FileContextStore } from '../context/file-store.js';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

describe('Context stores', () => {
    it('InMemoryContextStore stores and retrieves data', async () => {
        const store = new InMemoryContextStore();
        const sessionId = 'test-1';
        const updated = await store.update(sessionId, () => ({ a: 1 }));
        expect(updated.id).toBe(sessionId);
        const fetched = await store.get(sessionId);
        expect(fetched?.data).toEqual({ a: 1 });
    });

    it('FileContextStore persists sessions to disk', async () => {
        const tempDir = path.join(os.tmpdir(), `docflow-test-${Math.random().toString(36).slice(2, 8)}`);
        const store = new FileContextStore(tempDir);
        const sessionId = 'disk-1';
        await store.update(sessionId, () => ({ k: 'v' }));
        const fetched = await store.get(sessionId);
        expect(fetched?.data).toEqual({ k: 'v' });
        await fs.remove(tempDir);
    });
});


