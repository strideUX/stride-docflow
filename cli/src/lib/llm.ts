import process from "node:process";
import { generateText } from "ai";
import type { LanguageModelV1 } from "ai";
import { getModel } from "../ai/client.ts";
import { allocIds } from "./ids.ts";
import { slugify } from "./slug.ts";
import { loadEnv, validateEnv, ensureEnv, type Env } from "../core/env.ts";

interface FollowUpContext {
  idea: string;
  prior?: Array<{ question: string; answer: string }>;
}

interface CharterCtx {
  idea: string;
  answers: Record<string, string>;
}

interface SeedInput {
  goal: string;
  outcomes: string[];
  platform: "web" | "mobile";
  pack: "nextjs-convex" | "rn-expo-convex";
  auth: "convex" | "clerk" | "betterauth" | "none";
  toggles: {
    lint: boolean;
    format: boolean;
    tsStrict: boolean;
    tests: boolean;
    ci: boolean;
    analytics?: boolean;
  };
}

interface SeedItemPlan {
  kind: "feature" | "chore" | "spike";
  id?: string;
  title: string;
  objective: string;
  acceptance: string[];
  subtasks: string[];
  priority: "P0" | "P1" | "P2";
  complexity: "XS" | "S" | "M" | "L" | "XL";
  dependsOn?: string[];
  filePath?: string;
}

interface SeedResult {
  adr: { id: string; title: string; body: string };
  items: SeedItemPlan[];
  fileTreePreview: string[];
}

function truthyEnv(name: string): boolean {
  const v = String(process.env[name] ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y";
}

function ensureModelEnv(): Env {
  const env = loadEnv();
  const validation = validateEnv(env);
  if (!validation.ok) {
    const blocking = validation.missing.filter((m) => m !== "DOCFLOW_ROOT");
    if (blocking.length > 0) {
      throw new Error(validation.message);
    }
  }
  if (!env.DOCFLOW_ROOT) {
    env.DOCFLOW_ROOT = process.cwd();
  }
  return env;
}

async function resolveModel(): Promise<LanguageModelV1> {
  const env = truthyEnv("AI_DRY_RUN") ? ensureEnv() : ensureModelEnv();
  return getModel(env);
}

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fence = /^```json\s*([\s\S]*?)```/i;
  const match = trimmed.match(fence);
  if (match) return match[1].trim();
  if (trimmed.startsWith("```")) {
    const closing = trimmed.indexOf("```", 3);
    if (closing !== -1) {
      return trimmed.slice(3, closing).trim();
    }
  }
  return trimmed;
}

