import pc from "picocolors";
import path from "node:path";
import { intro, outro, select, text, confirm, isCancel, cancel } from "@clack/prompts";
import { ensureEnv } from "../../core/env.js";
import type { Complexity, Priority, ProjectSpec, SeedItem } from "../../core/types.js";
import { inferSeedPlan, type InferSeedPlanInput } from "../../ai/client.js";
import { detectEditor } from "../../ui/editor.js";
import { printPlanSummary } from "../../ui/preview.js";
import { planFileWrites } from "../../generator/plan.js";
import { buildTokens } from "../../generator/renderer.js";
import { writeProject } from "../../generator/write.js";

type DeploymentChoice = "vercel" | "none" | "spike";

function todayYYYYMMDD(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseList(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function printFileTreeMock(platform: "web" | "mobile", packName: string) {
  const tree = [
    pc.bold("Planned file tree (mock)"),
    "",
    `${pc.cyan("my-app/")}`,
    `  ${pc.dim("app/")}`,
    `  ${pc.dim("components/")}`,
    platform === "web" ? `  ${pc.dim("convex/")}` : `  ${pc.dim("mobile/")}`,
    `  ${pc.dim(".env.local")} ${pc.gray("# generated tokens")}`,
    `  ${pc.dim("package.json")} ${pc.gray("# ${packName}")}`,
  ].join("\n");
  // eslint-disable-next-line no-console
  console.log(tree);
}

function printItems(items: SeedItem[]) {
  // eslint-disable-next-line no-console
  console.log(pc.bold("\nSeed items:"));
  items.forEach((it, idx) => {
    const parts: string[] = [];
    parts.push(`${idx + 1}. [${it.type}] ${it.title}`);
    if (it.priority) parts.push(pc.yellow(`priority=${it.priority}`));
    if (it.complexity) parts.push(pc.magenta(`complexity=${it.complexity}`));
    // eslint-disable-next-line no-console
    console.log("  ", parts.join(" "));
  });
}

async function chooseItem(items: SeedItem[], message: string): Promise<number | null> {
  const options = items.map((it, i) => ({ value: String(i), label: `${i + 1}. ${it.title}` }));
  const res = await select({ message, options: [...options, { value: "-1", label: "Cancel" }] });
  if (isCancel(res) || res === "-1") return null;
  return Number(res);
}

async function promptPriority(current?: Priority): Promise<Priority | null> {
  const res = await select({
    message: `Set priority${current ? ` (current ${current})` : ""}`,
    options: [
      { value: "P0", label: "P0" },
      { value: "P1", label: "P1" },
      { value: "P2", label: "P2" },
      { value: "-1", label: "Cancel" },
    ],
  });
  if (isCancel(res) || res === "-1") return null;
  return res as Priority;
}

async function promptComplexity(current?: Complexity): Promise<Complexity | null> {
  const res = await select({
    message: `Set complexity${current ? ` (current ${current})` : ""}`,
    options: [
      { value: "XS", label: "XS" },
      { value: "S", label: "S" },
      { value: "M", label: "M" },
      { value: "L", label: "L" },
      { value: "XL", label: "XL" },
      { value: "-1", label: "Cancel" },
    ],
  });
  if (isCancel(res) || res === "-1") return null;
  return res as Complexity;
}

function previewOpenInEditor(): void {
  const detected = detectEditor();
  if (!detected) {
    // eslint-disable-next-line no-console
    console.log(pc.yellow("No editor detected. Set $VISUAL or $EDITOR."));
    return;
  }
  // eslint-disable-next-line no-console
  console.log(pc.gray(`(preview) Would run: ${detected} <tmpfile>`));
}

function reflowPlanStub(items: SeedItem[]): SeedItem[] {
  // Placeholder: no-op for now. Later, could sort by priority/complexity.
  return items.slice();
}

export interface NewPlanResult {
  spec: ProjectSpec;
  items: SeedItem[];
  deps: Array<[string, string]>;
  packVersion: string;
}

export async function runNew(): Promise<NewPlanResult | void> {
  const env = ensureEnv();

  intro("Docflow: New Project");

  // Phase 1: Platform
  const platformRes = await select({
    message: "Target platform?",
    options: [
      { value: "web", label: "Web" },
      { value: "mobile", label: "Mobile" },
    ],
  });
  if (isCancel(platformRes)) {
    cancel("Cancelled");
    return;
  }
  const platform = platformRes as "web" | "mobile";

  // Phase 2: Framing
  const goal = await text({
    message: "What is the primary goal?",
    placeholder: "e.g., MVP for XYZ",
    validate(value) {
      if (!value || !value.trim()) return "Goal is required";
    },
  });
  if (isCancel(goal)) {
    cancel("Cancelled");
    return;
  }

  const outcomes: string[] = [];
  for (let i = 0; i < 3; i++) {
    const out = await text({ message: `Outcome ${i + 1}` });
    if (isCancel(out)) {
      cancel("Cancelled");
      return;
    }
    if (String(out).trim()) outcomes.push(String(out).trim());
  }
  for (let i = 3; i < 5; i++) {
    const addMore = await confirm({ message: "Add another outcome?", initialValue: i === 3 });
    if (isCancel(addMore) || !addMore) break;
    const out = await text({ message: `Outcome ${i + 1}` });
    if (isCancel(out)) {
      cancel("Cancelled");
      return;
    }
    if (String(out).trim()) outcomes.push(String(out).trim());
  }

  const constraintsRaw = await text({
    message: "Constraints (comma-separated, optional)",
    placeholder: "budget, deadline, security, ...",
  });
  if (isCancel(constraintsRaw)) {
    cancel("Cancelled");
    return;
  }
  const constraints = parseList(String(constraintsRaw));

  const nonGoalsRaw = await text({
    message: "Non-goals (comma-separated, optional)",
    placeholder: "what this iteration is NOT",
  });
  if (isCancel(nonGoalsRaw)) {
    cancel("Cancelled");
    return;
  }
  const nonGoals = parseList(String(nonGoalsRaw));

  // Phase 3: Pack selection + Auth
  const defaultPack = platform === "web" ? "nextjs-convex" : "rn-expo-convex";
  const packRes = await select({
    message: `Choose a pack (${platform})`,
    options: [
      { value: defaultPack, label: `${defaultPack} (default)` },
    ],
  });
  if (isCancel(packRes)) {
    cancel("Cancelled");
    return;
  }
  const packName = String(packRes);

  const authRes = await select({
    message: "Authentication provider?",
    options: [
      { value: "convex", label: "Convex Auth (default)" },
      { value: "clerk", label: "Clerk" },
      { value: "betterauth", label: "BetterAuth" },
      { value: "none", label: "None" },
    ],
  });
  if (isCancel(authRes)) {
    cancel("Cancelled");
    return;
  }
  const auth = String(authRes);

  // Phase 4: Rails toggles
  const persistence = await confirm({ message: "Persistence baseline?", initialValue: true });
  if (isCancel(persistence)) {
    cancel("Cancelled");
    return;
  }

  const loggingRes = await select({
    message: "Logging baseline",
    options: [
      { value: "console", label: "Console (with provider placeholder)" },
      { value: "provider-placeholder", label: "Provider-based wrapper" },
    ],
  });
  if (isCancel(loggingRes)) {
    cancel("Cancelled");
    return;
  }
  const logging = loggingRes as "console" | "provider-placeholder";

  const quality = await confirm({ message: "Quality gates?", initialValue: true });
  if (isCancel(quality)) {
    cancel("Cancelled");
    return;
  }

  const analytics = await confirm({ message: "Analytics?", initialValue: false });
  if (isCancel(analytics)) {
    cancel("Cancelled");
    return;
  }

  const deployment = (await select({
    message: "Deployment target?",
    options: [
      { value: "vercel", label: "Vercel" },
      { value: "none", label: "None" },
      { value: "spike", label: "Spike it" },
    ],
  })) as DeploymentChoice | symbol;
  if (isCancel(deployment)) {
    cancel("Cancelled");
    return;
  }

  const wantSpikes = deployment === "spike";

  // Phase 5: inferSeedPlan
  const input: InferSeedPlanInput = {
    platform,
    packName,
    framing: {
      goal: String(goal),
      outcomes,
      constraints,
      nonGoals,
    },
    railsToggles: {
      auth,
      persistence: Boolean(persistence),
      logging,
      quality: Boolean(quality),
      analytics: Boolean(analytics),
    },
    wantSpikes,
  };

  let items: SeedItem[] = [];
  let deps: Array<[string, string]> = [];
  try {
    const plan = await inferSeedPlan(input);
    items = plan.items;
    deps = plan.deps;
  } catch {
    // Fallback: simple local mock aligning with acceptance.
    items = [
      { type: "feature", title: `Bootstrap ${platform} app with ${packName}` },
      { type: "feature", title: auth !== "none" ? `Integrate auth: ${auth}` : "Add basic authentication scaffold" },
      { type: "feature", title: "Standardize console logging" },
      { type: "chore", title: "Configure linting, formatting, and hooks" },
      { type: "spike", title: wantSpikes ? "Evaluate deployment options" : "Investigate risks" },
    ];
    deps = [];
  }

  // Phase 6: Always-preview
  printFileTreeMock(platform, packName);
  printItems(items);

  // Inline edit loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const action = await select({
      message: "Edit plan?",
      options: [
        { value: "rename", label: "Rename item" },
        { value: "delete", label: "Delete item" },
        { value: "prio", label: "Change priority" },
        { value: "cx", label: "Change complexity" },
        { value: "open", label: "Open in editor" },
        { value: "done", label: "Done" },
      ],
    });
    if (isCancel(action) || action === "done") break;

    if (action === "open") {
      previewOpenInEditor();
    } else if (action === "rename") {
      const idx = await chooseItem(items, "Choose item to rename");
      if (idx == null) continue;
      const newTitle = await text({ message: "New title", placeholder: items[idx].title });
      if (isCancel(newTitle)) continue;
      items[idx] = { ...items[idx], title: String(newTitle).trim() || items[idx].title };
    } else if (action === "delete") {
      const idx = await chooseItem(items, "Choose item to delete");
      if (idx == null) continue;
      const ok = await confirm({ message: `Delete: ${items[idx].title}?`, initialValue: false });
      if (!isCancel(ok) && ok) items.splice(idx, 1);
    } else if (action === "prio") {
      const idx = await chooseItem(items, "Choose item to reprioritize");
      if (idx == null) continue;
      const next = await promptPriority(items[idx].priority);
      if (next) items[idx] = { ...items[idx], priority: next };
    } else if (action === "cx") {
      const idx = await chooseItem(items, "Choose item to resize");
      if (idx == null) continue;
      const next = await promptComplexity(items[idx].complexity);
      if (next) items[idx] = { ...items[idx], complexity: next };
    }

    items = reflowPlanStub(items);
    // Reprint after changes
    printItems(items);
  }

  const packVersion = todayYYYYMMDD();
  const spec: ProjectSpec = {
    meta: {
      projectName: "demo",
      projectSlug: "demo",
      owner: env.DOCFLOW_OWNER || "owner",
      platform,
      packName,
      packVersion,
      templateVersion: "0",
      dir: env.DOCFLOW_ROOT,
    },
    framing: {
      goal: String(goal),
      outcomes,
      constraints,
      nonGoals,
    },
    iteration: {
      iterNum: "01",
      goal: String(goal),
      outcomes,
      seedItems: items,
    },
  };

  const result: NewPlanResult = { spec, items, deps, packVersion };

  // Summarize
  printPlanSummary(spec);

  // Plan writes (dry run)
  const tokens = buildTokens({
    projectName: spec.meta.projectName,
    projectSlug: spec.meta.projectSlug,
    owner: spec.meta.owner,
    platform: spec.meta.platform,
    packName: spec.meta.packName,
    packVersion: spec.meta.packVersion,
    iterNum: spec.iteration.iterNum,
  });
  const dstRoot = `${env.DOCFLOW_ROOT}/${spec.meta.projectSlug}`;
  const planned = await planFileWrites(tokens, { dstRoot, packName });
  // Final diff preview: planned count and top-level tree
  // eslint-disable-next-line no-console
  console.log(pc.bold("\nFinal diff"));
  // eslint-disable-next-line no-console
  console.log(`${pc.bold("Planned writes:")} ${planned.length} files`);
  // Build top-level entries from planned paths
  const relPlanned = planned.map((p) => p.replaceAll(path.sep, "/").replace(`${dstRoot.replaceAll(path.sep, "/")}/`, ""));
  const topMap = new Map<string, { dir: boolean }>();
  for (const r of relPlanned) {
    const slash = r.indexOf("/");
    const top = slash === -1 ? r : r.slice(0, slash);
    const isDir = slash !== -1;
    const prev = topMap.get(top);
    topMap.set(top, { dir: prev?.dir || isDir });
  }
  const topEntries = Array.from(topMap.entries())
    .map(([name, info]) => (info.dir ? `${name}/` : name))
    .sort((a, b) => a.localeCompare(b));
  // eslint-disable-next-line no-console
  console.log(pc.bold("Top-level tree:"));
  // eslint-disable-next-line no-console
  console.log(pc.cyan(`${spec.meta.projectSlug}/`));
  topEntries.forEach((e) => {
    // eslint-disable-next-line no-console
    console.log(pc.dim("  "), e);
  });

  // Confirm generation
  const shouldWrite = await confirm({ message: "Generate now?", initialValue: true });
  if (!isCancel(shouldWrite) && shouldWrite) {
    await writeProject({ env, spec, items, deps });
  } else {
    cancel("Cancelled");
    return;
  }

  outro("");
  return result;
}
