import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { BaseScaffold, ScaffoldOptions, ScaffoldResult } from './base-scaffold.js';

export interface ConvexSetupOptions {
	projectPath: string;
}

export class ConvexIntegration extends BaseScaffold {
	async run(options: ScaffoldOptions): Promise<ScaffoldResult> {
		const projectPath = path.resolve(options.destination, options.projectName);
		try {
			await this.setup({ projectPath });
			return this.ok(projectPath);
		} catch (error) {
			this.fail('Convex integration failed');
			return this.err(projectPath, error);
		}
	}

	async setup(options: ConvexSetupOptions): Promise<void> {
		this.start('Adding Convex dependencies');
		await execa('npm', ['install', 'convex', 'react', 'react-native'], { cwd: options.projectPath, stdio: 'inherit' });
		this.succeed('Convex dependencies installed');

		this.start('Initializing Convex');
		await execa('npx', ['--yes', 'convex', 'dev', '--once'], { cwd: options.projectPath, stdio: 'inherit' });
		this.succeed('Convex initialized');

		this.start('Configuring Convex schema and auth');
		await this.ensureConvexStructure(options.projectPath);
		this.succeed('Convex configured');
	}

	private async ensureConvexStructure(projectPath: string): Promise<void> {
		const convexDir = path.join(projectPath, 'convex');
		await fs.ensureDir(convexDir);
		const schemaPath = path.join(convexDir, 'schema.ts');
		if (!(await fs.pathExists(schemaPath))) {
			await fs.writeFile(schemaPath, `import { v } from 'convex/values';
export default {} as const;
`);
		}
	}
}
