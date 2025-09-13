import fsp from "node:fs/promises";
import path from "node:path";
import type { TokenMap } from "../core/types.js";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function today(): { date: string; y: number; m: number; d: number } {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const date = `${y}-${pad(m)}-${pad(dd)}`;
  return { date, y, m, d: dd };
}

async function ensureDir(p: string): Promise<void> {
  await fsp.mkdir(p, { recursive: true });
}

export async function writeCheatSheetReadme(dstRoot: string, tokens: TokenMap): Promise<string> {
  const p = path.join(dstRoot, "docflow/README.md");
  await ensureDir(path.dirname(p));
  const content = [
    "---",
    "schema: guide.v1",
    `project: ${tokens.PROJECT_NAME}`,
    `owner: ${tokens.OWNER}`,
    "version: 1",
    "---",
    "",
    "# Docflow Cheat Sheet",
    "",
    "Quick actions for humans and agents. Keep docs small and up to date.",
    "",
    "## Slash Commands",
    "- /cap: capture to inbox (docflow/inbox/capture.md)",
    "- /route: move from inbox → items | bugs | spikes | backlog",
    "- /promote: create per-item file (items/F###-slug.md, bugs/B###-slug.md, spikes/S###-slug.md)",
    "- /status <id> <state>: set status (pending|in_progress|in_review|completed)",
    "- /focus: open today's focus (docflow/active/focus.md)",
    "- /session: open handoff (docflow/active/session.md)",
    "- /adr: new decision (docflow/decisions/ADR-YYYY-MM-DD-NN-slug.md)",
    "- /note: add daily note (docflow/notes/YYYY-MM-DD.md)",
    "",
    "## First Steps",
    "- Set iteration goal in `docflow/iterations/current/index.md`",
    "- Add 3–7 items to `docflow/iterations/current/features.md` (keep tiny)",
    "- Update `docflow/active/session.md` at handoff; `focus.md` each day",
    "- Use ADRs for tradeoffs; link from items",
    "",
    "## Status Flow",
    "pending → in_progress → in_review → completed",
    "",
    "## Routing Tips",
    "- Decision gate → ADR",
    "- Scoped deliverable → Feature/Chore",
    "- Defect → Bug",
    "- Unknown/learning → Spike (state required)",
  ].join("\n");
  await fsp.writeFile(p, content, { mode: 0o644 });
  return p;
}

export async function writeActiveSeeds(dstRoot: string, tokens: TokenMap): Promise<string[]> {
  const out: string[] = [];
  // focus.md (empty)
  const focus = path.join(dstRoot, "docflow/active/focus.md");
  await ensureDir(path.dirname(focus));
  await fsp.writeFile(focus, "", { mode: 0o644 });
  out.push(focus);

  // session.md (seed header)
  const session = path.join(dstRoot, "docflow/active/session.md");
  const content = [
    "---",
    "schema: session.v1",
    `id: session-${tokens.DATE}`,
    `project: ${tokens.PROJECT_NAME}`,
    `owner: ${tokens.OWNER}`,
    "status: in_progress",
    `date: ${tokens.DATE}`,
    "---",
    "",
    "# Session Handoff",
    "",
    "## Accomplished",
    "- …",
    "",
    "## Current State",
    "- …",
    "",
    "## Next Priorities",
    "1. …",
    "2. …",
    "3. …",
    "",
    "## Blockers / Dependencies",
    "- …",
  ].join("\n");
  await fsp.writeFile(session, content, { mode: 0o644 });
  out.push(session);
  return out;
}

export async function writeInboxCapture(dstRoot: string, tokens: TokenMap): Promise<string> {
  const p = path.join(dstRoot, "docflow/inbox/capture.md");
  await ensureDir(path.dirname(p));
  const content = [
    "---",
    "schema: inbox.v1",
    "id: inbox-capture",
    `owner: ${tokens.OWNER}`,
    `date: ${tokens.DATE}`,
    "---",
    "",
    "# Inbox / Quick Capture",
    "",
    "- Keep fast, unclassified capture here. Agents triage daily.",
    "- Promote to items/bugs/spikes/notes/ADRs as clarity emerges.",
    "",
    "## New",
    "When an item is routed to backlog/worklist/spike, remove the original bullet from this file.",
    "",
    "## Triaged",
    "",
  ].join("\n");
  await fsp.writeFile(p, content, { mode: 0o644 });
  return p;
}

