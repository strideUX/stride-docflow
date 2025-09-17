export function parseModelJson<T = unknown>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '');
  return JSON.parse(cleaned) as T;
}


