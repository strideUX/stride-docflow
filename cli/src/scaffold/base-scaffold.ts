import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';

export interface ScaffoldOptions {
	projectName: string;
	destination: string;
}

export interface ScaffoldResult {
	success: boolean;
	projectPath: string;
	messages: string[];
}

export abstract class BaseScaffold {
	protected spinner = ora({ color: 'cyan' });
	protected messages: string[] = [];

	abstract run(options: ScaffoldOptions): Promise<ScaffoldResult>;

	protected async ensureDir(dirPath: string): Promise<void> {
		await fs.ensureDir(dirPath);
	}

	protected resolve(...segments: string[]): string {
		return path.resolve(...segments);
	}

	protected start(text: string): void {
		this.spinner.start(text);
	}

	protected succeed(text: string): void {
		this.spinner.succeed(text);
	}

	protected fail(text: string): void {
		this.spinner.fail(text);
	}

	protected info(text: string): void {
		this.spinner.info(text);
	}

	protected pushMessage(text: string): void {
		this.messages.push(text);
	}

	protected ok(projectPath: string): ScaffoldResult {
		return { success: true, projectPath, messages: this.messages };
	}

	protected err(projectPath: string, error: unknown): ScaffoldResult {
		const message = error instanceof Error ? error.message : String(error);
		this.pushMessage(`Error: ${message}`);
		return { success: false, projectPath, messages: this.messages };
	}
}