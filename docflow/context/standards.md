# Coding Standards

## General Principles
- **Type Safety**: Full TypeScript with strict mode
- **Pure Functions**: Prefer functional programming patterns
- **Error Handling**: Graceful failures with helpful messages
- **User Experience**: Conversational and helpful, never robotic
- **Modularity**: Small, focused modules with single responsibilities

## Code Organization
```
/src
├── /commands           # CLI command handlers
├── /conversation       # AI conversation management
├── /generator         # File and project generation
├── /prompts          # AI system prompts
├── /templates        # File templates
├── /types            # TypeScript type definitions
├── /utils            # Shared utilities
└── index.ts          # Entry point
```

## TypeScript Standards
- Strict mode enabled
- No `any` types without justification
- Explicit return types for public functions
- Interfaces over types for objects
- Enums for finite state sets

## Naming Conventions
- **Files**: kebab-case (e.g., `conversation-manager.ts`)
- **Classes**: PascalCase (e.g., `ConversationManager`)
- **Functions**: camelCase (e.g., `startConversation`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_MODEL`)
- **Interfaces**: PascalCase with 'I' prefix optional

## AI Conversation Standards
- System prompts in separate files
- Structured output using JSON when possible
- Temperature settings appropriate to task
- Streaming for all user-facing responses
- Context window management

## File Generation Standards
- Use templates for consistency
- Preserve file permissions
- Atomic operations (all or nothing)
- Progress feedback during generation
- Rollback on failure

## Error Handling
- User-friendly error messages
- Actionable error suggestions
- Debug mode for verbose output
- Graceful degradation
- Never expose API keys or sensitive data

## CLI Standards
- Follow Unix philosophy (do one thing well)
- Support both interactive and scriptable modes
- Respect user's terminal (colors, width)
- Clear help documentation
- Version management

## Testing Standards
- Unit tests for pure functions
- Mock AI responses for testing
- Integration tests for file generation
- Snapshot tests for templates
- E2E tests for full flow

## Git Conventions
- Conventional commits (feat, fix, docs, etc.)
- Semantic versioning
- Changelog maintenance
- Pre-commit hooks for linting

## Documentation Requirements
- JSDoc for public APIs
- README with clear examples
- Inline comments for complex logic
- Architecture decision records

## Performance Standards
- Lazy load dependencies
- Stream large responses
- Efficient file operations
- Minimal startup time
- Progress indicators for long operations

## Security Standards
- API keys via environment variables only
- No credentials in code or logs
- Sanitize user inputs
- Secure file operations
- Rate limiting awareness