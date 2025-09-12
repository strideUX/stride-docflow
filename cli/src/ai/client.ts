import process from "node:process";
import type { LanguageModelV1 } from "ai";
import { generateText } from "ai";
import type { Env } from "../core/env.js";
import type { SeedItem } from "../core/types.js";

export type RailsToggles = {
  auth: string;
  persistence: boolean;
  logging: "console" | "provider-placeholder";
  quality: boolean;
  analytics: boolean;
};

export interface InferSeedPlanInput {
  platform: "web" | "mobile";
  packName: string;
  framing: {
    goal: string;
    outcomes: string[];
    constraints?: string[];
    nonGoals?: string[];
  };
  railsToggles: RailsToggles;
  wantSpikes: boolean;
};

/**
 * Resolve a Vercel AI SDK model based on env.
 * Uses dynamic imports to avoid requiring provider packages unless needed.
 */
export async function getModel(env: Env): Promise<LanguageModelV1> {
  const temperature = env.AI_TEMPERATURE ?? 0.35;

  if (env.AI_PROVIDER === "openai") {
    // Imported lazily to avoid requiring the package in dry-run/dev paths.
    const mod = await import("@ai-sdk/openai").catch(() => {
      throw new Error(
        "Missing dependency '@ai-sdk/openai'. Please add it to dependencies."
      );
    });
    const base = mod.openai(env.AI_MODEL);
    return base.withSettings({ temperature });
  }

  if (env.AI_PROVIDER === "anthropic") {
    const mod = await import("@ai-sdk/anthropic").catch(() => {
      throw new Error(
        "Missing dependency '@ai-sdk/anthropic'. Please add it to dependencies."
      );
    });
    const base = mod.anthropic(env.AI_MODEL);
    return base.withSettings({ temperature });
  }

  throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
}

function truthyEnv(name: string): boolean {
  const v = String(process.env[name] ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y";
}

function makeMockItems(input: InferSeedPlanInput): {
  items: SeedItem[];
  rationale: string;
  deps: Array<[string, string]>;
} {
  const items: SeedItem[] = [];

  const baseTitles: string[] = [
    `Bootstrap ${input.platform} app with ${input.packName}`,
    input.railsToggles.auth
      ? `Integrate auth: ${input.railsToggles.auth}`
      : "Add basic authentication scaffold",
    input.railsToggles.persistence
      ? "Set up persistence layer"
      : "Wire in in-memory store",
    input.railsToggles.logging === "console"
      ? "Standardize console logging"
      : "Add provider-based logging wrapper",
    input.railsToggles.analytics
      ? "Add analytics event pipeline"
      : "Stub analytics hooks",
    "Define quality gates and CI checks",
    `Implement core flow: ${input.framing.outcomes[0] ?? input.framing.goal}`,
  ];

  const featurePool: SeedItem[] = baseTitles.map((t) => ({
    type: "feature",
    title: t,
  }));

  items.push(...featurePool.slice(0, 5 + Math.min(3, featurePool.length - 5)));

  // Optionally include a spike and a chore.
  if (input.wantSpikes) {
    items.push({ type: "spike", title: "Evaluate model integration and cost bounds" });
  }
  items.push({ type: "chore", title: "Configure linting, formatting, and precommit hooks" });

  // Add a plausible bug placeholder if auth present.
  if (input.railsToggles.auth) {
    items.push({ type: "bug", title: "Fix auth redirect loop on token refresh" });
  }

  // Cap to 10 items.
  const capped = items.slice(0, 10);

  // Create light dependency edges by title.
  const deps: Array<[string, string]> = [];
  const title = (s: SeedItem) => s.title;
  const byTitle = new Map(capped.map((s) => [s.title, s] as const));

  const want = (a: string, b: string) => {
    if (byTitle.has(a) && byTitle.has(b)) deps.push([a, b]);
  };

  want(`Bootstrap ${input.platform} app with ${input.packName}`,
    `Implement core flow: ${input.framing.outcomes[0] ?? input.framing.goal}`);
  if (input.railsToggles.auth) {
    want(
      `Integrate auth: ${input.railsToggles.auth}`,
      "Fix auth redirect loop on token refresh",
    );
  }

  const rationale = [
    `Plan derived from goal: ${input.framing.goal}.`,
    input.framing.outcomes.length
      ? `Targets outcomes: ${input.framing.outcomes.join(", ")}.`
      : "Outcomes unspecified; prioritized foundational work.",
    input.railsToggles.persistence
      ? "Includes persistence setup to enable stateful features."
      : "Skips durable storage; uses in-memory for speed.",
  ].join(" ");

  return { items: capped, rationale, deps };
}

/**
 * Generates a seed plan via the chosen LLM. When `AI_DRY_RUN=true`,
 * returns a mocked plan for development.
 */
export async function inferSeedPlan(input: InferSeedPlanInput): Promise<{
  items: SeedItem[];
  rationale: string;
  deps: Array<[string, string]>;
}> {
  // Development shortcut to avoid calling the model.
  if (truthyEnv("AI_DRY_RUN")) {
    return makeMockItems(input);
  }

  // TODO: Replace with a structured output call and parser.
  const systemPrompt = [
    "You are a senior product + tech planning assistant.",
    "Given project framing and rails toggles, propose a focused first-iteration plan",
    "with 5–10 items. Use concise, actionable titles. Include a rationale and",
    "dependencies as pairs of titles (A depends on B). Only include JSON output.",
  ].join(" ");

  const userPrompt = [
    `Platform: ${input.platform}`,
    `Pack: ${input.packName}`,
    `Goal: ${input.framing.goal}`,
    `Outcomes: ${(input.framing.outcomes || []).join(", ")}`,
    `Constraints: ${(input.framing.constraints || []).join(", ")}`,
    `Non-goals: ${(input.framing.nonGoals || []).join(", ")}`,
    `Rails: ${JSON.stringify(input.railsToggles)}`,
    `Include spikes: ${input.wantSpikes}`,
    "Return JSON with { items: SeedItem[], rationale: string, deps: [ [string,string] ] }.",
  ].join("\n");

  // Note: we don't ensure env here to keep this module self-contained.
  // The caller is responsible for validating env.
  const env = await import("../core/env.js");
  const resolvedEnv = env.ensureEnv();
  const model = await getModel(resolvedEnv);

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
  });

  // Basic fallback: in case parsing is not implemented yet.
  // This path intentionally throws to make non-dry-run usage explicit.
  throw new Error(
    "inferSeedPlan: model path not yet implemented. Enable AI_DRY_RUN or add JSON parsing."
  );
}

