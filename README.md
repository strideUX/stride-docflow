# DocFlow CLI

A conversational CLI that scaffolds a DocFlow project by talking through your idea, then generates the full `docflow/` structure with context and specs.

## Quick Start

1) Requirements
- Node.js 18+
- An AI API key (OpenAI/Anthropic/Groq)

Create a `.env` in this repo root:
```bash
# Required
AI_API_KEY=your-api-key

# Optional
AI_PROVIDER=openai         # openai | anthropic | groq (default: openai)
AI_MODEL=gpt-4o            # model id for provider
DOCFLOW_PROJECTS_DIR=~/Documents/Projects
DOCFLOW_TEMPLATE_DIR=./src/assets/template/docflow
# Verbosity (affects generated files detail level)
AI_OUTPUT_VERBOSITY=verbose   # concise | verbose (default: concise)
# If using Vercel AI Gateway as a central router, set a base URL and use namespaced models
# Examples: openai/gpt-4o, anthropic/claude-3-5-sonnet-20240620, groq/llama-3.1-70b-versatile
# When AI_BASE_URL is set, requests go through the Gateway via OpenAI-compatible transport.
# You can switch providers by only changing AI_MODEL.
AI_BASE_URL=https://api.ai-gateway.vercel.com/api/v1
AI_MODEL=anthropic/claude-3-5-sonnet-20240620
AI_API_KEY=vgw_xxx
```

2) Install locally and link a `docflow` command
```bash
npm install
npm run build
npm link
```

3) Run
```bash
docflow           # Opens a Clack menu (New, Help, Exit)
docflow new       # Starts the conversation directly
```

Tip: If you changed code and don’t see updates, run `npm run build` again (and `npm link` if needed).

## Generate a New Project

- Choose New (or run `docflow new`)
- You’ll see:
  - Short summary of your idea
  - Five clarifying questions (problem → features → tech stack)
  - Project name suggestion (you can override)
  - Summary + confirmation
- On confirm, the CLI creates the project in `DOCFLOW_PROJECTS_DIR` (default `~/Documents/Projects`).

Generated structure (at your chosen project path):
```
project/
  .cursor/
  docflow/
    ACTIVE.md
    INDEX.md
    context/
      overview.md
      stack.md
      standards.md
    specs/
      active/
        feature-project-setup.md
      backlog/
        ...other generated specs
      complete/
    shared/
      dependencies.md
```

## Open in Cursor

1) Open the project directory:
```bash
cd ~/Documents/Projects/<your-project>
```
2) Open in Cursor/VS Code and work from the `docflow/` folder:
- Start with `docflow/ACTIVE.md` and `docflow/INDEX.md`
- Review `docflow/context/` (overview, stack, standards)
- Plan/execute against items under `docflow/specs/`

## DocFlow Workflow (What each section means)

- `docflow/ACTIVE.md`
  - The current focus and status for the project (live, updated as you work)
- `docflow/INDEX.md`
  - Global index of Active, Backlog, and Completed items
- `docflow/context/`
  - `overview.md`: succinct problem/goal, scope, non‑goals, risks, success criteria
  - `stack.md`: frontend, backend, database, infrastructure, dev tools
  - `standards.md`: setup, conventions, testing, git/workflow
- `docflow/specs/`
  - `active/`: the spec(s) you’re executing right now
  - `backlog/`: upcoming features/ideas with acceptance criteria
  - `complete/`: finished specs, archived by quarter
- `docflow/shared/dependencies.md`
  - Track shared code and who uses it

## Slash Commands (in Cursor Chat)

- `/start-session`
  - Begin a work session, load ACTIVE and relevant context, set focus
- `/wrap-session`
  - Save progress, add a session checkpoint to the active spec, update ACTIVE/INDEX
- `/capture`
  - Quickly add a new idea/feature/bug to the backlog without context switching
- `/review`
  - Review/refine a spec (completeness, acceptance criteria, dependencies) and activate if ready

Recommended flow:
1) `/start-session` → confirm today’s focus in `ACTIVE.md`
2) Implement the active spec; keep acceptance criteria current
3) Use `/capture` for ideas/bugs without switching context
4) `/review` backlog items as needed to prep upcoming work
5) `/wrap-session` to checkpoint and update status before stopping

## Configuration & Customization

- Provider/model: set `AI_PROVIDER` and `AI_MODEL` in `.env`
- Template source: `DOCFLOW_TEMPLATE_DIR` (defaults to `./src/assets/template/docflow`)
- Prompts: edit `src/prompts/system-prompts.ts`
- Conversation behavior: see `src/conversation/conversation-manager.ts`

## Troubleshooting

- Missing API key
  - The CLI fails fast if `AI_API_KEY` is not set. Add it to `.env`.
- Global `docflow` not updating
  - `npm run build` then `npm link`. Make sure your npm global bin is on PATH (`which docflow`).
- Model/JSON errors
  - Run with `DEBUG=1 docflow` to see stack traces.
- Unlink an old global docflow
  - `npm uninstall -g <old-package>` and remove any stray symlinks, then `npm link` this repo.

---

Happy building with DocFlow! If you want the generator’s output to mirror your team’s style more closely, refine the prompts and writers and regenerate.