export async function writeIterationCurrent(dstRoot: string, tokens: TokenMap): Promise<string[]> {
  const out: string[] = [];
  const idx = path.join(dstRoot, "docflow/iterations/current/index.md");
  await ensureDir(path.dirname(idx));
  const contentIdx = [
    "---",
    "schema: iteration.index.v1",
    "id: iteration-current",
    `project: ${tokens.PROJECT_NAME}`,
    `owner: ${tokens.OWNER}`,
    "status: in_progress",
    `iter: ${tokens.ITER_NUM}`,
    'docflow_template_version: "v0.1.0"',
    "---",
    "",
    `# Current Iteration: ${tokens.PROJECT_NAME}`,
    "",
    "## Router",
    "- Focus: `docflow/active/focus.md`",
    "- Session: `docflow/active/session.md`",
    "- Worklist: `docflow/iterations/current/features.md`",
    "- Backlog: `docflow/backlog/features.md`",
    "- Decisions: `docflow/decisions/`",
    "- Inbox: `docflow/inbox/capture.md`",
    "",
    "## Goal",
    "One or two sentences describing the primary outcome.",
    "",
    "## Outcomes",
    "- Outcome 1 (measurable)",
    "- Outcome 2 (measurable)",
    "- Outcome 3 (optional)",
    "",
    "## Acceptance Criteria",
    "- Criterion 1 (testable)",
    "- Criterion 2 (testable)",
    "- Criterion 3 (testable)",
    "",
  ].join("\n");
  await fsp.writeFile(idx, contentIdx, { mode: 0o644 });
  out.push(idx);

  const features = path.join(dstRoot, "docflow/iterations/current/features.md");
  const contentFeatures = [
    "---",
    "schema: worklist.v1",
    `id: iteration-${tokens.ITER_NUM}-features`,
    `project: ${tokens.PROJECT_NAME}`,
    `owner: ${tokens.OWNER}`,
    "status: in_progress",
    "statuses: [pending, in_progress, in_review, completed]",
    "summary:",
    "  total: 0",
    "  pending: 0",
    "  in_progress: 0",
    "  in_review: 0",
    "  completed: 0",
    "  p0: 0",
    "items: []",
    "---",
    "",
    "# Current Iteration – Worklist",
    "",
    "This is the living worklist. Keep items scoped, statused, and linked to ADRs/notes.",
    "",
    "## Columns",
    "- id | type | title | status | owner | priority | complexity | dependencies | promoted? | file?",
    "",
    "## Guidance",
    "- Status flow: pending → in_progress → in_review → completed",
    "- Link ADRs in item body and/or `links` field.",
    "",
  ].join("\n");
  await fsp.writeFile(features, contentFeatures, { mode: 0o644 });
  out.push(features);
  return out;
}

export async function writeBacklogEmpty(dstRoot: string): Promise<string> {
  const p = path.join(dstRoot, "docflow/backlog/features.md");
  await ensureDir(path.dirname(p));
  // Intentionally empty per request
  await fsp.writeFile(p, "", { mode: 0o644 });
  return p;
}

export async function writeDecisions(dstRoot: string, tokens: TokenMap): Promise<string[]> {
  const out: string[] = [];
  const idx = path.join(dstRoot, "docflow/decisions/README.md");
  await ensureDir(path.dirname(idx));
  const idxContent = [
    "---",
    "schema: adr.index.v1",
    "id: decisions-index",
    `project: ${tokens.PROJECT_NAME}`,
    `owner: ${tokens.OWNER}`,
    "status: in_progress",
    "---",
    "",
    "# Architecture Decision Records (ADRs)",
    "",
    "- Status flow: Proposed → Accepted → Deprecated (or Superseded)",
    "",
    "## Index",
    "",
  ].join("\n");
  await fsp.writeFile(idx, idxContent, { mode: 0o644 });
  out.push(idx);

  const { date } = today();
  const adr = path.join(dstRoot, `docflow/decisions/ADR-${date}-01-architecture-baseline.md`);
  const adrContent = [
    "---",
    "schema: adr.v1",
    `id: ADR-${date}-01-architecture-baseline`,
    "title: Architecture baseline",
    "status: Proposed",
    `owner: ${tokens.OWNER}`,
    "deciders: []",
    `date: ${tokens.DATE}`,
    "links: []",
    "---",
    "",
    `# ADR-${date}-01: Architecture baseline`,
    "",
    "## Context",
    "Establish minimal standards and routing for this project.",
    "",
    "## Decision",
    "Adopt the Docflow structure with shallow indexes and leaf docs for detail. Maintain worklist as source of truth.",
    "",
    "## Consequences",
    "- Predictable navigation for humans and agents\n- Small, composable docs\n- Clear decision history via ADRs",
    "",
    "## Follow-ups",
    "- Write stack-specific standards as needed\n- Add diagrams to project/architecture.md when helpful",
    "",
  ].join("\n");
  await fsp.writeFile(adr, adrContent, { mode: 0o644 });
  out.push(adr);

  return out;
}

