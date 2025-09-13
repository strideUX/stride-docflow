import process from "node:process";
import pc from "picocolors";

function truthyEnv(name: string): boolean {
  const v = String(process.env[name] ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y";
}

export type Provider = "openai" | "anthropic";

export interface Env {
  DOCFLOW_ROOT: string;
  AI_PROVIDER: Provider; // normalized to lowercase when valid; empty string cast during load
  AI_MODEL: string;
  AI_TEMPERATURE?: number;
  DOCFLOW_OWNER?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

function trimOrEmpty(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

/**
 * Reads environment variables and returns a normalized Env object.
 * Strings are trimmed. Provider is lowercased if present.
 */
export function loadEnv(): Env {
  const rawProvider = trimOrEmpty(process.env.AI_PROVIDER).toLowerCase();
  const provider = (rawProvider === "openai" || rawProvider === "anthropic"
    ? (rawProvider as Provider)
    : ("" as unknown as Provider));

  const tempRaw = trimOrEmpty(process.env.AI_TEMPERATURE);
  const temp = tempRaw !== "" ? Number.parseFloat(tempRaw) : undefined;

  return {
    DOCFLOW_ROOT: trimOrEmpty(process.env.DOCFLOW_ROOT),
    AI_PROVIDER: provider,
    AI_MODEL: trimOrEmpty(process.env.AI_MODEL),
    AI_TEMPERATURE: Number.isFinite(temp as number) ? (temp as number) : undefined,
    DOCFLOW_OWNER: trimOrEmpty(process.env.DOCFLOW_OWNER) || undefined,
    OPENAI_API_KEY: trimOrEmpty(process.env.OPENAI_API_KEY) || undefined,
    ANTHROPIC_API_KEY: trimOrEmpty(process.env.ANTHROPIC_API_KEY) || undefined,
  };
}

export function validateEnv(env: Env):
  | { ok: true }
  | { ok: false; missing: string[]; message: string } {
  const missing: string[] = [];

  if (!env.DOCFLOW_ROOT) missing.push("DOCFLOW_ROOT");
  if (!env.AI_PROVIDER || (env.AI_PROVIDER !== "openai" && env.AI_PROVIDER !== "anthropic")) {
    missing.push("AI_PROVIDER");
  }
  if (!env.AI_MODEL) missing.push("AI_MODEL");

  // Conditional keys
  if (env.AI_PROVIDER === "openai") {
    if (!env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  } else if (env.AI_PROVIDER === "anthropic") {
    if (!env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  }

  if (missing.length === 0) return { ok: true };

  const header = pc.bold(pc.red("Environment incomplete: missing required variables"));
  const checklistLines: string[] = missing.map((m) => `  - ${m}`);

  const providerHint =
    "AI_PROVIDER must be one of: 'openai' or 'anthropic'.";

  const examples = [
    pc.bold("Examples (bash):"),
    "",
    pc.bold("# OpenAI"),
    "export DOCFLOW_ROOT=\"$PWD/docflow\"",
    "export AI_PROVIDER=\"openai\"",
    "export AI_MODEL=\"gpt-4o-mini\"",
    "export OPENAI_API_KEY=\"sk-...\"",
    "# optional",
    "export AI_TEMPERATURE=0.2",
    "",
    pc.bold("# Anthropic"),
    "export DOCFLOW_ROOT=\"$PWD/docflow\"",
    "export AI_PROVIDER=\"anthropic\"",
    "export AI_MODEL=\"claude-3-5-sonnet-latest\"",
    "export ANTHROPIC_API_KEY=\"sk-ant-...\"",
  ].join("\n");

  const message = [
    header,
    "",
    pc.bold("Missing:"),
    ...checklistLines,
    "",
    providerHint,
    "",
    examples,
  ].join("\n");

  return { ok: false, missing, message };
}

/**
 * Ensures required env vars are present; throws with a clear message otherwise.
 */
export function ensureEnv(): Env {
  const env = loadEnv();
  // In smoke/dry-run mode, allow minimal env and provide sensible defaults.
  if (truthyEnv("AI_DRY_RUN")) {
    return {
      DOCFLOW_ROOT: env.DOCFLOW_ROOT || `${process.cwd()}/docflow`,
      AI_PROVIDER: (env.AI_PROVIDER || ("openai" as Provider)) as Provider,
      AI_MODEL: env.AI_MODEL || "gpt-4o-mini",
      AI_TEMPERATURE: env.AI_TEMPERATURE,
      DOCFLOW_OWNER: env.DOCFLOW_OWNER,
      OPENAI_API_KEY: env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
    };
  }

  const res = validateEnv(env);
  if (res.ok) return env;
  throw new Error(res.message);
}
