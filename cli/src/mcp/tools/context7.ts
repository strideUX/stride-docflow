import { toolRegistry } from '../registry.js';

export interface Context7SearchParams {
	query: string;
	limit?: number;
}

export interface Context7Source {
	title: string;
	url: string;
	snippet: string;
	date?: string;
}

export interface Context7Result {
	query: string;
	sources: Context7Source[];
	summary?: string;
}

export async function context7Search(params: Context7SearchParams): Promise<Context7Result> {
	const result = await toolRegistry.call('context7.search', {
		query: params.query,
		limit: params.limit ?? 5
	});
	if (!result.success) {
		return { query: params.query, sources: [], summary: result.error ?? 'MCP error' };
	}
	const data = result.data as any;
	const sources: Context7Source[] = Array.isArray(data?.sources)
		? data.sources.map((s: any) => ({
			title: String(s.title ?? 'Untitled'),
			url: String(s.url ?? ''),
			snippet: String(s.snippet ?? ''),
			date: s.date ? String(s.date) : undefined
		}))
		: [];
	return {
		query: params.query,
		sources,
		summary: typeof data?.summary === 'string' ? data.summary : 'OK'
	};
}
