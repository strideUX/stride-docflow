import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const DEFAULT_IGNORES = ["**/.DS_Store", "**/.gitkeep"];

type Tokens = Record<string, string>;

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegExp(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === "*") {
      const next = glob[i + 1];
      if (next === "*") {
        out += ".*";
        i += 1;
      } else {
        out += "[^/]*";
      }
      continue;
    }
    out += escapeRegExp(ch);
  }
  return new RegExp(`^${out}$`);
}

function buildIgnoreMatchers(patterns: string[]): RegExp[] {
  return patterns.map((p) => globToRegExp(p));
}

function shouldIgnore(relPath: string, name: string, matchers: RegExp[]): boolean {
  const normalized = relPath.replaceAll(path.sep, "/");
  for (const re of matchers) {
    if (re.test(normalized)) return true;
    if (re.test(name)) return true;
  }
  return false;
}

function renderString(input: string, tokens: Tokens): string {
  return input.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      return tokens[key];
    }
    return match;
  });
}

function normalizeLf(data: string): string {
  return data.replace(/\r\n/g, "\n");
}

async function ensureDirWithMode(p: string, mode?: number): Promise<void> {
  await fsp.mkdir(p, { recursive: true });
  if (mode != null) {
    try {
      await fsp.chmod(p, mode);
    } catch {
      // ignore inability to chmod
    }
  }
}

export async function renderTemplates(opts: {
  src: string;
  dest: string;
  tokens: Tokens;
  ignore?: string[];
}): Promise<{ written: string[] }> {
  const srcRoot = path.resolve(opts.src);
  const destRoot = path.resolve(opts.dest);
  const ignoreMatchers = buildIgnoreMatchers(opts.ignore ?? DEFAULT_IGNORES);
  const written: string[] = [];

  async function walk(rel: string): Promise<void> {
    const abs = path.join(srcRoot, rel);
    const entries = await fsp.readdir(abs, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const srcRel = path.join(rel, entry.name);
      if (shouldIgnore(srcRel, entry.name, ignoreMatchers)) continue;
      const renderedRel = renderString(srcRel, opts.tokens);
      const srcAbs = path.join(srcRoot, srcRel);
      const destAbs = path.join(destRoot, renderedRel);
      const relToDest = path.relative(destRoot, destAbs);
      if (relToDest.startsWith("..") || path.isAbsolute(relToDest)) {
        throw new Error(`Refusing to write outside destination: ${destAbs}`);
      }

      if (entry.isDirectory()) {
        const st = await fsp.stat(srcAbs);
        await ensureDirWithMode(destAbs, st.mode);
        await walk(srcRel);
        continue;
      }

      if (entry.isFile()) {
        const st = await fsp.stat(srcAbs);
        const raw = await fsp.readFile(srcAbs, "utf8");
        const rendered = normalizeLf(renderString(raw, opts.tokens));
        await ensureDirWithMode(path.dirname(destAbs));
        await fsp.writeFile(destAbs, rendered, { mode: st.mode });
        try {
          await fsp.chmod(destAbs, st.mode);
        } catch {
          // ignore inability to chmod
        }
        written.push(destAbs);
      }
    }
  }

  const exists = fs.existsSync(srcRoot);
  if (!exists) {
    throw new Error(`renderTemplates: source missing at ${srcRoot}`);
  }

  await ensureDirWithMode(destRoot);
  await walk(".");

  return { written };
}
