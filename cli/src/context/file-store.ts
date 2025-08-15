import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { ContextStore, SessionContext } from './store.js';

export class FileContextStore implements ContextStore {
    private rootDir: string;

    constructor(rootDir?: string) {
        const home = os.homedir();
        this.rootDir = rootDir || path.join(home, '.docflow', 'sessions');
    }

    private filePath(sessionId: string): string {
        return path.join(this.rootDir, `${sessionId}.json`);
    }

    async get(sessionId: string): Promise<SessionContext | null> {
        const file = this.filePath(sessionId);
        if (!(await fs.pathExists(file))) return null;
        const data = await fs.readJSON(file);
        return data as SessionContext;
    }

    async set(session: SessionContext): Promise<void> {
        await fs.ensureDir(this.rootDir);
        const file = this.filePath(session.id);
        await fs.writeJSON(file, session, { spaces: 2 });
    }

    async update(
        sessionId: string,
        updater: (previous: Record<string, unknown>) => Record<string, unknown>
    ): Promise<SessionContext> {
        await fs.ensureDir(this.rootDir);
        const file = this.filePath(sessionId);
        const now = new Date().toISOString();
        let current: SessionContext | null = null;
        if (await fs.pathExists(file)) {
            current = (await fs.readJSON(file)) as SessionContext;
        }
        const updated: SessionContext = current
            ? {
                  ...current,
                  data: updater(current.data || {}),
                  updatedAt: now,
              }
            : {
                  id: sessionId,
                  data: updater({}),
                  createdAt: now,
                  updatedAt: now,
              };
        await fs.writeJSON(file, updated, { spaces: 2 });
        return updated;
    }
}


