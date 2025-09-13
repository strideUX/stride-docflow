import fsp from "node:fs/promises";
import path from "node:path";
import pc from "picocolors";
import matter from "gray-matter";
import { isCancel, text, cancel } from "@clack/prompts";

type WorkItem = {
  id?: string;
  type?: string;
  title?: string;
  status?: string;
  owner?: string;
  priority?: string;
  complexity?: string;
  dependencies?: string[] | string;
  promoted?: boolean;
  file?: string;
};

type WorklistData = {
  items: WorkItem[];
  summary?: Record<string, number>;
};

async function exists(p: string): Promise<boolean> {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

function trimLines(s: string): string[] {
  return s
    .split(/\r?\n/g)
    .map((l) => l.trimEnd())
    .filter(() => true);
}

async function findProjectRoot(cwd: string): Promise<string | null> {
  const a = path.join(cwd, ".cursor/rules/docflow.mdc");
  const b = path.join(cwd, "docflow");
  if (await exists(a)) {
    if (await exists(b)) return cwd;
  }
  return null;
}

async function promptForRoot(): Promise<string | null> {
  // Loop until valid path or cancel
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await text({ message: "Enter project root (contains .cursor/rules/docflow.mdc and docflow/)", placeholder: process.cwd() });
    if (isCancel(res)) {
      cancel("Cancelled");
      return null;
    }
    const p = path.resolve(String(res));
    const ok = await findProjectRoot(p);
    if (ok) return ok;
    // eslint-disable-next-line no-console
    console.log(pc.yellow("Path not recognized as a Docflow project. Try again."));
  }
}

async function readFileSafe(p: string): Promise<string | null> {
  try {
    return await fsp.readFile(p, "utf8");
  } catch {
    return null;
  }
}

