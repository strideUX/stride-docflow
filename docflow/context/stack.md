# Technical Stack

## Core Technologies
- **Language**: TypeScript
- **Runtime**: Node.js
- **Package Manager**: npm
- **Build Tool**: tsup

## CLI Framework
- **Commander**: Command-line interface
- **Clack**: Terminal UI components (spinners, prompts)
- **Picocolors**: Terminal colors

## AI Integration
- **Vercel AI SDK**: Multi-provider AI integration
- **Providers Supported**:
  - OpenAI (GPT-4, GPT-4o)
  - Anthropic (Claude 3)
  - Groq (Llama, Mixtral)
- **Streaming**: Real-time response streaming

## File System
- **fs-extra**: Enhanced file operations
- **path**: Path manipulation
- **os**: System information

## Development
- **TypeScript**: Strict mode for type safety
- **tsx**: Development execution
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Testing
- **Vitest**: Unit testing (future)
- **Mock AI**: Test conversation flows (future)

## Distribution
- **npm**: Package distribution
- **npx**: Zero-install execution

## Key Patterns
- Streaming AI responses for natural conversation
- Progressive context building during dialogue
- Template-based file generation
- Configuration via environment variables
- Pure ESM modules