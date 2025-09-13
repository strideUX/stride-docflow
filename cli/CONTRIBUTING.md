# Contributing to Docflow CLI

This guide helps you get the CLI running locally for development, including environment setup, dev/build commands, dry-run simulation, and testing the Status command on a generated sample project.

## Prerequisites
- Node.js 18+ (recommended 18.17+)
- npm 9+ (bundled with recent Node versions)
- macOS/Linux or Windows (WSL recommended)

## Install
- Change into the CLI package and install dependencies:
  - `cd cli`
  - `npm install`

## Environment
The CLI reads environment variables (no implicit dotenv). You can either export them in your shell, prefix them per command, or load from a local `.env` via `set -a`.

Required variables (normal mode):
- `DOCFLOW_ROOT`: Absolute path where generated projects are written.
- `AI_PROVIDER`: `openai` or `anthropic`.
- `AI_MODEL`: Model id (e.g., `gpt-4o-mini`, `claude-3-5-sonnet-latest`).
- `OPENAI_API_KEY`: Required when `AI_PROVIDER=openai`.
- `ANTHROPIC_API_KEY`: Required when `AI_PROVIDER=anthropic`.
- Optional: `AI_TEMPERATURE` (float, e.g., `0.2`).

Dry-run mode (recommended for development) relaxes requirements and does not invoke an LLM:
- `AI_DRY_RUN=true` (enables mock plan generation and minimal env checks)

Examples (bash):
- OpenAI
  - `export DOCFLOW_ROOT="$PWD/.docflow-sandbox"`
  - `export AI_PROVIDER=openai`
  - `export AI_MODEL=gpt-4o-mini`
  - `export OPENAI_API_KEY=sk-...` (only needed if not using dry-run)
  - `export AI_TEMPERATURE=0.2` (optional)
- Anthropic
  - `export DOCFLOW_ROOT="$PWD/.docflow-sandbox"`
  - `export AI_PROVIDER=anthropic`
  - `export AI_MODEL=claude-3-5-sonnet-latest`
  - `export ANTHROPIC_API_KEY=sk-ant-...`

Using a local `.env` file:
- `cp cli/.env.example cli/.env`
- Edit values, then load in your shell (bash/zsh):
  - `set -a; source cli/.env; set +a`

## Run (development)
- Start the CLI in watch mode:
  - `npm run dev`
- This runs `tsx src/bin/docflow.ts` and opens an interactive menu.

Tip: For development, set `AI_DRY_RUN=true` to avoid external model calls and reduce required env setup.

## Build
- Produce a distributable build:
  - `npm run build`
- Run the built binary:
  - `node dist/bin/docflow.mjs`

## Simulate AI_DRY_RUN
Dry-run mode uses a mocked plan and relaxes env validation. Useful for offline/local development.
- Example:
  - `export AI_DRY_RUN=true`
  - `export DOCFLOW_ROOT="$PWD/.docflow-sandbox"`
  - `export AI_PROVIDER=openai`
  - `export AI_MODEL=gpt-4o-mini`
  - `npm run dev`

You can also prefix a one-off run:
- `AI_DRY_RUN=true DOCFLOW_ROOT="$PWD/.docflow-sandbox" AI_PROVIDER=openai AI_MODEL=gpt-4o-mini npm run dev`

## Test the Status Command
Below is a minimal end-to-end flow to generate a sample project and run Status against it.

1) Prepare environment (dry-run recommended):
- `export AI_DRY_RUN=true`
- `export DOCFLOW_ROOT="$PWD/.docflow-sandbox"`
- `export AI_PROVIDER=openai`
- `export AI_MODEL=gpt-4o-mini`

2) Generate a sample project via New:
- `npm run dev`
- Choose: `New`
- Follow prompts (defaults are fine); when asked to generate, confirm.
- Output includes: `Wrote <N> files under <DOCFLOW_ROOT>/demo`

3) Run Status in the generated project:
- `cd "$DOCFLOW_ROOT/demo"`
- From either location:
  - Run dev binary: `cd ../.. && npm run dev` and choose `Status` (if running from repo root, the CLI will prompt for project root; paste the absolute path to `"$DOCFLOW_ROOT/demo"`).
  - Or run built binary: `node /path/to/repo/cli/dist/bin/docflow.mjs` and choose `Status`.
- Expected: A summary like “Docflow Status (Deep)” with counts, unresolved deps, spikes in progress, active focus, and next best action.

If you see “No current iteration found”, ensure you ran New to bootstrap `docflow/iterations/current/` in the sample project.

## Troubleshooting
- Env errors at startup:
  - Use `AI_DRY_RUN=true` in development, or set all required variables for your provider.
- Model calls not implemented:
  - The non-dry-run `New` path will error until JSON parsing is added. Use `AI_DRY_RUN=true` locally.
- Status cannot find project root:
  - Run the CLI from inside the generated project, or provide the path when prompted. A valid project contains `.cursor/rules/docflow.mdc` and a `docflow/` folder.

## Useful scripts
- `npm run dev` — run CLI in dev mode
- `npm run build` — build to `dist/`
- `npm run smoke` — build and run a quick non-interactive smoke (exits quickly; used for CI checks)

