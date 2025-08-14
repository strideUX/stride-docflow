import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { BaseScaffold, ScaffoldOptions, ScaffoldResult } from './base-scaffold.js';

export class ReactNativeExpoScaffold extends BaseScaffold {
	async run(options: ScaffoldOptions): Promise<ScaffoldResult> {
		const projectDir = path.resolve(options.destination, options.projectName);
		try {
			this.start('Creating Expo app');
			await this.ensureDir(options.destination);
			await execa('npx', ['--yes', 'create-expo-app@latest', options.projectName, '--template', 'expo-template-blank-typescript'], {
				cwd: options.destination,
				stdio: 'inherit'
			});
			this.succeed('Expo app created');

			this.start('Configuring Expo project');
			await this.configureExpoProject(projectDir);
			this.succeed('Expo project configured');

			return this.ok(projectDir);
		} catch (error) {
			this.fail('Expo scaffold failed');
			return this.err(projectDir, error);
		}
	}

	private async configureExpoProject(projectDir: string): Promise<void> {
		// Ensure TypeScript is set (template already TS), add recommended scripts
		const packageJsonPath = path.join(projectDir, 'package.json');
		const pkg = await fs.readJson(packageJsonPath);
		pkg.scripts = {
			...pkg.scripts,
			start: pkg.scripts?.start ?? 'expo start',
			android: pkg.scripts?.android ?? 'expo run:android',
			ios: pkg.scripts?.ios ?? 'expo run:ios',
			web: pkg.scripts?.web ?? 'expo run:web'
		};
		await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
	}
}