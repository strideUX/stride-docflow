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