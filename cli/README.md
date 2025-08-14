# Docflow CLI

AI-powered project bootstrapping tool with intelligent documentation generation, image paste support, and complete project scaffolding.

## 🎯 Quick Start

```bash
# Install and link globally
npm install && npm run build && npm link

# Create a complete React Native + Convex project
docflow create --stack react-native-convex --idea "social fitness app"

# When prompted for wireframes:
# 1. Copy a screenshot to clipboard (Cmd+Shift+4 on Mac)
# 2. Press Ctrl+V to paste during the prompt
# 3. See: [Image 1] - screenshot-12345.png
# 4. Continue with other design inputs
# 5. Get complete scaffolded project with AI-generated docs!
```

**Result**: Complete project with Expo setup, Convex integration, comprehensive documentation, and ready-to-use development environment.

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

## 🚀 Key Features

### 📱 Complete Project Scaffolding
- **React Native/Expo + Convex** integration
- Automated project setup with dependencies
- Smart directory structure creation
- Development environment configuration

### 🎨 Design Input & Image Paste
- **Copy & paste screenshots** directly into prompts with `Ctrl+V`
- Automatic image detection and temp file management
- Design vibe, wireframe, and mockup support
- Visual design context for AI generation

### 🤖 MCP Integration
- **Model Context Protocol** support for enhanced research
- Real-time documentation and code pattern analysis
- Web search integration for current best practices
- Graceful fallbacks when MCP tools unavailable

### 🎯 Intelligent Documentation
- AI-powered content generation with context awareness
- Template-based documentation with dynamic sections
- Stack-specific architecture and setup guides

## Commands

### Create (New!)
Create complete projects with scaffolding and documentation:

```bash
docflow create --stack react-native-convex --idea "fitness tracking app"
```

**Interactive Flow:**
1. **Describe your app idea**: "A fitness tracking app that helps users..."
2. **App name**: "Fitness Tracker Pro" → auto-formats to `fitness-tracker-pro`
3. **Design inputs**: Paste screenshots with `Ctrl+V`, describe vibe & UI
4. **Complete setup**: Expo scaffold → Convex integration → AI docs → Ready to code

### Generate (Enhanced)
Generate documentation for existing projects:

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

### Config
Manage Docflow settings and preferences:

```bash
docflow config
```

**Interactive menu options**:
- View current configuration
- Change default project directory
- Reset to defaults

## 🖼️ Image Paste Feature

### How to Use Screenshots & Wireframes

1. **Take a screenshot** (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)
2. **During wireframes prompt**, press `Ctrl+V` to paste
3. **See confirmation**: `[Image 1] - screenshot-12345.png`
4. **AI analyzes images** automatically during documentation generation

### Supported Image Types
- Screenshots (.png, .jpg, .jpeg)
- Design files copied to clipboard
- File paths to existing images
- Base64 encoded images

### Technical Details
```typescript
// Images are temporarily stored and passed to AI
const pastedImages = clipboardImageManager.getImages();
// AI receives: { images: [{ path: "/tmp/docflow-images/wireframe.png", ... }] }
```

### Troubleshooting Image Paste

**Image not detected?**
- Ensure you copied image to clipboard (not just text/path)
- Use `Ctrl+V` specifically (not `Cmd+V` on Mac)
- Try copying from different sources (screenshot vs file)

**Different terminals:**
- **macOS Terminal**: Use `Ctrl+V` for images
- **iTerm2**: Full support for image paste
- **Linux**: Depends on terminal - try Kitty or Gnome Terminal

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

## 📁 Project Directory Configuration

### Default Project Directory
By default, new projects are created in `~/Documents/Work/Clients/DocFlow`. You can change this:

```bash
# Change via interactive config
docflow config

# Or edit config file directly
~/.docflow/config.json
```

### Config File Structure
```json
{
  "defaultProjectDirectory": "~/Documents/Work/Clients/DocFlow",
  "mcpServers": [
    {
      "name": "context7",
      "command": "context7-mcp-server",
      "args": ["--port", "3001"]
    }
  ]
}
```

### Override Per Command
You can still override the default directory for individual commands:
```bash
docflow create --stack react-native-convex --idea "my app" --output /path/to/custom/location
```

## Environment Variables

```bash
# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# MCP (Model Context Protocol) Servers - Optional but recommended
DOCFLOW_MCP_SERVERS='[{"name":"context7","command":"context7-mcp","args":["--port","3001"]},{"name":"grep","command":"mcp-grep"}]'
```

## 🔧 MCP Configuration

### Setting up MCP Tools (Optional)

MCP integration enhances documentation with real-time research. Works with graceful fallbacks if not configured.

#### 1. Install MCP Servers
```bash
# Example MCP tools (install based on your needs)
npm install -g @context7/mcp-server
npm install -g mcp-grep-server
npm install -g mcp-web-search
```

#### 2. Configure MCP Servers
Create `~/.docflow/config.json`:
```json
{
  "mcpServers": [
    {
      "name": "context7",
      "command": "context7-mcp-server",
      "args": ["--port", "3001"],
      "env": {
        "CONTEXT7_API_KEY": "your-key"
      }
    },
    {
      "name": "grep",
      "command": "mcp-grep-server"
    }
  ]
}
```

#### 3. Alternative: Environment Variable
```bash
export DOCFLOW_MCP_SERVERS='[{"name":"context7","command":"context7-mcp"}]'
```

### How MCP Enhances Documentation
- **Real-time research** for current best practices
- **Code pattern search** across existing codebases  
- **Documentation lookup** from current project context
- **Web search** for latest framework updates

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