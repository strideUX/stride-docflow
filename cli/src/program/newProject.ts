import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import pc from "picocolors";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import { loadEnv, ensureEnv, type Env } from "../core/env.ts";
import { renderTemplates } from "../lib/templates.ts";
import { slugify } from "../lib/slug.ts";
import { suggestFollowUps, summarizeCharter, seedIteration } from "../lib/llm.ts";
import { resolveAssetsSubdir } from "../generator/renderer.ts";

interface FollowUpQA {
  question: string;
  answer: string;
}

interface Charter {
  goal: string;
  outcomes: string[];
  constraints: string[];
  nonGoals: string[];
}

interface SeedItemPlan {
  kind: "feature" | "chore" | "spike";
  id: string;
  title: string;
  objective: string;
  acceptance: string[];
  subtasks: string[];
  priority: "P0" | "P1" | "P2";
  complexity: "XS" | "S" | "M" | "L" | "XL";
  dependsOn?: string[];
  filePath: string;
}

interface SeedPlan {
  adr: { id: string; title: string; body: string };
  items: SeedItemPlan[];
  fileTreePreview: string[];
}

type QualityToggle = "lint" | "format" | "tsStrict" | "tests" | "ci";

interface TogglesState {
  lint: boolean;
  format: boolean;
  tsStrict: boolean;
  tests: boolean;
  ci: boolean;
  analytics?: boolean;
}

const RECENTS_PATH = path.join(process.cwd(), ".docflow", "recent-roots.json");

async function readRecents(): Promise<string[]> {
  try {
    const raw = await fsp.readFile(RECENTS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v));
  } catch {}
  return [];
}

async function writeRecents(root: string): Promise<void> {
  const current = await readRecents();
  const next = [root, ...current.filter((r) => r !== root)].slice(0, 5);
  await fsp.mkdir(path.dirname(RECENTS_PATH), { recursive: true });
  await fsp.writeFile(RECENTS_PATH, JSON.stringify(next, null, 2), "utf8");
}

function printSection(title: string): void {
  console.log(pc.bold(pc.cyan(`\n${title}`)));
}

function renderBulletList(label: string, items: string[]): void {
  printSection(label);
  if (items.length === 0) {
    console.log(pc.dim("  (none)"));
    return;
  }
  for (const item of items) {
    console.log(`  - ${item}`);
  }
}

function printCharter(charter: Charter): void {
  printSection("Charter");
  console.log(`${pc.bold("Goal:")} ${charter.goal}`);
  renderBulletList("Outcomes", charter.outcomes);
  renderBulletList("Constraints", charter.constraints);
  renderBulletList("Non-goals", charter.nonGoals);
}

function printSeedItems(items: SeedItemPlan[]): void {
  printSection("Seed Items");
  console.log(pc.dim("id | type | title | priority | complexity"));
  for (const item of items) {
    const row = [
      pc.green(item.id),
      item.kind,
      item.title,
      item.priority,
      item.complexity,
    ].join(" | ");
    console.log(`  ${row}`);
  }
}

function printFileTreePreview(lines: string[]): void {
  printSection("Planned File Tree");
  for (const line of lines) {
    console.log(`  ${line}`);
  }
}

async function promptForIdea(): Promise<string> {
  const idea = await text({
    message: "What's the idea?",
    placeholder: "Describe the concept...",
    validate(value) {
      if (!value || !String(value).trim()) {
        return "Idea is required";
      }
      return undefined;
    },
  });
  if (isCancel(idea)) {
    cancel("Cancelled");
    throw new Error("Cancelled");
  }
  return String(idea);
}

