function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replaces occurrences of {{TOKEN}} in `str` using the provided `tokens` map.
 * Unknown tokens are left as-is.
 */
export function renderTokens(str: string, tokens: Record<string, string>): string {
  if (!str || !tokens || Object.keys(tokens).length === 0) return str;

  let out = str;
  for (const [key, value] of Object.entries(tokens)) {
    if (value == null) continue;
    const re = new RegExp(`\\{{\\s*${escapeRegExp(key)}\\s*\\}}`, "g");
    out = out.replace(re, String(value));
  }
  return out;
}

/**
 * Token rendering helper for path strings. Keeps behavior identical to `renderTokens`.
 * Does not attempt to normalize or slugify path segments.
 */
export function renderTokensInPath(pathStr: string, tokens: Record<string, string>): string {
  return renderTokens(pathStr, tokens);
}

