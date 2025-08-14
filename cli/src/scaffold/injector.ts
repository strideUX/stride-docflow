import path from 'path';
import fs from 'fs-extra';
import { BaseScaffold, ScaffoldOptions, ScaffoldResult } from './base-scaffold.js';

export interface InjectionOptions {
	projectPath: string;
	docsPath: string;
}

export class DocInjector extends BaseScaffold {
	async run(options: ScaffoldOptions): Promise<ScaffoldResult> {
		const projectPath = path.resolve(options.destination, options.projectName);
		try {
			await this.inject({ projectPath, docsPath: path.join(options.destination, 'docs') });
			return this.ok(projectPath);
		} catch (error) {
			this.fail('Documentation injection failed');
			return this.err(projectPath, error);
		}
	}

	async inject(options: InjectionOptions): Promise<void> {
		this.start('Injecting documentation into project');
		await this.copyDocs(options.docsPath, options.projectPath);
		this.succeed('Documentation injected');
	}

	private async copyDocs(docsRoot: string, projectRoot: string): Promise<void> {
		// Overwrite README.md, merge package.json, skip src/ by default
		const entries = await fs.readdir(docsRoot);
		for (const entry of entries) {
			const src = path.join(docsRoot, entry);
			const dest = path.join(projectRoot, entry);
			const stat = await fs.stat(src);
			if (stat.isDirectory()) {
				if (entry === 'src') {
					continue;
				}
				await fs.ensureDir(dest);
				await this.copyDocs(src, dest);
			} else if (entry === 'README.md') {
				await fs.copyFile(src, dest);
			} else if (entry === 'package.json') {
				await this.mergePackageJson(src, dest);
			} else {
				await fs.copyFile(src, dest);
			}
		}
	}

	private async mergePackageJson(srcPath: string, destPath: string): Promise<void> {
		const src = await fs.readJson(srcPath).catch(() => ({}));
		const dest = await fs.readJson(destPath).catch(() => ({}));
		const merged = {
			name: dest.name,
			version: dest.version || '1.0.0',
			scripts: { ...(dest.scripts || {}), ...(src.scripts || {}) },
			dependencies: { ...(dest.dependencies || {}), ...(src.dependencies || {}) },
			devDependencies: { ...(dest.devDependencies || {}), ...(src.devDependencies || {}) }
		};
		await fs.writeJson(destPath, merged, { spaces: 2 });
	}
}