async function collectFollowUps(idea: string): Promise<FollowUpQA[]> {
  const answers: FollowUpQA[] = [];
  let iteration = 0;
  while (true) {
    const qaContext = answers.length
      ? answers.map((qa) => ({ question: qa.question, answer: qa.answer }))
      : undefined;
    const qs = await suggestFollowUps({ idea, prior: qaContext });
    for (const question of qs) {
      console.log(pc.bold(question));
      const answer = await text({
        message: "Answer (leave blank to skip)",
      });
      if (isCancel(answer)) {
        cancel("Cancelled");
        throw new Error("Cancelled");
      }
      const trimmed = String(answer ?? "").trim();
      if (trimmed) {
        answers.push({ question, answer: trimmed });
      }
    }

    const nextAction = await select({
      message: iteration === 0 ? "Explore more?" : "Anything else?",
      options: [
        { value: "more", label: "Ask one more question" },
        { value: "done", label: "I'm ready" },
      ],
      initialValue: "done",
    });
    if (isCancel(nextAction) || nextAction === "done") break;
    iteration += 1;
  }
  return answers;
}

function parseList(input: string): string[] {
  return input
    .split(/[\n,;]+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function promptList(message: string, initial: string[]): Promise<string[] | null> {
  const res = await text({ message, initialValue: initial.join(", ") });
  if (isCancel(res)) return null;
  return parseList(String(res));
}

async function editCharter(initial: Charter): Promise<Charter> {
  let charter = { ...initial };
  while (true) {
    printCharter(charter);
    const action = await select({
      message: "Adjust charter?",
      options: [
        { value: "goal", label: "Edit goal" },
        { value: "outcomes", label: "Edit outcomes" },
        { value: "constraints", label: "Edit constraints" },
        { value: "nonGoals", label: "Edit non-goals" },
        { value: "done", label: "Looks good" },
      ],
      initialValue: "done",
    });
    if (isCancel(action) || action === "done") break;

    if (action === "goal") {
      const next = await text({ message: "Goal", initialValue: charter.goal });
      if (isCancel(next)) continue;
      const trimmed = String(next).trim();
      if (trimmed) charter = { ...charter, goal: trimmed };
      continue;
    }

    if (action === "outcomes") {
      const next = await promptList("List desired outcomes (comma separated)", charter.outcomes);
      if (next) charter = { ...charter, outcomes: next };
      continue;
    }

    if (action === "constraints") {
      const next = await promptList("Constraints (comma separated)", charter.constraints);
      if (next) charter = { ...charter, constraints: next };
      continue;
    }

    if (action === "nonGoals") {
      const next = await promptList("Non-goals (comma separated)", charter.nonGoals);
      if (next) charter = { ...charter, nonGoals: next };
    }
  }
  return charter;
}

function makeToggleState(selected: string[]): TogglesState {
  const base: TogglesState = {
    lint: false,
    format: false,
    tsStrict: false,
    tests: false,
    ci: false,
    analytics: false,
  };
  for (const val of selected) {
    if (val in base) {
      (base as Record<string, boolean>)[val] = true;
    }
  }
  return base;
}

async function ensureDirWritable(p: string): Promise<void> {
  try {
    await fsp.access(p, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    throw new Error(`Directory not writable: ${p} (${(err as Error).message})`);
  }
}

async function chooseRootDir(existing: string | undefined): Promise<string> {
  if (existing) {
    return path.resolve(existing);
  }
  const recents = await readRecents();
  const options = [
    { value: "pwd", label: `Current dir (${process.cwd()})` },
    { value: "type", label: "Type a path…" },
  ];
  if (recents.length > 0) {
    options.splice(1, 0, { value: "recent", label: "Pick from recent" });
  }
  const choice = await select({ message: "Select project root", options });
  if (isCancel(choice)) {
    cancel("Cancelled");
    throw new Error("Cancelled");
  }
  if (choice === "pwd") {
    await ensureDirWritable(process.cwd());
    return process.cwd();
  }
  if (choice === "recent") {
    const pick = await select({
      message: "Recent directories",
      options: recents.map((r) => ({ value: r, label: r })),
    });
    if (isCancel(pick)) {
      cancel("Cancelled");
      throw new Error("Cancelled");
    }
    await ensureDirWritable(String(pick));
    return path.resolve(String(pick));
  }
  const typed = await text({ message: "Enter path" });
  if (isCancel(typed)) {
    cancel("Cancelled");
    throw new Error("Cancelled");
  }
  const resolved = path.resolve(String(typed));
  const exists = fs.existsSync(resolved);
  if (!exists) {
    throw new Error(`Path does not exist: ${resolved}`);
  }
  await ensureDirWritable(resolved);
  return resolved;
}

async function ensureProjectDir(root: string, name: string, slug: string): Promise<{ name: string; slug: string; dir: string }> {
  let projectName = name;
  let projectSlug = slug || slugify(name);
  if (!projectSlug) {
    projectSlug = slugify(projectName) || "docflow-project";
  }
  while (true) {
    const dir = path.join(root, projectSlug);
    const exists = fs.existsSync(dir);
    if (!exists) {
      return { name: projectName, slug: projectSlug, dir };
    }
    const entries = await fsp.readdir(dir);
    if (entries.length === 0) {
      return { name: projectName, slug: projectSlug, dir };
    }
    console.log(pc.yellow(`Target exists and is not empty: ${dir}`));
    const action = await select({
      message: "Choose next step",
      options: [
        { value: "abort", label: "Abort" },
        { value: "rename", label: "New name" },
        { value: "suffix", label: "Suffix -2" },
      ],
    });
    if (isCancel(action) || action === "abort") {
      cancel("Aborted");
      throw new Error("Aborted");
    }
    if (action === "rename") {
      const next = await text({ message: "Project name", placeholder: `${projectName} Next` });
      if (isCancel(next)) continue;
      projectName = String(next).trim() || projectName;
      projectSlug = slugify(projectName) || projectSlug;
      continue;
    }
    if (action === "suffix") {
      projectSlug = projectSlug.endsWith("-2") ? projectSlug : `${projectSlug}-2`;
    }
  }
}

function computeOwner(env: Env): string {
  if (env.DOCFLOW_OWNER && env.DOCFLOW_OWNER.trim()) return env.DOCFLOW_OWNER;
  try {
    return os.userInfo().username;
  } catch {
    return "owner";
  }
}

function buildTokens(opts: {
  projectName: string;
  projectSlug: string;
  platform: "web" | "mobile";
  pack: "nextjs-convex" | "rn-expo-convex";
  owner: string;
}): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    PROJECT_NAME: opts.projectName,
    PROJECT_SLUG: opts.projectSlug,
    OWNER: opts.owner,
    DATE: today,
    ITER_NUM: "01",
    PLATFORM: opts.platform,
    PACK_NAME: opts.pack,
    PACK_VERSION: today,
  };
}

function itemFilePath(item: SeedItemPlan): string {
  const baseDir = item.kind === "spike" ? "docflow/spikes" : "docflow/items";
  const slug = slugify(item.title) || item.id.toLowerCase();
  return `${baseDir}/${item.id}-${slug}.md`;
}

function normalizeItems(items: SeedItemPlan[]): SeedItemPlan[] {
  return items.map((item) => ({ ...item, filePath: item.filePath || itemFilePath(item) }));
}

function formatAcceptance(items: string[]): string[] {
  if (!items || items.length === 0) {
    return ["Goal is demonstrably met", "Edge cases reviewed"];
  }
  return items;
}

function formatSubtasks(items: string[]): string[] {
  if (!items || items.length === 0) {
    return ["[ ] Outline tasks", "[ ] Execute"];
  }
  return items;
}

async function writeItemDoc(root: string, owner: string, item: SeedItemPlan): Promise<void> {
  const target = path.join(root, item.filePath);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  const schema = item.kind === "spike" ? "spike.v1" : "item.v1";
  const acceptance = formatAcceptance(item.acceptance);
  const subtasks = formatSubtasks(item.subtasks).map((task) => {
    const trimmed = task.startsWith("- [") ? task : `- [ ] ${task}`;
    return trimmed;
  });
  const fm: string[] = [
    "---",
    `schema: ${schema}`,
    `id: ${item.id}`,
    `title: ${item.title}`,
    `type: ${item.kind}`,
    "status: pending",
    `owner: ${owner}`,
    `priority: ${item.priority}`,
    `complexity: ${item.complexity}`,
    "promoted: true",
    item.dependsOn && item.dependsOn.length > 0
      ? `dependsOn: [${item.dependsOn.join(", ")}]`
      : "dependsOn: []",
    "links: []",
    "---",
    "",
  ];
  const body: string[] = [
    "## Objective",
    item.objective || "Describe the measurable outcome.",
    "",
    "## Acceptance Criteria",
    ...acceptance.map((criterion) => (criterion.startsWith("- ") ? criterion : `- ${criterion}`)),
    "",
    "## Subtasks",
    ...subtasks,
    "",
  ];
  await fsp.writeFile(target, [...fm, ...body].join("\n"), "utf8");
}

function buildWorklistYaml(projectName: string, items: SeedItemPlan[], owner: string): string {
  const summary = {
    total: items.length,
    pending: items.length,
    in_progress: 0,
    in_review: 0,
    completed: 0,
    p0: items.filter((it) => it.priority === "P0").length,
  };
  const lines: string[] = [
    "---",
    "schema: worklist.v1",
    "id: iteration-01-features",
    `project: ${projectName}`,
    `owner: ${owner}`,
    "statuses: [pending, in_progress, in_review, completed]",
    "summary:",
    `  total: ${summary.total}`,
    `  pending: ${summary.pending}`,
    `  in_progress: ${summary.in_progress}`,
    `  in_review: ${summary.in_review}`,
    `  completed: ${summary.completed}`,
    `  p0: ${summary.p0}`,
    "items:",
  ];
  for (const item of items) {
    lines.push("  - id: " + item.id);
    lines.push("    type: " + item.kind);
    lines.push("    title: " + JSON.stringify(item.title));
    lines.push("    status: pending");
    lines.push("    owner: " + owner);
    lines.push("    priority: " + item.priority);
    lines.push("    complexity: " + item.complexity);
    if (item.dependsOn && item.dependsOn.length > 0) {
      lines.push(`    dependsOn: [${item.dependsOn.join(", ")}]`);
    } else {
      lines.push("    dependsOn: []");
    }
    lines.push("    promoted: true");
    lines.push("    file: " + item.filePath);
  }
  lines.push("---");
  lines.push("");
  lines.push("# Current Iteration – Worklist");
  lines.push("");
  lines.push("This is the living worklist. Keep items scoped, statused, and linked to ADRs/notes.");
  lines.push("");
  lines.push("## Columns");
  lines.push("- id | type | title | status | owner | priority | complexity | dependencies | promoted? | file?");
  lines.push("");
  lines.push("## Guidance");
  lines.push("- Status flow: pending → in_progress → in_review → completed");
  lines.push("- Link ADRs in item body and/or `links` field.");
  lines.push("");
  return lines.join("\n");
}

async function writeWorklist(root: string, projectName: string, owner: string, items: SeedItemPlan[]): Promise<void> {
  const target = path.join(root, "docflow/iterations/current/features.md");
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, buildWorklistYaml(projectName, items, owner), "utf8");
}

