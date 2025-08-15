# 🚀 Docflow

> AI-powered project documentation generator with beautiful CLI experience

Docflow transforms project ideas into comprehensive, structured documentation that works seamlessly with AI development tools like Cursor and Claude Code. From concept to code-ready documentation in minutes.

## ✨ Features

- **🤖 AI-Powered Generation**: Uses OpenAI, Anthropic, or local models to generate detailed, current documentation
- **🎨 Beautiful CLI**: Built with Clack for an exceptional terminal experience
- **📱 Technology-Specific Templates**: Pre-built templates for popular stacks (Next.js, React Native, Convex, Supabase)
- **🔍 Smart Research**: Integrates with MCP and web search to include latest best practices
- **📋 Release Management**: Built-in task tracking and project management workflows
- **🔗 AI Tool Integration**: Optimized for Cursor AI and Claude Code consumption
- **📊 Progress Tracking**: Real-time progress indicators and beautiful output

## 🏗️ Architecture

```
docflow/
├── cli/                    # Beautiful TypeScript CLI
├── templates/              # Template system
│   ├── base/              # Core templates
│   └── stacks/            # Technology-specific
└── docs/                  # Generated project docs
```

## 🚀 Quick Start

### Installation

```bash
cd cli
npm install
npm run build
npm link
```

### Generate Your First Project

```bash
# Interactive mode with beautiful prompts
docflow generate

# Quick generation from an idea
docflow generate --idea "A task management app for remote teams with real-time collaboration"

# Specify technology stack
docflow generate --stack nextjs-convex --output my-project

# Dry run to see what would be generated
docflow generate --dry-run
```

### Available Commands

```bash
# Generate project documentation
docflow generate [options]

# Use GPT-5 with optimized settings
docflow generate --model gpt-5-mini --reasoning-effort minimal --verbosity medium

# List available technology stacks
docflow list

# Validate existing documentation
docflow validate --path ./docs

# Get help
docflow --help
```

## 📚 Technology Stacks

### Next.js + Convex
- **Perfect for**: Real-time web applications, SaaS products
- **Technologies**: Next.js 15+, Convex, TypeScript, Tailwind CSS, shadcn/ui
- **Features**: Real-time database, authentication, deployment guides

### Next.js + Supabase  
- **Perfect for**: Traditional web apps, content management, e-commerce
- **Technologies**: Next.js 15+, Supabase, PostgreSQL, TypeScript, Tailwind CSS
- **Features**: Database design, Row Level Security, Edge Functions

### React Native + Convex
- **Perfect for**: Cross-platform mobile apps with real-time features
- **Technologies**: React Native, Expo SDK 51+, Convex, TypeScript, NativeWind
- **Features**: Mobile optimizations, app store deployment, offline support

## 🎯 Documentation Philosophy & Structure

Docflow follows a **layered information architecture** designed to eliminate duplication and provide clear purpose for each document:

### Information Hierarchy

```
User Story (specs) → Feature (releases/current) → Implementation → Core Docs Updated
```

**Core Principle**: Each document serves a specific purpose, and information flows naturally without duplication.

### Document Purpose Framework

#### **Core Project Docs** (What the system IS - updated after releases)
- **specs.md**: High-level vision, user stories, core capabilities
- **architecture.md**: How the system works technically  
- **design.md**: UX patterns, conversation flows, user experience
- **stack.md**: Technology decisions and implementation approach

