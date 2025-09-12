import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { TokenMap } from "../core/types.js";
import { renderPath, resolveAssetsSubdir } from "./renderer.js";

export interface PlanOptions {
  dstRoot: string; // absolute path to project root (will be created)
  packName: string; // e.g., nextjs-convex | rn-expo-convex
}

async function listFilesRecursive(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(rel: string) {
    const abs = path.join(root, rel);
    const entries = await fsp.readdir(abs, { withFileTypes: true });
    for (const ent of entries) {
      const relPath = path.join(rel, ent.name);
      if (ent.isDirectory()) await walk(relPath);
      else if (ent.isFile()) out.push(relPath);
    }
  }
  await walk(".");
  return out;
}

export async function planFileWrites(tokens: TokenMap, options: PlanOptions): Promise<string[]> {
  const dstRoot = options.dstRoot;
  const relPaths: string[] = [];

  // Templates runtime tree
  const templatesRoot = resolveAssetsSubdir("templates-runtime");
  const templateFiles = await listFilesRecursive(templatesRoot);
  for (const rel of templateFiles) {
    const rendered = renderPath(rel, tokens);
    relPaths.push(rendered);
  }

  // Pack stack doc → docflow/project/stack.md
  const stackSrc = path.join(resolveAssetsSubdir("packs"), options.packName, "stack.md");
  if (fs.existsSync(stackSrc)) {
    relPaths.push(path.join("docflow", "project", "stack.md"));
  }

  // Env example
  const envFile = tokens.PLATFORM === "mobile" ? "env.example.mobile" : ".env.example";
  relPaths.push(envFile);

  // Normalize and return with forward slashes
  const unique = Array.from(new Set(relPaths.map((p) => p.replaceAll(path.sep, "/"))));
  unique.sort();
  // Prepend dstRoot? Return relative to project root
  return unique.map((p) => path.join(dstRoot, p));
}

