import { describe, it, expect } from 'vitest';
import { generateWithAI } from '../generators/ai-generator.js';

const baseContext = {
	projectName: 'Counter App',
	description: 'A simple counter app that demonstrates React Native + Convex.',
	technologies: 'React Native, Convex, TypeScript',
	stack: 'react-native-convex',
	stackDescription: 'React Native with Convex for cross-platform mobile apps',
	stackFeatures: { auth: true, database: true, realtime: true, mobile: true, deployment: ['expo'] },
	objectives: 'Increment/decrement counters, Persist state with Convex',
	targetUsers: 'Mobile users',
	features: 'Counter screen, Real-time sync',
	today: '2025-01-01',
};

describe('AI generator', () => {
	it('replaces HTML DYNAMIC comments with content (local provider)', async () => {
		const input = '# Title\n\n<!-- DYNAMIC: [Project Name] -->';
		const out = await generateWithAI(input, baseContext, 'docs/test.md', { aiProvider: 'local', research: false, dryRun: false, output: '/tmp' });
		expect(out).not.toContain('<!-- DYNAMIC:');
		expect(out).toContain('Generated locally');
	});

	it('replaces bracket placeholders with content (local provider)', async () => {
		const input = '# Title\n\n[AI Content: Project overview - To be generated]';
		const out = await generateWithAI(input, baseContext, 'docs/test.md', { aiProvider: 'local', research: false, dryRun: false, output: '/tmp' });
		expect(out).not.toContain('[AI Content:');
		expect(out).toContain('Generated locally');
	});

	it('falls back to local when API keys missing', async () => {
		const input = '# Title\n\n<!-- DYNAMIC: [Overview for this file] -->';
		const out = await generateWithAI(input, baseContext, 'docs/test.md', { aiProvider: 'openai', research: false, dryRun: false, output: '/tmp' });
		expect(out).not.toContain('<!-- DYNAMIC:');
		expect(out).toContain('Generated locally');
	});
});