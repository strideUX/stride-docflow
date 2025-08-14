export interface MCPServerConfig {
	name: string;
	command: string;
	args?: string[];
	env?: Record<string, string>;
}

export interface MCPToolCall {
	tool: string;
	parameters: Record<string, unknown>;
}

export interface MCPToolResult {
	success: boolean;
	data?: unknown;
	error?: string;
}

export interface MCPConnectionState {
	connected: boolean;
	tools: string[];
	lastError?: string;
}