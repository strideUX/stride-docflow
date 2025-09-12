import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TokenMap } from "../core/types.js";

export function buildTokens(args: {
  projectName: string;
  projectSlug: string;
  owner: string;
  platform: string;
  packName: string;
  packVersion: string;
  iterNum?: string;
}): TokenMap {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const iter = args.iterNum ?? "01";

  return {
    PROJECT_NAME: args.projectName,
    PROJECT_SLUG: args.projectSlug,
    OWNER: args.owner,
    DATE: date,
    ITER_NUM: iter,
    PLATFORM: args.platform,
    PACK_NAME: args.packName,
    PACK_VERSION: args.packVersion,
  };
}

function extendTokens(tokens: TokenMap): Record<string, string> {
  const out: Record<string, string> = { ...tokens };
  // Derived tokens used in templates
  if (!out.YEAR) out.YEAR = tokens.DATE?.slice(0, 4) ?? String(new Date().getFullYear());
  return out;
}

function renderString(input: string, tokens: Record<string, string>): string {
  return input.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_m, key: string) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) return tokens[key];
    return `{{${key}}}`; // preserve unknown tokens
  });
}

export function renderPath(p: string, tokens: TokenMap): string {
  return renderString(p, extendTokens(tokens));
}

export async function copyAndRenderDir(srcDir: string, dstDir: string, tokens: TokenMap): Promise<string[]> {
  const written: string[] = [];
  const exTokens = extendTokens(tokens);

  async function walk(rel: string) {
    const abs = path.join(srcDir, rel);
    const entries = await fsp.readdir(abs, { withFileTypes: true });
    for (const ent of entries) {
      const srcRel = path.join(rel, ent.name);
      const renderedRel = renderString(srcRel, exTokens);
      const srcAbs = path.join(srcDir, srcRel);
      const dstAbs = path.join(dstDir, renderedRel);

      if (ent.isDirectory()) {
        await fsp.mkdir(dstAbs, { recursive: true });
        await walk(srcRel);
      } else if (ent.isFile()) {
        const st = await fsp.stat(srcAbs);
        const data = await fsp.readFile(srcAbs, "utf8");
        const rendered = renderString(data, exTokens);
        await fsp.mkdir(path.dirname(dstAbs), { recursive: true });
        await fsp.writeFile(dstAbs, rendered, { mode: st.mode });
        try {
          await fsp.chmod(dstAbs, st.mode);
        } catch {}
        written.push(dstAbs);
      }
    }
  }

  await fsp.mkdir(dstDir, { recursive: true });
  await walk(".");
  return written;
}

export function resolveAssetsSubdir(sub: string): string {
  // Try both src and dist layouts
  const here = fileURLToPath(new URL(".", import.meta.url));
  const candidates = [
    path.resolve(here, "../../assets", sub), // src/* -> assets
    path.resolve(here, "../../../assets", sub), // dist/src/* -> assets
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  // Fallback to cwd resolve
  return path.resolve(process.cwd(), "cli/assets", sub);
}