export async function writeProjectDocs(dstRoot: string, tokens: TokenMap): Promise<string[]> {
  const out: string[] = [];
  // overview.md (Minimal Charter)
  const overview = path.join(dstRoot, "docflow/project/overview.md");
  await ensureDir(path.dirname(overview));
  const overviewContent = [
    "---",
    "schema: guide.v1",
    'title: "Project Overview"',
    `project: "${tokens.PROJECT_NAME}"`,
    `owner: "${tokens.OWNER}"`,
    "version: 1",
    "---",
    "",
    "# Project Overview",
    "",
    "A minimal charter for orientation and scope.",
    "",
    "## Purpose",
    "One or two sentences on users, problem, and impact.",
    "",
    "## Scope",
    "- In: …\n- Out: …",
    "",
    "## Success Criteria",
    "- Outcome 1 (metric + target)\n- Outcome 2 (metric + target)",
    "",
    "## Links",
    "- Docs Router: `docflow/iterations/current/index.md`",
  ].join("\n");
  await fsp.writeFile(overview, overviewContent, { mode: 0o644 });
  out.push(overview);

  // conventions.md (with Branch Naming)
  const conventions = path.join(dstRoot, "docflow/project/conventions.md");
  const convContent = [
    "---",
    "schema: guide.v1",
    'title: "Conventions"',
    `project: "${tokens.PROJECT_NAME}"`,
    `owner: "${tokens.OWNER}"`,
    "version: 1",
    "---",
    "",
    "# Conventions",
    "",
    "## Branch Naming",
    "- First bootstrap: 000-boot",
    "- Features: feat/F###-slug",
    "- Chores: chore/C###-slug",
    "- Bugs: fix/B###-slug",
    "- Spikes: spike/S###-slug",
  ].join("\n");
  await fsp.writeFile(conventions, convContent, { mode: 0o644 });
  out.push(conventions);

  // architecture.md (includes Stack Standards summary)
  const arch = path.join(dstRoot, "docflow/project/architecture.md");
  const archContent = [
    "---",
    "schema: guide.v1",
    'title: "Architecture"',
    `project: "${tokens.PROJECT_NAME}"`,
    `owner: "${tokens.OWNER}"`,
    "version: 1",
    "---",
    "",
    "# Architecture",
    "",
    "Keep this short; push durable choices to ADRs.",
    "",
    "## Stack Standards",
    "See `docflow/project/stack/` for the selected pack standards snapshot.",
  ].join("\n");
  await fsp.writeFile(arch, archContent, { mode: 0o644 });
  out.push(arch);

  // template-version.md
  const tv = path.join(dstRoot, "docflow/project/template-version.md");
  await fsp.writeFile(tv, "docflow-template: v0.1.0\n\n", { mode: 0o644 });
  out.push(tv);

  return out;
}

export async function writePackSnapshot(dstRoot: string, tokens: TokenMap): Promise<string> {
  const dir = path.join(dstRoot, "docflow/project/stack");
  await ensureDir(dir);
  const fname = `${tokens.PACK_NAME}-${tokens.DATE}.md`;
  const p = path.join(dir, fname);
  const content = [
    `# Stack: ${tokens.PACK_NAME}`,
    "",
    `Version: ${tokens.PACK_VERSION}`,
    "",
    "This is the standards snapshot for the selected pack.",
    "Include conventions, folder layout, performance/security checklists.",
  ].join("\n\n");
  await fsp.writeFile(p, content, { mode: 0o644 });
  return p;
}

export async function writeAgentsDocs(dstRoot: string, tokens: TokenMap): Promise<string[]> {
  const out: string[] = [];
  const mem = path.join(dstRoot, "docflow/agents/memory/constitution.md");
  await ensureDir(path.dirname(mem));
  const memContent = [
    "---",
    "schema: rules.v1",
    "id: agent-constitution",
    `owner: ${tokens.OWNER}`,
    "version: 1",
    "---",
    "",
    "# Agent Constitution",
    "",
    "- Keep indexes small; push detail to leaf docs.",
    "- Mirror worklist status in per-item files.",
    "- Propose ADRs for tradeoffs and irreversible changes.",
  ].join("\n");
  await fsp.writeFile(mem, memContent, { mode: 0o644 });
  out.push(mem);
  return out;
}

