import { toolRegistry } from '../registry.js';

export interface WebSearchParams {
	query: string;
	limit?: number;
}

export interface WebSearchSource {
	title: string;
	url: string;
	snippet: string;
	date?: string;
}

export interface WebSearchResult {
	query: string;
	sources: WebSearchSource[];
	summary?: string;
}

export async function webSearchMCP(params: WebSearchParams): Promise<WebSearchResult> {
	const result = await toolRegistry.call('web.search', {
		query: params.query,
		limit: params.limit ?? 5
	});
	if (!result.success) {
		return { query: params.query, sources: [], summary: result.error ?? 'MCP error' };
	}
	const data = result.data as any;
	const sources: WebSearchSource[] = Array.isArray(data?.results)
		? data.results.map((r: any) => ({
			title: String(r.title ?? 'Untitled'),
			url: String(r.url ?? ''),
			snippet: String(r.snippet ?? ''),
			date: r.date ? String(r.date) : undefined
		}))
		: [];
	return {
		query: params.query,
		sources,
		summary: typeof data?.summary === 'string' ? data.summary : 'OK'
	};
}