function parseIterationGoalAndOutcomes(raw: string | null): { goal: string; outcomes: string[] } {
  if (!raw) return { goal: "", outcomes: [] };
  const lines = trimLines(raw);
  const goalIdx = lines.findIndex((l) => /^##\s+Goal\b/i.test(l));
  const outcomesIdx = lines.findIndex((l) => /^##\s+Outcomes\b/i.test(l));
  let goal = "";
  const outcomes: string[] = [];

  if (goalIdx !== -1) {
    for (let i = goalIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (/^##\s+/.test(l)) break;
      if (l.trim()) goal = goal ? goal + " " + l.trim() : l.trim();
    }
  }

  if (outcomesIdx !== -1) {
    for (let i = outcomesIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (/^##\s+/.test(l)) break;
      const m = /^[-*]\s+(.+)$/.exec(l);
      if (m) outcomes.push(m[1].trim());
    }
  }

  return { goal, outcomes };
}

function parseTableItemsFromBody(raw: string | null): WorkItem[] {
  if (!raw) return [];
  const lines = trimLines(raw);
  const tableLines = lines.filter((l) => /\|/.test(l));
  if (tableLines.length < 2) return [];
  // Find header row containing 'status'
  const headerRow = tableLines.find((l) => /\bstatus\b/i.test(l));
  if (!headerRow) return [];
  const headers = headerRow
    .split("|")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const out: WorkItem[] = [];
  for (const l of tableLines) {
    if (l === headerRow) continue;
    if (/^\s*\|\s*-+\s*\|/.test(l)) continue; // separator row
    const cells = l
      .split("|")
      .map((c) => c.trim())
      .filter((_c, i, arr) => !(i === 0 || i === arr.length - 1));
    if (cells.length < headers.length) continue;
    const item: WorkItem = {};
    headers.forEach((h, idx) => {
      const v = cells[idx];
      if (h === "id") item.id = v;
      else if (h === "type") item.type = v;
      else if (h === "title") item.title = v;
      else if (h === "status") item.status = v;
      else if (h === "owner") item.owner = v;
      else if (h === "priority") item.priority = v;
      else if (h === "complexity") item.complexity = v;
      else if (h.startsWith("dependenc")) item.dependencies = v ? v.split(/[ ,]+/) : [];
      else if (h.includes("promoted")) item.promoted = /true|yes|y|1/i.test(v);
      else if (h === "file" || h.includes("file")) item.file = v;
    });
    if (item.title || item.id) out.push(item);
  }
  return out;
}

async function loadWorklist(p: string): Promise<WorklistData> {
  const raw = await readFileSafe(p);
  if (!raw) return { items: [] };
  const fm = matter(raw);
  const data: any = fm.data || {};
  const items: WorkItem[] = Array.isArray(data.items) ? (data.items as WorkItem[]) : [];
  // Fallback: parse any table in body
  const bodyItems = parseTableItemsFromBody(fm.content);
  const merged = items.length > 0 ? items : bodyItems;
  const summary = typeof data.summary === "object" ? (data.summary as Record<string, number>) : undefined;
  return { items: merged, summary };
}

async function countInboxNew(p: string): Promise<number> {
  const raw = await readFileSafe(p);
  if (!raw) return 0;
  const lines = trimLines(raw);
  const idx = lines.findIndex((l) => /^##\s+New\b/i.test(l));
  if (idx === -1) return 0;
  let count = 0;
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^##\s+/.test(l)) break;
    if (/^[-*]\s+/.test(l)) count++;
  }
  return count;
}

async function readFrontMatter(p: string): Promise<{ data: any; content: string } | null> {
  const raw = await readFileSafe(p);
  if (!raw) return null;
  try {
    const fm = matter(raw);
    return { data: fm.data || {}, content: fm.content };
  } catch {
    return null;
  }
}

async function loadPromotedDetails(projectRoot: string, items: WorkItem[]): Promise<{
  spikesInProgress: { id?: string; title?: string; file: string }[];
  itemStatusById: Map<string, string>;
}> {
  const spikesInProgress: { id?: string; title?: string; file: string }[] = [];
  const itemStatusById = new Map<string, string>();
  for (const it of items) {
    if (!it.file) continue;
    const abs = path.join(projectRoot, it.file.replace(/^\/*/, ""));
    const fm = await readFrontMatter(abs);
    if (!fm) continue;
    const id = String((fm.data?.id ?? it.id) || "");
    const status = String(fm.data?.status ?? it.status ?? "");
    if (id) itemStatusById.set(id, status);
    const type = String(fm.data?.type ?? it.type ?? "");
    if (type === "spike") {
      const spikeState = String(fm.data?.state ?? "");
      if (/^in_progress$/i.test(spikeState)) {
        spikesInProgress.push({ id, title: String(fm.data?.title ?? it.title ?? ""), file: path.relative(projectRoot, abs) });
      }
    }
  }
  return { spikesInProgress, itemStatusById };
}

function computeCounts(items: WorkItem[], summary?: Record<string, number>): { counts: Record<string, number> } {
  const counts: Record<string, number> = { total: 0, pending: 0, in_progress: 0, in_review: 0, completed: 0 };
  if (items.length > 0) {
    counts.total = items.length;
    for (const it of items) {
      const s = (it.status || "").toLowerCase();
      if (s && counts[s] != null) counts[s]++;
    }
  } else if (summary) {
    for (const k of Object.keys(summary)) {
      const v = Number(summary[k] ?? 0);
      if (!Number.isNaN(v)) counts[k] = v;
    }
  }
  return { counts };
}

function listUnresolvedDeps(items: WorkItem[], statusById: Map<string, string>): Array<{ a: string; b: string }> {
  const unresolved: Array<{ a: string; b: string }> = [];
  const byId = new Map<string, WorkItem>();
  for (const it of items) if (it.id) byId.set(it.id, it);
  for (const it of items) {
    let deps: string[] = [];
    if (Array.isArray(it.dependencies)) deps = it.dependencies.map(String);
    else if (typeof it.dependencies === "string" && it.dependencies.trim()) deps = it.dependencies.split(/[ ,]+/g);
    for (const d of deps) {
      const depId = d.trim();
      if (!depId) continue;
      const depStatus = (statusById.get(depId) || byId.get(depId)?.status || "").toLowerCase();
      if (depStatus !== "completed") {
        unresolved.push({ a: it.id || it.title || "?", b: depId });
      }
    }
  }
  return unresolved;
}

function nextBestAction(args: {
  inboxCount: number;
  focusSet: boolean;
  spikesInProgress: number;
  items: WorkItem[];
}): string {
  const { inboxCount, focusSet, spikesInProgress, items } = args;
  const inReview = items.filter((i) => (i.status || "").toLowerCase() === "in_review").length;
  const inProgress = items.filter((i) => (i.status || "").toLowerCase() === "in_progress").length;

  if (inboxCount > 0) return "route inbox";
  if (!focusSet && (inProgress > 0 || inReview > 0)) return "set focus";
  if (spikesInProgress > 0) return "conclude spike";
  if (inReview > 0) return "accept item";
  if (!focusSet) return "set focus";
  return "accept item";
}

export async function runStatus(): Promise<void> {
  const cwd = process.cwd();
  let projectRoot = await findProjectRoot(cwd);
  if (!projectRoot) {
    // Prompt for path
    const p = await promptForRoot();
    if (!p) return;
    projectRoot = p;
  }

  const docRoot = path.join(projectRoot, "docflow");
  const iterIndex = path.join(docRoot, "iterations/current/index.md");
  const iterFeatures = path.join(docRoot, "iterations/current/features.md");
  const focusFile = path.join(docRoot, "active/focus.md");
  const sessionFile = path.join(docRoot, "active/session.md");
  const inboxFile = path.join(docRoot, "inbox/capture.md");

  const hasIterIdx = await exists(iterIndex);
  const hasIterFeatures = await exists(iterFeatures);
  if (!hasIterIdx || !hasIterFeatures) {
    // eslint-disable-next-line no-console
    console.log(pc.yellow("No current iteration found. Bootstrap one via New or create under docflow/iterations/current/."));
    return;
  }

  const idxRaw = await readFileSafe(iterIndex);
  const idxMatter = matter(idxRaw || "");
  const { goal, outcomes } = parseIterationGoalAndOutcomes(idxRaw);

  const worklist = await loadWorklist(iterFeatures);
  const inboxCount = (await exists(inboxFile)) ? await countInboxNew(inboxFile) : 0;

  // Focus: simple detection — any non-empty file or FM status
  let focusSet = false;
  let focusSummary = "";
  const focusRaw = await readFileSafe(focusFile);
  if (focusRaw && focusRaw.trim().length > 0) {
    focusSet = true;
    try {
      const fm = matter(focusRaw);
      if (fm.data && fm.data.status) focusSummary = String(fm.data.status);
      // Try extract first "- Area: ..." line
      const areaLine = (fm.content || focusRaw)
        .split(/\r?\n/g)
        .map((l) => l.trim())
        .find((l) => /^-\s*Area:/i.test(l));
      if (areaLine) focusSummary = areaLine.replace(/^-\s*Area:\s*/i, "").trim();
      if (!focusSummary) focusSummary = "set";
    } catch {
      focusSummary = "set";
    }
  }

  // Session (optional; parsed for recency if needed later)
  const sessionFm = await readFrontMatter(sessionFile);
  const sessionDate = String(sessionFm?.data?.date || "");

  // Promoted files scan for spikes + authoritative statuses
  const { spikesInProgress, itemStatusById } = await loadPromotedDetails(projectRoot, worklist.items);
  const unresolved = listUnresolvedDeps(worklist.items, itemStatusById);
  const { counts } = computeCounts(worklist.items, worklist.summary);

  // Print Deep status
  const lines: string[] = [];
  lines.push(pc.bold("Docflow Status (Deep)"));
  lines.push("");
  lines.push(`${pc.bold("Iteration Goal")}: ${goal || "<not set>"}`);
  if (outcomes.length > 0) lines.push(`${pc.bold("Outcomes")}: ${outcomes.join("; ")}`);
  lines.push(
    `${pc.bold("Counts")}: total=${counts.total ?? 0}, pending=${counts.pending ?? 0}, in_progress=${counts.in_progress ?? 0}, in_review=${counts.in_review ?? 0}, completed=${counts.completed ?? 0} (inbox: ${inboxCount})`
  );

  if (unresolved.length > 0) {
    const pairs = unresolved.map((p) => `${p.a} depends on ${p.b}`).join("; ");
    lines.push(`${pc.bold("Unresolved Deps")}: ${pairs}`);
  } else {
    lines.push(`${pc.bold("Unresolved Deps")}: none`);
  }

  if (spikesInProgress.length > 0) {
    const s = spikesInProgress.map((sp) => `${sp.id ?? "?"}${sp.title ? ` (${sp.title})` : ""}`).join(", ");
    lines.push(`${pc.bold("Spikes In Progress")}: ${s}`);
  } else {
    lines.push(`${pc.bold("Spikes In Progress")}: none`);
  }

  lines.push(`${pc.bold("Active Focus")}: ${focusSet ? focusSummary : "none set"}`);
  if (!hasIterIdx || !hasIterFeatures) {
    lines.push(pc.yellow("Nudge: no current iteration detected; bootstrap under iterations/current/."));
  }

  const nba = nextBestAction({ inboxCount, focusSet, spikesInProgress: spikesInProgress.length, items: worklist.items });
  lines.push(`${pc.bold("Next Best Action")}: ${nba}`);

  if (sessionDate) lines.push(pc.dim(`Session date: ${sessionDate}`));

  // eslint-disable-next-line no-console
  console.log(lines.join("\n"));
}
