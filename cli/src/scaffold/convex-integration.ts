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
        // Decoupled: Do not run Convex setup during project creation.
        // Only ensure minimal structure so docs/tasks can reference it.
        try {
            await this.ensureConvexStructure(projectPath);
            return this.ok(projectPath);
        } catch (error) {
            this.fail('Convex minimal structure setup failed');
            return this.err(projectPath, error);
        }
	}

    async setup(_options: ConvexSetupOptions): Promise<void> {
        // Deprecated in favor of post-generation task. Intentionally no-op.
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