async function copyTemplates(projectDir: string, tokens: Record<string, string>): Promise<void> {
  const src = resolveAssetsSubdir("templates-runtime");
  await renderTemplates({ src, dest: projectDir, tokens });
}

async function copyPackSnapshot(projectDir: string, pack: string, tokens: Record<string, string>): Promise<void> {
  const src = resolveAssetsSubdir(path.join("packs", pack));
  const destDir = path.join(projectDir, "docflow/project/stack");
  await fsp.mkdir(destDir, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true }).catch(() => []);
  if (entries.length === 1 && entries[0].isFile()) {
    const file = entries[0].name;
    const raw = await fsp.readFile(path.join(src, file), "utf8");
    const rendered = raw.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => tokens[key] ?? match);
    const target = path.join(destDir, `${pack}-${tokens.DATE}.md`);
    await fsp.writeFile(target, rendered, "utf8");
    return;
  }
  const targetDir = path.join(destDir, `${pack}-${tokens.DATE}`);
  await renderTemplates({ src, dest: targetDir, tokens });
}

async function writeEnvExample(projectDir: string, platform: "web" | "mobile", tokens: Record<string, string>): Promise<void> {
  const filename = platform === "mobile" ? ".env.example.mobile" : ".env.example";
  const target = path.join(projectDir, filename);
  const content = [
    `# Generated ${tokens.DATE}`,
    `DOCFLOW_PROJECT=${tokens.PROJECT_NAME}`,
    "APP_BASE_URL=",
    "CONVEX_URL=",
    "LOG_LEVEL=info",
  ].join("\n");
  await fsp.writeFile(target, content, "utf8");
}

