import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { z } from 'zod';
import {
	MCPConnectionState,
	MCPServerConfig,
	MCPToolCall,
	MCPToolResult
} from './types.js';

// Minimal MCP stdio protocol wrapper without hard-coding server specifics.
// We keep the interface narrow to allow graceful fallback when unavailable.

export class MCPClient extends EventEmitter {
	private servers: Map<string, ChildProcessWithoutNullStreams> = new Map();
	private toolsByServer: Map<string, Set<string>> = new Map();
	private connectionState: MCPConnectionState = { connected: false, tools: [] };
	private requestIdCounter = 0;
	private pending: Map<string, (result: MCPToolResult) => void> = new Map();

	constructor(private readonly configs: MCPServerConfig[] = []) {
		super();
	}

	get state(): MCPConnectionState {
		return { ...this.connectionState, tools: [...this.connectionState.tools] };
	}

	// Simple JSON-RPC-like envelope used by popular MCP servers over stdio
	private buildRequest(method: string, params: Record<string, unknown>): string {
		const id = `${Date.now()}-${++this.requestIdCounter}`;
		return JSON.stringify({ jsonrpc: '2.0', id, method, params });
	}

	private parseMessage(line: string): { id?: string; result?: unknown; error?: string; method?: string } | null {
		try {
			const msg = JSON.parse(line);
			return msg;
		} catch {
			return null;
		}
	}

	private registerServerEvents(name: string, proc: ChildProcessWithoutNullStreams): void {
		let buffer = '';
		proc.stdout.setEncoding('utf-8');
		proc.stdout.on('data', (chunk: string) => {
			buffer += chunk;
			let idx;
			while ((idx = buffer.indexOf('\n')) !== -1) {
				const line = buffer.slice(0, idx);
				buffer = buffer.slice(idx + 1);
				const msg = this.parseMessage(line);
				if (!msg) continue;

				if (msg.method === 'mcp/tools') {
					const tools = Array.isArray((msg as any).result) ? (msg as any).result as string[] : [];
					this.toolsByServer.set(name, new Set(tools));
					this.refreshTools();
					continue;
				}

				if (msg.id) {
					const resolver = this.pending.get(msg.id);
					if (resolver) {
						this.pending.delete(msg.id);
						const hasError = typeof (msg as any).error === 'string' && (msg as any).error.length > 0;
						const response: MCPToolResult = hasError
							? { success: false, data: (msg as any).result, error: (msg as any).error as string }
							: { success: true, data: (msg as any).result };
						resolver(response);
					}
				}
			}
		});

		proc.stderr.setEncoding('utf-8');
		proc.stderr.on('data', (err: string) => {
			this.connectionState.lastError = err.trim();
			this.emit('error', new Error(`[MCP:${name}] ${err.trim()}`));
		});

		proc.on('exit', () => {
			this.servers.delete(name);
			this.toolsByServer.delete(name);
			this.refreshTools();
			if (this.servers.size === 0) {
				this.connectionState.connected = false;
			}
		});
	}

	private refreshTools(): void {
		const tools = new Set<string>();
		for (const set of this.toolsByServer.values()) {
			for (const t of set) tools.add(t);
		}
		this.connectionState.tools = [...tools];
	}

	async connect(): Promise<void> {
		// Auto-discover from user config and env
		const discovered = await this.discoverServers();
		const allConfigs = [...discovered, ...this.configs];

		for (const cfg of allConfigs) {
			if (this.servers.has(cfg.name)) continue;
			try {
				const proc = spawn(cfg.command, cfg.args ?? [], {
					env: { ...process.env, ...(cfg.env || {}) },
					stdio: ['pipe', 'pipe', 'pipe']
				});
				this.servers.set(cfg.name, proc);
				this.registerServerEvents(cfg.name, proc);

				// Request tools list if server supports it
				const id = `${Date.now()}-${++this.requestIdCounter}`;
				const req = JSON.stringify({ jsonrpc: '2.0', id, method: 'mcp/list_tools', params: {} });
				proc.stdin.write(req + '\n');
			} catch (err) {
				this.connectionState.lastError = err instanceof Error ? err.message : String(err);
			}
		}

		this.connectionState.connected = this.servers.size > 0;
	}

	private async discoverServers(): Promise<MCPServerConfig[]> {
		// From ~/.docflow/config.json or DOCFLOW_MCP_SERVERS env
		const configs: MCPServerConfig[] = [];
		try {
			const userConfigPath = path.join(os.homedir(), '.docflow', 'config.json');
			if (await fs.pathExists(userConfigPath)) {
				const raw = await fs.readFile(userConfigPath, 'utf-8');
				const json = JSON.parse(raw) as any;
				const arr = Array.isArray(json.mcpServers) ? json.mcpServers : [];
				for (const s of arr) {
					if (s && s.name && s.command) {
						configs.push({ name: s.name, command: s.command, args: s.args ?? [], env: s.env ?? {} });
					}
				}
			}
		} catch {
			// ignore
		}

		const envServers = process.env.DOCFLOW_MCP_SERVERS;
		if (envServers) {
			try {
				const arr = JSON.parse(envServers) as MCPServerConfig[];
				for (const s of arr) {
					if (s && s.name && s.command) configs.push(s);
				}
			} catch {
				// ignore
			}
		}
		return configs;
	}

	async callTool(tool: string, parameters: Record<string, unknown> = {}): Promise<MCPToolResult> {
		if (!this.connectionState.connected || this.servers.size === 0) {
			return { success: false, error: 'MCP unavailable' };
		}

		// Choose first server that claims to have the tool
		for (const [name, proc] of this.servers.entries()) {
			const tools = this.toolsByServer.get(name);
			if (tools && tools.has(tool)) {
				const id = `${Date.now()}-${++this.requestIdCounter}`;
				const payload = JSON.stringify({ jsonrpc: '2.0', id, method: 'mcp/call_tool', params: { tool, parameters } });
				return new Promise<MCPToolResult>((resolve) => {
					this.pending.set(id, resolve);
					proc.stdin.write(payload + '\n');
					// Add timeout safety
					setTimeout(() => {
						if (this.pending.has(id)) {
							this.pending.delete(id);
							resolve({ success: false, error: 'MCP tool call timed out' });
						}
					}, 30_000);
				});
			}
		}

		return { success: false, error: `Tool not available: ${tool}` };
	}
}

export async function createDefaultMCPClient(): Promise<MCPClient> {
	const presetServers: MCPServerConfig[] = [];
	// Optional well-known servers from env (e.g., CONTEXT7, GREP, WEB)
	if (process.env.CONTEXT7_CMD) presetServers.push({ name: 'context7', command: process.env.CONTEXT7_CMD });
	if (process.env.GREP_MCP_CMD) presetServers.push({ name: 'grep', command: process.env.GREP_MCP_CMD });
	if (process.env.WEBSEARCH_MCP_CMD) presetServers.push({ name: 'web', command: process.env.WEBSEARCH_MCP_CMD });

	const client = new MCPClient(presetServers);
	await client.connect();
	return client;
}
