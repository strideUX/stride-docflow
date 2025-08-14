import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateDocs } from '../generators/docs.js';

const sampleProject = {
	name: 'Counter App',
	projectSlug: 'counter-app',
	description: 'A simple counter app that demonstrates React Native + Convex.',
	stack: 'react-native-convex',
	objectives: ['Increment/decrement counters', 'Persist state with Convex'],
	targetUsers: ['Mobile users'],
	features: ['Counter screen', 'Real-time sync'],
	constraints: ['Mobile-first'],
	designInput: { vibe: 'Playful' },
	aiProvider: 'local',
	model: undefined,
} as any;

describe('Doc generation (local provider)', () => {
	it('replaces all DYNAMIC placeholders with content', async () => {
		const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'docflow-test-'));
		const res = await generateDocs(sampleProject, {
			output: outDir,
			aiProvider: 'local',
			model: undefined,
			research: false,
			dryRun: false,
		});

		// Read all generated files
		for (const file of res.filesGenerated) {
			const content = await fs.readFile(file, 'utf-8');
			// No DYNAMIC markers should remain
			expect(content).not.toMatch(/<!-- DYNAMIC: \[.*?\] -->/);
			// No original placeholder string should remain
			expect(content).not.toContain('[AI Content:');
		}
	});
});