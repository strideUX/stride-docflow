import { MCPClient, createDefaultMCPClient } from './client.js';

export interface RegisteredTool {
	name: string;
	description?: string;
	requiredAuthEnv?: string[];
}

export class MCPToolRegistry {
	private client: MCPClient | null = null;
	private manualTools: Map<string, RegisteredTool> = new Map();

	async init(client?: MCPClient): Promise<void> {
		this.client = client ?? (await createDefaultMCPClient());
	}

	register(tool: RegisteredTool): void {
		this.manualTools.set(tool.name, tool);
	}

	availableTools(): string[] {
		const auto = this.client?.state.tools ?? [];
		const manual = [...this.manualTools.keys()];
		return Array.from(new Set([...auto, ...manual]));
	}

	has(toolName: string): boolean {
		return this.availableTools().includes(toolName);
	}

	assertAuth(toolName: string): void {
		const t = this.manualTools.get(toolName);
		if (!t?.requiredAuthEnv) return;
		const missing = t.requiredAuthEnv.filter((k) => !process.env[k]);
		if (missing.length > 0) {
			throw new Error(`Missing required auth env for ${toolName}: ${missing.join(', ')}`);
		}
	}

	async call(tool: string, parameters: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
		if (!this.client) {
			await this.init();
		}
		this.assertAuth(tool);
		return await this.client!.callTool(tool, parameters);
	}
}

export const toolRegistry = new MCPToolRegistry();
