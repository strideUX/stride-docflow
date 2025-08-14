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
		try {
			await execa('npm', ['install', 'convex', 'react', 'react-native'], { 
				cwd: options.projectPath, 
				stdio: 'pipe',
				timeout: 120000 // 2 minutes
			});
			this.succeed('Convex dependencies installed');
		} catch (error) {
			this.fail('Failed to install Convex dependencies');
			throw error;
		}

		console.log('\n🔄 Initializing Convex - this may require your input...');
		console.log('   Please respond to any Convex setup prompts that appear below:\n');
		
		this.start('Setting up Convex project');
		try {
			await execa('npx', ['--yes', 'convex', 'dev', '--once'], { 
				cwd: options.projectPath, 
				stdio: 'inherit',
				timeout: 180000 // 3 minutes
			});
			this.succeed('Convex initialized');
		} catch (error) {
			this.fail('Convex initialization failed or timed out');
			console.log('\n⚠️  Convex setup incomplete. You can finish setup later with:');
			console.log(`   cd ${options.projectPath}`);
			console.log('   npx convex dev --once\n');
			// Don't throw - continue with project creation
		}

		this.start('Configuring Convex schema');
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
