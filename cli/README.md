# Docflow CLI

Beautiful TypeScript CLI for generating AI-powered project documentation.

## Development

### Setup
```bash
npm install
npm run build
```

### Development Mode
```bash
# Run with tsx for development
npm run dev src/index.ts generate --help

# Test generation
npm run dev src/index.ts generate --dry-run --stack nextjs-convex
```

### Building and Linking
```bash
# Build TypeScript
npm run build

# Link for global usage
npm link

# Now you can use globally
docflow generate
```

### Testing
```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Architecture

### Core Components

- **`src/index.ts`**: Main CLI entry point with Clack intro
- **`src/commands/`**: Command handlers (generate, validate, list)
- **`src/prompts/`**: Interactive prompts with Clack
- **`src/generators/`**: Documentation generation logic
- **`src/templates/`**: Template processing and stack registry
- **`src/ui/`**: Terminal UI components

### Key Dependencies

- **@clack/prompts**: Beautiful CLI prompts and UI
- **commander**: Command-line interface framework
- **handlebars**: Template processing
- **chalk**: Terminal colors
- **zod**: Input validation
- **openai/anthropic**: AI content generation

### Template Processing

1. **Template Discovery**: Find base + stack-specific templates
2. **Context Preparation**: Gather project data and research
3. **Handlebars Processing**: Basic variable substitution
4. **AI Enhancement**: Generate DYNAMIC sections with AI
5. **File Generation**: Write processed files to output directory

### AI Integration

```typescript
// DYNAMIC sections in templates are processed by AI
<!-- DYNAMIC: [Instruction for AI to generate specific content] -->

// Example:
<!-- DYNAMIC: [Current Next.js 15 setup patterns with TypeScript] -->
```

## Commands

### Generate
```bash
docflow generate [options]

Options:
  -i, --idea <text>           Project idea to expand
  -s, --stack <name>          Technology stack
  -o, --output <path>         Output directory
  --ai-provider <provider>    AI provider (openai, anthropic, local)
  --model <model>             AI model to use
  --research                  Enable research mode
  --dry-run                   Preview without generating
```

### List Templates
```bash
docflow list
```

### Validate
```bash
docflow validate [options]

Options:
  -p, --path <path>          Path to documentation
```

## Adding New Stacks

1. **Create template directory**:
   ```
   ../templates/stacks/your-stack/
   ├── stack.md.template
   ├── architecture.md.template
   └── custom-file.md.template
   ```

2. **Add to stack registry**:
   ```typescript
   // src/templates/stack-registry.ts
   {
     name: 'your-stack',
     description: 'Your stack description',
     technologies: ['Tech1', 'Tech2'],
     templatePath: 'stacks/your-stack',
     researchQueries: ['search terms for research'],
     features: { /* stack capabilities */ }
   }
   ```

3. **Test the new stack**:
   ```bash
   npm run dev src/index.ts list
   npm run dev src/index.ts generate --stack your-stack --dry-run
   ```

## Error Handling

The CLI uses graceful error handling with Clack:

```typescript
try {
  // Operation
} catch (error) {
  p.log.error(chalk.red('Operation failed: ' + error.message));
  p.cancel('Process terminated');
  process.exit(1);
}
```

## Environment Variables

```bash
# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Optional: Research capabilities  
CONTEXT7_API_KEY=your-context7-key
```

## Publishing

```bash
# Update version
npm version patch|minor|major

# Build
npm run build

# Publish (if making it public)
npm publish
```

## Debugging

```bash
# Debug with Node.js inspector
node --inspect-brk dist/index.js generate --dry-run

# Verbose logging
DEBUG=docflow* npm run dev src/index.ts generate
```

## Known Issues

- **Template path resolution**: Ensure templates are copied correctly in build
- **AI rate limits**: Implement retry logic for API failures
- **Large projects**: Progress tracking for files with many DYNAMIC sections
- **Offline mode**: Graceful degradation when AI APIs are unavailable

## Future Enhancements

- [ ] Plugin system for custom generators
- [ ] Template marketplace/sharing
- [ ] Integration with more MCP tools
- [ ] Custom AI model support
- [ ] Batch processing for multiple projects
- [ ] Configuration file support (.docflowrc)
- [ ] Template validation and linting
- [ ] Performance optimizations for large templates