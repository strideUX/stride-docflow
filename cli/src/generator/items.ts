import fsp from "node:fs/promises";
import path from "node:path";
import type { SeedItem, TokenMap } from "../core/types.js";

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_/]+/g, "-")
    .replace(/[^a-z0-9\-]+/g, "")
    .replace(/^-+|-+$/g, "");
}

function idPrefixFor(type: SeedItem["type"]): string {
  switch (type) {
    case "feature":
      return "F";
    case "chore":
      return "C";
    case "bug":
      return "B";
    case "spike":
      return "S";
    default:
      return "X";
  }
}

function dirForType(type: SeedItem["type"]): string {
  if (type === "bug") return "bugs";
  if (type === "spike") return "spikes";
  // features + chores both live under items/
  return "items";
}

function isStateful(item: SeedItem): boolean {
  if (Array.isArray(item.acceptance) && item.acceptance.length > 0) {
    const first = item.acceptance[0] as any;
    if (first && (first.given || first.when || first.then)) return true;
  }
  const t = item.title.toLowerCase();
  return /auth|login|logout|session|state|flow|payment|checkout/.test(t);
}

function acceptanceBlock(item: SeedItem): string {
  // Prefer provided acceptance
  if (Array.isArray(item.acceptance) && item.acceptance.length > 0) {
    const a0 = item.acceptance[0] as any;
    if (a0 && (a0.given || a0.when || a0.then)) {
      // gherkin-lite
      const lines: string[] = ["## Acceptance (Gherkin-lite)"];
      for (const sc of item.acceptance as any[]) {
        const g = sc.given ?? "…";
        const w = sc.when ?? "…";
        const th = sc.then ?? "…";
        lines.push(`- Scenario: Given ${g}, when ${w}, then ${th}`);
      }
      return lines.join("\n");
    } else {
      const lines: string[] = ["## Acceptance Criteria"]; 
      for (const b of item.acceptance as string[]) lines.push(`- ${b}`);
      return lines.join("\n");
    }
  }
  if (isStateful(item)) {
    return [
      "## Acceptance (Gherkin-lite)",
      "- Scenario: Given preconditions, when action, then outcome",
    ].join("\n");
  }
  return [
    "## Acceptance Criteria",
    "- Criterion 1",
    "- Criterion 2",
  ].join("\n");
}

function subtasksBlock(item: SeedItem): string {
  const lower = item.title.toLowerCase();
  const lines: string[] = ["## Subtasks"]; 
  let wroteAny = false;
  if (Array.isArray(item.subtasks) && item.subtasks.length > 0) {
    for (const t of item.subtasks) {
      lines.push(`- [ ] ${t}`);
      wroteAny = true;
    }
  }
  if (/setup|bootstrap|skeleton/.test(lower)) {
    lines.push("- [ ] Initialize git repo (`git init`)");
    lines.push("- [ ] Create initial commit");
    lines.push("- [ ] Add remote (`git remote add origin <url>`)");
    lines.push("- [ ] Push to default branch (`git push -u origin main`)");
    wroteAny = true;
  }
  if (!wroteAny) {
    lines.push("- [ ] …");
  }
  return lines.join("\n");
}

export async function writePromotedItem(dstRoot: string, tokens: TokenMap, item: SeedItem, idx: number): Promise<string> {
  const dir = dirForType(item.type);
  const prefix = idPrefixFor(item.type);
  const id = `${prefix}${pad3(idx + 1)}`;
  const slug = slugify(item.title) || `${prefix.toLowerCase()}-${pad3(idx + 1)}`;
  const relDir = path.join("docflow", dir);
  const file = path.join(dstRoot, relDir, `${id}-${slug}.md`);
  await fsp.mkdir(path.dirname(file), { recursive: true });

  // Front-matter basics
  const fm: string[] = [
    "---",
    `schema: ${item.type === "bug" ? "bug.v1" : item.type === "spike" ? "spike.v1" : "item.v1"}`,
    `id: ${id}`,
    `title: ${item.title}`,
    `type: ${item.type}`,
    "status: pending",
    item.priority ? `priority: ${item.priority}` : undefined,
    item.complexity ? `complexity: ${item.complexity}` : undefined,
    `owner: ${tokens.OWNER}`,
    "dependencies: []",
    "links: []",
    "---",
    "",
  ].filter(Boolean) as string[];

  const body: string[] = [];
  body.push("## Objective");
  body.push(item.objective || "Short statement of the outcome.");
  body.push("");
  body.push(acceptanceBlock(item));
  body.push("");
  body.push(subtasksBlock(item));
  body.push("");

  await fsp.writeFile(file, [...fm, ...body].join("\n"), { mode: 0o644 });
  return file;
}

