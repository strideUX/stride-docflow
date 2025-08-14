import { toolRegistry } from '../registry.js';

export interface GrepSearchParams {
	pattern: string;
	fileTypes?: string[];
	limit?: number;
}

export interface GrepMatchSource {
	title: string;
	url: string;
	snippet: string;
	filePath?: string;
	line?: number;
}

export interface GrepResult {
	query: string;
	sources: GrepMatchSource[];
	summary?: string;
}

export async function grepSearch(params: GrepSearchParams): Promise<GrepResult> {
	const result = await toolRegistry.call('grep.search', {
		pattern: params.pattern,
		fileTypes: params.fileTypes ?? [],
		limit: params.limit ?? 20
	});
	if (!result.success) {
		return { query: params.pattern, sources: [], summary: result.error ?? 'MCP error' };
	}
	const data = result.data as any;
	const sources: GrepMatchSource[] = Array.isArray(data?.matches)
		? data.matches.map((m: any) => ({
			title: String(m.file ?? 'Match'),
			url: String(m.url ?? ''),
			snippet: String(m.snippet ?? ''),
			filePath: m.file ? String(m.file) : undefined,
			line: typeof m.line === 'number' ? m.line : undefined
		}))
		: [];
	return {
		query: params.pattern,
		sources,
		summary: typeof data?.summary === 'string' ? data.summary : 'OK'
	};
}