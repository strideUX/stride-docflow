import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import pc from "picocolors";
import type { Env } from "../core/env.js";
import type { ProjectSpec, SeedItem } from "../core/types.js";
import { buildTokens, copyAndRenderDir, resolveAssetsSubdir } from "./renderer.js";
import { cancel, isCancel, select, text } from "clack";

export interface WriteProjectArgs {
  env: Env;
  spec: ProjectSpec;
  items: SeedItem[];
  deps?: Array<[string, string]>;
}

export interface WriteResult {
  dstRoot: string;
  wrote: string[];
}

function sanitizeSlug(input: string): string {
  let s = input.trim();
  // Replace path separators and trim to a safe slug
  s = s.replace(/[\\/]/g, "-");
  // Collapse spaces
  s = s.replace(/\s+/g, "-");
  // Remove leading dots to avoid hidden/parent-like paths
  s = s.replace(/^\.+/, "");
  return s || "project";
}

async function listTopLevel(dir: string): Promise<string[]> {
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    return entries.map((e) => e.name).sort();
  } catch {
    return [];
  }
}

function ensureWithinRoot(root: string, candidate: string): void {
  const r = path.resolve(root);
  const c = path.resolve(candidate);
  const rel = path.relative(r, c);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Refusing to write outside root: ${root}`);
  }
}

export async function writeProject({ env, spec }: WriteProjectArgs): Promise<WriteResult> {
  const baseSlug = spec.meta.projectSlug;
  let chosenSlug = baseSlug;
  let dstRoot = path.join(env.DOCFLOW_ROOT, chosenSlug);

  // Directory policy & collision resolver (interactive)
  // Loop until we have a non-existent or empty directory
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = fs.existsSync(dstRoot);
    if (!exists) break;
    const contents = await listTopLevel(dstRoot);
    if (contents.length === 0) break; // exists but empty → ok

    // Show contents (top-level)
    // eslint-disable-next-line no-console
    console.log(pc.yellow(`Target exists and is non-empty: ${dstRoot}`));
    // eslint-disable-next-line no-console
    console.log(pc.bold("Contents (top-level):"));
    contents.forEach((name) => console.log(pc.dim("  "), name));

    const choice = await select({
      message: "Directory is not empty. Choose an action:",
      options: [
        { value: "abort", label: "Abort" },
        { value: "rename", label: "Enter a different name" },
        { value: "suffix", label: "Use suffix (-2)" },
      ],
    });
    if (isCancel(choice) || choice === "abort") {
      cancel("Aborted");
      throw new Error("Aborted by user due to non-empty directory.");
    }

    if (choice === "rename") {
      const next = await text({ message: "Enter a new project name", placeholder: `${chosenSlug}-new` });
      if (isCancel(next)) {
        cancel("Aborted");
        throw new Error("Aborted by user during rename.");
      }
      chosenSlug = sanitizeSlug(String(next));
      dstRoot = path.join(env.DOCFLOW_ROOT, chosenSlug);
      continue;
    }

    if (choice === "suffix") {
      // Always apply "-2"; if already ends with -2, keep it as-is per spec.
      const suffixed = chosenSlug.endsWith("-2") ? chosenSlug : `${chosenSlug}-2`;
      chosenSlug = suffixed;
      dstRoot = path.join(env.DOCFLOW_ROOT, chosenSlug);
      // eslint-disable-next-line no-console
      console.log(pc.cyan(`Using suffixed target: ${dstRoot}`));
      continue;
    }
  }

  await fsp.mkdir(dstRoot, { recursive: true });

  const tokens = buildTokens({
    projectName: spec.meta.projectName,
    projectSlug: spec.meta.projectSlug,
    owner: spec.meta.owner,
    platform: spec.meta.platform,
    packName: spec.meta.packName,
    packVersion: spec.meta.packVersion,
    iterNum: spec.iteration.iterNum,
  });

  const wrote: string[] = [];

  // Copy runtime templates (docflow + .cursor)
  const templatesRoot = resolveAssetsSubdir("templates-runtime");
  const written = await copyAndRenderDir(templatesRoot, dstRoot, tokens);
  wrote.push(...written);

  // Write pack stack.md → docflow/project/stack.md
  const stackSrc = path.join(resolveAssetsSubdir("packs"), spec.meta.packName, "stack.md");
  try {
    const raw = await fsp.readFile(stackSrc, "utf8");
    const rendered = raw.replace(/\{\{PACK_VERSION\}\}/g, spec.meta.packVersion);
    const dst = path.join(dstRoot, "docflow/project/stack.md");
    ensureWithinRoot(dstRoot, dst);
    await fsp.mkdir(path.dirname(dst), { recursive: true });
    try {
      await fsp.access(dst);
      // Do not overwrite
    } catch {
      await fsp.writeFile(dst, rendered, { mode: 0o644 });
      wrote.push(dst);
    }
  } catch {
    // optional
  }

  // Write env example (pack/auth specific – simplified by platform)
  const envFile = spec.meta.platform === "mobile" ? "env.example.mobile" : ".env.example";
  const envPath = path.join(dstRoot, envFile);
  ensureWithinRoot(dstRoot, envPath);
  const envContent = [
    `# Generated by Docflow for ${spec.meta.packName}@${spec.meta.packVersion}`,
    `# Copy to ${spec.meta.platform === "mobile" ? "env" : ".env.local"} and fill in values`,
    "",
    "# Example",
    "APP_BASE_URL=",
    "LOG_LEVEL=info",
  ].join("\n");
  try {
    await fsp.access(envPath);
    // Do not overwrite
  } catch {
    await fsp.writeFile(envPath, envContent, { mode: 0o644 });
    wrote.push(envPath);
  }

  // eslint-disable-next-line no-console
  console.log(pc.green(`Wrote ${wrote.length} files under ${dstRoot}`));
  return { dstRoot, wrote };
}