#### **Release Management** (What we're building NOW)
- **releases/current/**: Active development tracking
  - **features.md**: Specific features being built this release
  - **bugs.md**: Issues being resolved
  - **enhancements.md**: Improvements to existing functionality
  - **index.md**: Release overview, timeline, success criteria

#### **Backlog** (What we're building NEXT)
- **features.md**: Future feature pipeline
- **enhancements.md**: Planned improvements
- **bugs.md**: Known issues to address

#### **Active Session Management** (What's happening RIGHT NOW)
- **active/focus.md**: Current work and immediate priorities
- **active/session.md**: Handoff notes and context for AI tools

### Generated Documentation Structure

Each project gets a complete documentation suite following this philosophy:

```
your-project/
├── docs/
│   ├── project/               # What the system IS
│   │   ├── specs.md          # High-level vision & user stories
│   │   ├── architecture.md   # Technical system design
│   │   ├── design.md         # UX patterns & guidelines
│   │   └── stack.md          # Technology choices & rationale
│   ├── releases/current/      # What we're building NOW
│   │   ├── index.md          # 🎯 PRIMARY REFERENCE
│   │   ├── features.md       # Active feature development
│   │   ├── enhancements.md   # Current improvements
│   │   └── bugs.md           # Issues being resolved
│   ├── active/               # What's happening RIGHT NOW
│   │   ├── focus.md          # Current work session
│   │   └── session.md        # AI handoff context
│   ├── backlog/              # What we're building NEXT
│   │   ├── features.md       # Future feature pipeline
│   │   ├── enhancements.md   # Planned improvements
│   │   └── bugs.md           # Known issues to address
│   └── notes/                # Session notes & decision records
│       └── YYYY-MM-DD.md     # Daily decision tracking
└── .cursor/rules/            # AI tool configuration
```

### Session Notes & Decision Records

**Purpose**: Capture project evolution and decision-making process
- **`/docs/notes/`**: Daily files tracking decisions, scope changes, and insights
- **Format**: Timestamped entries with type classification (DECISION RECORD, SCOPE CHANGE, INSIGHT, etc.)
- **Integration**: Cross-referenced with active focus and session handoff documents
- **Protocol**: Systematic WrapSession process documented in `/docs/project/workflows.md`

### Key Benefits

- **No Duplication**: Each piece of information lives in exactly one place
- **Clear Purpose**: Every document serves specific stakeholders and use cases
- **Natural Flow**: Information progresses logically from vision to implementation
- **AI-Optimized**: Structure supports AI tools in understanding project context and current state
- **Decision Tracking**: Complete audit trail of why decisions were made and what they impact

## 🔧 Configuration

### Environment Variables

```bash
# AI Providers
OPENAI_API_KEY=sk-proj-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional: Default model preferences
DOCFLOW_DEFAULT_PROVIDER=openai
DOCFLOW_DEFAULT_MODEL=gpt-5-mini

# Optional: GPT-5 optimization settings
DOCFLOW_REASONING_EFFORT=minimal   # minimal, low, medium, high
DOCFLOW_VERBOSITY=medium          # low, medium, high

# Optional: Research capabilities
CONTEXT7_API_KEY=your-context7-key
```

### GPT-5 Optimizations

Docflow leverages GPT-5's latest features for optimal documentation generation:

- **🧠 Reasoning Effort**: Controls AI processing depth
  - `minimal` - Fast, cost-effective (default for docs)
  - `low` - Balanced reasoning
  - `medium` - Thorough analysis  
  - `high` - Deep reasoning for complex projects

- **📝 Verbosity Control**: Manages output length
  - `low` - Concise, bullet-point style
  - `medium` - Balanced detail (default)
  - `high` - Comprehensive explanations

- **⚡ Responses API**: Automatic use of GPT-5's optimized API for better performance

```bash
# Fine-tune GPT-5 for your needs
docflow generate --reasoning-effort low --verbosity high   # Detailed explanations
docflow generate --reasoning-effort minimal --verbosity low # Fast, concise output
```

### Custom Templates

Create your own stack templates in `templates/stacks/`:

```
templates/stacks/your-stack/
├── stack.md.template
├── architecture.md.template
└── custom-guide.md.template
```

## 🤖 AI Integration

### MCP Integration
Docflow is designed to work with Model Context Protocol (MCP) tools:
- **context7**: For accessing current documentation
- **grep**: For finding code patterns and examples
- **Web search**: For latest best practices

### Research Mode
```bash
# Enable research with current best practices
docflow generate --research

# The tool will:
# 1. Search for latest patterns and examples
# 2. Include current version information
# 3. Add relevant community resources
# 4. Update templates with fresh content
```

## 🎨 CLI Experience

Built with [Clack](https://github.com/natemoo-re/clack) for beautiful terminal interactions:

- **Interactive prompts** with validation and hints
- **Progress indicators** for generation steps  
- **Colorful output** with clear information hierarchy
- **Graceful error handling** with helpful suggestions
- **Dry run mode** to preview before generation

## 📝 Usage Patterns

### From Idea to Documentation
```bash
# Start with a rough idea
docflow generate --idea "
  A project management tool for design teams.
  
  Features:
  - Real-time collaboration
  - File sharing and comments
  - Timeline tracking
  - Client feedback integration
"
```

### Technology-First Approach
```bash
# Choose your stack first
docflow list
docflow generate --stack nextjs-convex
```

### Iterative Development
```bash
# Generate initial docs
docflow generate --output my-project

# Validate as you develop
docflow validate --path my-project/docs

# The generated docs evolve with your project
```

## 🔄 Workflow Integration

### With Cursor AI
1. Generate documentation with Docflow
2. Open project in Cursor
3. Cursor automatically uses `.cursor/rules` for context
4. Start developing with full project context

### With Claude Code
1. Generate comprehensive specs and architecture
2. Use structured task management in `releases/current/`
3. Maintain session handoffs in `active/session.md`
4. Track progress in real-time

## 🧪 Testing & Development

```bash
cd cli

# Development
npm run dev src/index.ts generate --dry-run

# Build
npm run build

# Test
npm test

# Link for global usage
npm link
```

## 🤝 Contributing

This is an internal tool, but the patterns and templates can be extended:

1. **Add new technology stacks** in `templates/stacks/`
2. **Enhance AI prompts** in `cli/src/generators/`
3. **Improve templates** with better structure and content
4. **Add research integrations** for your preferred tools

## 📊 What Makes This Different

- **Research-Driven**: Incorporates latest best practices automatically
- **AI-Tool Optimized**: Designed specifically for AI-assisted development
- **Beautiful UX**: Professional CLI experience with great feedback
- **Technology-Specific**: Deep, current knowledge for each supported stack
- **Complete Workflow**: From idea to code-ready documentation
- **Continuously Updated**: Templates evolve with technology changes

## 🎯 Perfect For

- **Solo developers** starting new projects
- **Development teams** establishing standards
- **Agencies** creating consistent client deliverables  
- **Product managers** documenting requirements
- **Anyone** who wants AI tools to understand their project deeply

---

*Built with ❤️ for the AI-assisted development workflow*