function parseJson<T>(text: string): T | null {
  try {
    const payload = extractJsonPayload(text);
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

function mockFollowUps(): string[] {
  return [
    "Who are the primary users and what problem are we solving for them?",
    "What is the scrappy outcome you'd like in the first iteration?",
    "What risks or constraints should we keep in mind?",
  ];
}

function mockCharter(ctx: CharterCtx): {
  goal: string;
  outcomes: string[];
  constraints: string[];
  nonGoals: string[];
} {
  const answers = Object.values(ctx.answers).filter(Boolean);
  const goal = answers[0] ?? `Ship an MVP for ${ctx.idea}`;
  const outcomes = answers.slice(1).map((ans, idx) => `Outcome ${idx + 1}: ${ans}`);
  if (outcomes.length === 0) outcomes.push("Outcome 1: Validate core hypothesis");
  return {
    goal,
    outcomes,
    constraints: ["Stay within scope for iteration 01"],
    nonGoals: ["Polish beyond primary flow"],
  };
}

function ensureSetupItem(items: SeedItemPlan[], auth: SeedInput["auth"]): void {
  const setup = items.find((it) => it.title.toLowerCase().includes("project setup"));
  const subtasks = [
    "init framework",
    "install Convex",
    auth === "none" ? "configure auth placeholder" : "configure auth",
    "git init + initial commit",
  ];
  if (setup) {
    setup.kind = "feature";
    setup.subtasks = subtasks;
    return;
  }
  items.unshift({
    kind: "feature",
    title: "Project Setup",
    objective: "Scaffold the project and boot Convex",
    acceptance: ["Repo initialized", "Framework bootstrapped", "Convex ready"],
    subtasks,
    priority: "P0",
    complexity: "M",
  });
}

function applyIds(items: SeedItemPlan[]): SeedItemPlan[] {
  const alloc = allocIds({ F: 0, C: 0, S: 0 });
  return items.map((item) => {
    if (item.id) return item;
    if (item.kind === "feature") return { ...item, id: alloc.nextF() };
    if (item.kind === "chore") return { ...item, id: alloc.nextC() };
    return { ...item, id: alloc.nextS() };
  });
}

function withFilePaths(items: SeedItemPlan[]): SeedItemPlan[] {
  return items.map((item) => {
    if (item.filePath) return item;
    const slug = slugify(item.title) || item.id?.toLowerCase() || "item";
    const dir = item.kind === "spike" ? "docflow/spikes" : "docflow/items";
    const id = item.id ?? "TBD";
    const rel = `${dir}/${id}-${slug}.md`;
    return { ...item, filePath: rel };
  });
}

function mockSeedIteration(input: SeedInput): SeedResult {
  const base: SeedItemPlan[] = [
    {
      kind: "feature",
      title: "Project Setup",
      objective: "Boot the project skeleton",
      acceptance: ["Repo initialized", "Framework bootstrapped"],
      subtasks: [
        "init framework",
        "install Convex",
        input.auth === "none" ? "configure auth placeholder" : "configure auth",
        "git init + initial commit",
      ],
      priority: "P0",
      complexity: "M",
    },
    {
      kind: "feature",
      title: "Core user flow",
      objective: `Deliver the primary outcome: ${input.goal}`,
      acceptance: ["Happy path demo", "Basic instrumentation"],
      subtasks: ["Design quick flow", "Implement screens", "Wire data"],
      priority: "P1",
      complexity: "M",
    },
    {
      kind: "chore",
      title: "Quality rails",
      objective: "Enable linting, formatting, and CI",
      acceptance: ["Scripts wired", "CI stub"],
      subtasks: ["Add lint configs", "Add prettier", "Bootstrap CI"],
      priority: "P1",
      complexity: "S",
    },
    {
      kind: "spike",
      title: "Risk assessment",
      objective: "Understand major unknowns",
      acceptance: ["Unknown documented"],
      subtasks: ["Identify risks", "Outline mitigation"],
      priority: "P2",
      complexity: "S",
    },
  ];

  const items = withFilePaths(applyIds(base));
  return {
    adr: {
      id: "ADR-ITER-01",
      title: "Iteration framing",
      body: `Focus on ${input.goal}. Keep scope to seed iteration.`,
    },
    items,
    fileTreePreview: [
      `${slugify(input.goal || "new-project") || "new-project"}/`,
      "  .cursor/",
      "  docflow/",
      "  docflow/items/",
      input.platform === "mobile" ? "  app/" : "  web/",
    ],
  };
}

export async function suggestFollowUps(ctx: FollowUpContext): Promise<string[]> {
  if (truthyEnv("AI_DRY_RUN")) {
    return mockFollowUps();
  }

  const model = await resolveModel();
  const prior = ctx.prior && ctx.prior.length
    ? ctx.prior.map((p) => `Q: ${p.question}\nA: ${p.answer}`).join("\n")
    : "None";
  const { text } = await generateText({
    model,
    system: [
      "You help product collaborators understand an idea.",
      "Return between two and four concise follow-up questions as a JSON array of strings.",
      "Focus on clarifying users, outcomes, risks, and constraints.",
    ].join(" "),
    prompt: [
      `Idea: ${ctx.idea}`,
      `Prior answers:\n${prior}`,
      "Questions (JSON array):",
    ].join("\n\n"),
  });
  const parsed = parseJson<string[]>(text);
  if (parsed && Array.isArray(parsed) && parsed.length > 0) {
    return parsed.slice(0, 4);
  }
  return mockFollowUps();
}

export async function summarizeCharter(ctx: CharterCtx): Promise<{
  goal: string;
  outcomes: string[];
  constraints: string[];
  nonGoals: string[];
}> {
  if (truthyEnv("AI_DRY_RUN")) {
    return mockCharter(ctx);
  }

  const model = await resolveModel();
  const answers = Object.entries(ctx.answers)
    .map(([question, answer]) => `- ${question}: ${answer}`)
    .join("\n");
  const { text } = await generateText({
    model,
    system: [
      "You distill product ideas into a concise charter.",
      "Return JSON with { goal: string, outcomes: string[], constraints: string[], nonGoals: string[] }.",
      "Keep statements actionable and measurable where possible.",
    ].join(" "),
    prompt: [
      `Idea: ${ctx.idea}`,
      `Additional notes:\n${answers || "None"}`,
      "Respond with compact JSON only.",
    ].join("\n\n"),
  });
  const parsed = parseJson<{ goal: string; outcomes: string[]; constraints: string[]; nonGoals: string[] }>(text);
  if (parsed) {
    return {
      goal: parsed.goal || ctx.idea,
      outcomes: Array.isArray(parsed.outcomes) ? parsed.outcomes : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      nonGoals: Array.isArray(parsed.nonGoals) ? parsed.nonGoals : [],
    };
  }
  return mockCharter(ctx);
}

export async function seedIteration(input: SeedInput): Promise<SeedResult> {
  if (truthyEnv("AI_DRY_RUN")) {
    return mockSeedIteration(input);
  }

  const model = await resolveModel();
  const toggles = Object.entries(input.toggles)
    .map(([key, value]) => `${key}=${value ? "on" : "off"}`)
    .join(", ");
  const { text } = await generateText({
    model,
    system: [
      "You plan the first iteration for a new software project.",
      "Return JSON with keys: adr {id,title,body}, items[], fileTreePreview[].",
      "Each item must include kind(feature|chore|spike), title, objective, acceptance[], subtasks[], priority (P0|P1|P2), complexity (XS|S|M|L|XL).",
      "Generate stable ids like F001, C001, S001 and filePath (docflow/items/F001-slug.md).",
      "Guarantee one 'Project Setup' feature with subtasks: init framework, install Convex, configure auth, git init + initial commit.",
    ].join(" "),
    prompt: [
      `Goal: ${input.goal}`,
      `Outcomes: ${input.outcomes.join(", ")}`,
      `Platform: ${input.platform}`,
      `Pack: ${input.pack}`,
      `Auth: ${input.auth}`,
      `Toggles: ${toggles}`,
      "JSON only.",
    ].join("\n"),
  });

  const parsed = parseJson<SeedResult>(text);
  if (parsed && parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
    const normalizedItems = withFilePaths(applyIds(parsed.items));
    ensureSetupItem(normalizedItems, input.auth);
    const fileTreePreview = Array.isArray(parsed.fileTreePreview) && parsed.fileTreePreview.length
      ? parsed.fileTreePreview
      : mockSeedIteration(input).fileTreePreview;
    return {
      adr: parsed.adr ?? {
        id: "ADR-ITER-01",
        title: "Iteration framing",
        body: `Focus on ${input.goal}`,
      },
      items: normalizedItems,
      fileTreePreview,
    };
  }

  return mockSeedIteration(input);
}

