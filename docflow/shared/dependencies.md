# Shared Dependencies

<!-- Will be populated as we build shared components -->

## Notes
- Add entries when creating shared code
- Update when modifying existing shared code
- Reference before creating new functionality
- Keep descriptions high-level (code has details)

## CLI Modules (added 2025-09-17)
- `src/index.ts`: CLI entrypoint using Commander; defaults to `new` command.
- `src/config/config.ts`: Loads env-based config and sensible defaults.
- `src/conversation/start-conversation.ts`: Placeholder starter for conversational flow.
- `src/types/conversation.ts`: Shared types for conversation and project context.
- `src/prompts/system-prompts.ts`: System and spec-generation prompts.
- `src/conversation/conversation-manager.ts`: Exploration/refinement flow and generation.
- `src/generator/project-generator.ts`: Template copy, tracking init, and robust file writers.
- `src/ui/splash.ts`, `src/ui/theme.ts`: CLI splash and gradient styling.
- `src/utils/errors.ts`, `src/utils/json.ts`: Error reporting and JSON normalization.

## AI Integration (updated 2025-09-19)
- `src/ai/client.ts`: Supports provider switching (OpenAI/Anthropic/Groq) and Vercel AI Gateway via `AI_BASE_URL`. Use namespaced models when routing through Gateway (e.g., `anthropic/claude-3-5-sonnet-20240620`).
- `src/config/config.ts`: New `baseURL` (from `AI_BASE_URL`) and `outputVerbosity` (from `AI_OUTPUT_VERBOSITY`: `concise|verbose`).
- `src/conversation/conversation-manager.ts`: Spec generation respects `outputVerbosity`; `verbose` mode produces more detailed files (standards/specs).