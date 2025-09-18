export const SYSTEM_PROMPT = `
You are an expert software architect guiding a rapid prototyping conversation (DocFlow methodology).

Hard constraints:
- Output one thing at a time. Keep responses short.
- Do NOT provide long outlines or opinions unless asked.
- Ask EXACTLY one concise question when eliciting info.
- Focus ONLY on: problem to solve, core features, tech stack, constraints. Avoid audience/budget/marketing.
- Be practical and terse; prefer simple options.

Current context:
{context}

Phase: {phase}
`;

export const SPEC_GENERATION_PROMPT = `
Based on our conversation, generate the following DocFlow data as JSON.

Files to produce:
1) overview.md — include: clear problem statement, core features, success criteria
2) stack.md — include arrays for: frontend, backend, database (optional), infrastructure (optional)
3) standards.md — a single Markdown string of setup/standards content
4) initial backlog specs — array of specs with fields: type ('feature'|'bug'|'idea'), name, description, acceptance (array), priority (number)

Output JSON with EXACT keys:
{
  "overview": { "name": string, "purpose": string, "features": string[], "users": string, "success": string },
  "stack": { "frontend": string[], "backend": string[], "database"?: string[], "infrastructure"?: string[] },
  "standards": string,
  "specs": [ { "type": "feature"|"bug"|"idea", "name": string, "description": string, "acceptance": string[], "priority": number } ]
}

Rules:
- Keep lists short and practical.
- Specs must have concrete acceptance items.
- Prefer simple default stacks. Avoid vendor-specific details unless already discussed.
`;

export const PHASE_PROMPTS = {
  exploration: `
    Focus ONLY on:
    - Problem to solve
    - Core features
    - Tech stack preferences/constraints
    Ask ONE short question at a time. No headings/lists.
  `,
  
  refinement: `
    Break it down into features and acceptance criteria.
    Identify MVP vs later. Keep it concise.
  `,
  
  confirmation: `
    Validate the plan briefly and ask to proceed.
  `,
  
  generation: `
    Produce final JSON per schema for file generation.
  `
};

export const VALIDATION_PROMPT = `
Before generating files, validate:
1. Do all features have clear, testable acceptance criteria?
2. Is the stack consistent with the discussion?
3. Is there a clear MVP path?
If any validation fails, ask one specific follow-up question instead of generating.
`;

export function buildSpecGenerationUserPrompt(contextJson: string): string {
  return [
    'Using the conversation so far, produce a JSON payload strictly matching the schema in the system prompt.',
    'Only output JSON. No preface, no backticks.',
    'Context:',
    contextJson,
  ].join('\n');
}

export const INTRO_SUMMARY_PROMPT = `
Summarize the user's idea in ONE short sentence (<= 25 words). No headings/bullets. Output the sentence only.
`;

export function buildAskOneQuestionPrompt(topic: string): string {
  return [
    `Ask ONE concise clarifying question about ${topic}.`,
    'No headings, no bullets, no lists, no multi-part prompts.',
    'Output the question only.',
  ].join('\n');
}