function cursorAvailable(): boolean {
  try {
    const res = spawnSync("which", ["cursor"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

async function maybeOpenCursor(projectDir: string): Promise<void> {
  const available = cursorAvailable();
  if (!available) return;
  const yn = await confirm({ message: "Open in Cursor?", initialValue: false });
  if (isCancel(yn) || !yn) return;
  const child = spawn("cursor", [projectDir], { stdio: "ignore", detached: true });
  child.unref();
}

function updateItemAfterEdit(item: SeedItemPlan): SeedItemPlan {
  return { ...item, filePath: itemFilePath(item) };
}

async function editItem(items: SeedItemPlan[], index: number): Promise<SeedItemPlan[]> {
  const item = items[index];
  const action = await select({
    message: `Edit ${item.id}?`,
    options: [
      { value: "title", label: "Edit title" },
      { value: "objective", label: "Edit objective" },
      { value: "acceptance", label: "Edit acceptance" },
      { value: "subtasks", label: "Edit subtasks" },
      { value: "priority", label: "Set priority" },
      { value: "complexity", label: "Set complexity" },
      { value: "cancel", label: "Done" },
    ],
    initialValue: "cancel",
  });
  if (isCancel(action) || action === "cancel") return items;
  let updated = { ...item };
  if (action === "title") {
    const next = await text({ message: "Title", initialValue: item.title });
    if (!isCancel(next) && String(next).trim()) {
      updated.title = String(next).trim();
    }
  } else if (action === "objective") {
    const next = await text({ message: "Objective", initialValue: item.objective });
    if (!isCancel(next) && String(next).trim()) {
      updated.objective = String(next).trim();
    }
  } else if (action === "acceptance") {
    const next = await promptList("Acceptance criteria (comma or newline separated)", item.acceptance);
    if (next) {
      updated.acceptance = next;
    }
  } else if (action === "subtasks") {
    const next = await promptList("Subtasks (comma or newline separated)", item.subtasks);
    if (next) {
      updated.subtasks = next;
    }
  } else if (action === "priority") {
    const next = await select({
      message: "Priority",
      options: [
        { value: "P0", label: "P0" },
        { value: "P1", label: "P1" },
        { value: "P2", label: "P2" },
      ],
      initialValue: item.priority,
    });
    if (!isCancel(next)) {
      updated.priority = next as SeedItemPlan["priority"];
    }
  } else if (action === "complexity") {
    const next = await select({
      message: "Complexity",
      options: [
        { value: "XS", label: "XS" },
        { value: "S", label: "S" },
        { value: "M", label: "M" },
        { value: "L", label: "L" },
        { value: "XL", label: "XL" },
      ],
      initialValue: item.complexity,
    });
    if (!isCancel(next)) {
      updated.complexity = next as SeedItemPlan["complexity"];
    }
  }
  const nextItems = items.slice();
  nextItems[index] = updateItemAfterEdit(updated);
  return nextItems;
}

async function reorderItems(items: SeedItemPlan[]): Promise<SeedItemPlan[]> {
  const pick = await select({
    message: "Choose item to move",
    options: items.map((item, idx) => ({ value: String(idx), label: `${item.id} – ${item.title}` })),
  });
  if (isCancel(pick)) return items;
  const index = Number(pick);
  const direction = await select({
    message: "Move",
    options: [
      { value: "up", label: "Up" },
      { value: "down", label: "Down" },
    ],
  });
  if (isCancel(direction)) return items;
  const next = items.slice();
  if (direction === "up" && index > 0) {
    const [item] = next.splice(index, 1);
    next.splice(index - 1, 0, item);
  } else if (direction === "down" && index < items.length - 1) {
    const [item] = next.splice(index, 1);
    next.splice(index + 1, 0, item);
  }
  return next;
}

async function buildSeedPlan(
  input: Parameters<typeof seedIteration>[0],
  message: string,
): Promise<SeedPlan> {
  const s = spinner();
  s.start(message);
  try {
    const plan = await seedIteration(input);
    s.stop("Seed iteration ready");
    return {
      adr: plan.adr,
      items: normalizeItems(plan.items),
      fileTreePreview: plan.fileTreePreview,
    };
  } catch (err) {
    s.stop("Seed iteration failed");
    throw err;
  }
}

export async function newProjectFlow(): Promise<void> {
  intro("Docflow: New Project");
  const rawEnv = loadEnv();
  const idea = await promptForIdea();
  const followUps = await collectFollowUps(idea);

  const charterAnswers: Record<string, string> = {};
  for (const qa of followUps) {
    charterAnswers[qa.question] = qa.answer;
  }

  const charter = await editCharter(await summarizeCharter({ idea, answers: charterAnswers }));

  const platformRes = await select({
    message: "Target platform",
    options: [
      { value: "web", label: "Web" },
      { value: "mobile", label: "Mobile" },
    ],
    initialValue: "web",
  });
  if (isCancel(platformRes)) {
    cancel("Cancelled");
    return;
  }
  const platform = platformRes as "web" | "mobile";
  const defaultPack = platform === "web" ? "nextjs-convex" : "rn-expo-convex";

  let pack = defaultPack;
  const packChoice = await select({
    message: `Pack (${defaultPack} default)`,
    options: [
      { value: defaultPack, label: `${defaultPack} (default)` },
      { value: "override", label: "Override…" },
    ],
    initialValue: defaultPack,
  });
  if (isCancel(packChoice)) {
    cancel("Cancelled");
    return;
  }
  if (packChoice === "override") {
    const typed = await text({ message: "Enter pack id", initialValue: defaultPack });
    if (isCancel(typed)) {
      cancel("Cancelled");
      return;
    }
    const candidate = String(typed).trim();
    if (candidate === "nextjs-convex" || candidate === "rn-expo-convex") {
      pack = candidate as typeof pack;
    } else {
      note("Pack override unavailable", `Using ${defaultPack} instead`);
      pack = defaultPack;
    }
  }

  const authChoice = await select({
    message: "Authentication",
    options: [
      { value: "convex", label: "Convex Auth" },
      { value: "clerk", label: "Clerk" },
      { value: "betterauth", label: "BetterAuth" },
      { value: "none", label: "None" },
    ],
    initialValue: "convex",
  });
  if (isCancel(authChoice)) {
    cancel("Cancelled");
    return;
  }
  const auth = authChoice as "convex" | "clerk" | "betterauth" | "none";

  const toggleRes = await multiselect({
    message: "Enable quality toggles",
    options: [
      { value: "lint", label: "Lint" },
      { value: "format", label: "Formatter" },
      { value: "tsStrict", label: "TypeScript strict" },
      { value: "tests", label: "Tests" },
      { value: "ci", label: "CI" },
    ],
  });
  if (isCancel(toggleRes)) {
    cancel("Cancelled");
    return;
  }
  const toggles = makeToggleState(toggleRes as QualityToggle[]);

  const defaultName = charter.goal || idea;
  const nameRes = await text({ message: "Project name", initialValue: defaultName });
  if (isCancel(nameRes)) {
    cancel("Cancelled");
    return;
  }
  const projectName = String(nameRes).trim() || defaultName;
  const projectSlug = slugify(projectName) || slugify(defaultName) || "docflow-project";

  let rootDir: string;
  try {
    rootDir = await chooseRootDir(rawEnv.DOCFLOW_ROOT || undefined);
  } catch (err) {
    note("Unable to prepare directory", (err as Error).message);
    return;
  }

  const ensured = await ensureProjectDir(rootDir, projectName, projectSlug);
  const targetDir = ensured.dir;
  const finalProjectName = ensured.name;
  const finalSlug = ensured.slug;

  process.env.DOCFLOW_ROOT = rootDir;
  let env: Env;
  try {
    env = ensureEnv();
  } catch (err) {
    note("Environment error", (err as Error).message);
    return;
  }

  const seedInput = {
    goal: charter.goal,
    outcomes: charter.outcomes,
    platform,
    pack: pack as "nextjs-convex" | "rn-expo-convex",
    auth,
    toggles,
  } as const;

  const plan = await buildSeedPlan(seedInput, "Generating seed iteration...");
  let items = plan.items;
  let fileTree = plan.fileTreePreview;
  let regenerated = false;

  while (true) {
    printCharter(charter);
    printSeedItems(items);
    printFileTreePreview(fileTree);
    const action = await select({
      message: "Review plan",
      options: [
        { value: "editItem", label: "Edit item" },
        { value: "reorder", label: "Reorder items" },
        { value: "regen", label: regenerated ? "Regenerate (used)" : "Regenerate" },
        { value: "continue", label: "Continue" },
      ],
      initialValue: "continue",
    });
    if (isCancel(action) || action === "continue") break;
    if (action === "editItem") {
      const pick = await select({
        message: "Pick an item",
        options: items.map((item, idx) => ({ value: String(idx), label: `${item.id} – ${item.title}` })),
      });
      if (!isCancel(pick)) {
        const idx = Number(pick);
        items = await editItem(items, idx);
      }
    } else if (action === "reorder") {
      items = await reorderItems(items);
    } else if (action === "regen") {
      if (regenerated) {
        note("Already regenerated", "Seed items can only be regenerated once.");
      } else {
        const next = await buildSeedPlan(seedInput, "Regenerating seed iteration...");
        items = next.items;
        fileTree = next.fileTreePreview;
        regenerated = true;
      }
    }
  }

  const confirmGenerate = await confirm({ message: `Generate project at ${targetDir}?`, initialValue: true });
  if (isCancel(confirmGenerate) || !confirmGenerate) {
    cancel("Cancelled");
    return;
  }

  await fsp.mkdir(targetDir, { recursive: true });
  const tokens = buildTokens({
    projectName: finalProjectName,
    projectSlug: finalSlug,
    platform,
    pack: pack as "nextjs-convex" | "rn-expo-convex",
    owner: computeOwner(env),
  });

  const progress = spinner();
  progress.start("Rendering templates...");
  await copyTemplates(targetDir, tokens);
  progress.message("Copying pack snapshot...");
  await copyPackSnapshot(targetDir, pack, tokens);
  progress.message("Writing seed docs...");
  for (const item of items) {
    await writeItemDoc(targetDir, tokens.OWNER, item);
  }
  progress.message("Updating worklist...");
  await writeWorklist(targetDir, finalProjectName, tokens.OWNER, items);
  progress.message("Writing env example...");
  await writeEnvExample(targetDir, platform, tokens);
  progress.stop("Project ready");

  await writeRecents(rootDir);
  note("ready", `Project created at ${targetDir}`);
  await maybeOpenCursor(targetDir);
  outro("Done");
}
