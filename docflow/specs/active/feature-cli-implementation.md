# Feature: CLI Implementation Details

## Context
Technical implementation details for the DocFlow CLI conversational interface.

## Acceptance Criteria
- [x] Default run shows Clack menu: New, Help, Exit
- [x] `docflow new` initializes AI intro with streaming
- [x] Fail-fast if `AI_API_KEY` is missing (no fallback)
- [x] Model suggests kebab-case project name; user can override
- [x] Project generation copies template and initializes tracking files
- [ ] Exploration/refinement phases collect context and specs
- [ ] Pre-generation summary with confirm/edit
- [ ] Generate `docflow/context/*` and initial specs from conversation
- [x] Help screen shows usage and environment variables

## Core Modules

### 1. Main Entry Point (`index.ts`)
```typescript
#!/usr/bin/env node
import { program } from 'commander';
import { startConversation } from './conversation';
import { loadConfig } from './config';

program
  .name('docflow')
  .description('AI-powered project scaffolding with DocFlow')
  .version('1.0.0');

program
  .command('new')
  .alias('') // Default command
  .description('Start a new project conversation')
  .action(async () => {
    const config = await loadConfig();
    await startConversation(config);
  });
```

### 2. Conversation Manager (`conversation-manager.ts`)
```typescript
import { streamText } from 'ai';
import * as clack from '@clack/prompts';
import { getModel } from '../ai/client';

class ConversationManager {
  private context: ProjectContext;
  private phase: ConversationPhase;
  
  async start() {
    // Welcome message
    console.log(clack.intro('🚀 DocFlow Project Creator'));
    
    // Start streaming conversation
    await this.conductInterview();
    await this.refineSpecs();
    await this.confirmProject();
    await this.generateProject();
  }
  
  private async conductInterview() {
    const stream = await streamText({
      model: this.model,
      system: SYSTEM_PROMPT,
      messages: this.messages,
      onFinish: (result) => this.updateContext(result)
    });
    
    // Handle streaming responses
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
  }
}
```

### 3. System Prompts (`prompts.ts`)
```typescript
export const SYSTEM_PROMPT = `
You are an expert software architect helping users plan their projects.
Your goal is to understand their idea and help shape it into a well-structured DocFlow project.

Guidelines:
1. Ask clarifying questions to understand the project scope
2. Suggest appropriate technology choices based on requirements
3. Break down the project into concrete features and specs
4. Identify MVP vs future features
5. Keep conversations natural and helpful

Current context:
{context}

Phase: {phase}
`;

export const SPEC_GENERATION_PROMPT = `
Based on our conversation, generate the following DocFlow files:
1. overview.md - Project overview
2. stack.md - Technology choices
3. standards.md - Coding standards
4. Initial feature specs for the backlog

Format as JSON with the structure:
{
  overview: { ... },
  stack: { ... },
  standards: { ... },
  specs: [ ... ]
}
`;
```

### 4. Project Generator (`generator.ts`)
```typescript
class ProjectGenerator {
  async generate(context: ProjectContext, projectPath: string) {
    // Create directory structure
    await this.createDirectories(projectPath);
    
    // Copy templates
    await this.copyTemplates(projectPath);
    
    // Generate context files
    await this.generateContextFiles(context, projectPath);
    
    // Generate spec files
    await this.generateSpecs(context.specs, projectPath);
    
    // Initialize tracking files
    await this.initializeTracking(context, projectPath);
  }
  
  private async generateContextFiles(context: ProjectContext, path: string) {
    // Generate overview.md
    const overview = this.formatOverview(context.overview);
    await fs.writeFile(`${path}/docflow/context/overview.md`, overview);
    
    // Generate stack.md
    const stack = this.formatStack(context.stack);
    await fs.writeFile(`${path}/docflow/context/stack.md`, stack);
    
    // Generate standards.md (use template with project-specific additions)
    const standards = this.formatStandards(context);
    await fs.writeFile(`${path}/docflow/context/standards.md`, standards);
  }
}
```

### 5. Configuration (`config.ts`)
```typescript
interface Config {
  aiProvider: 'openai' | 'anthropic' | 'groq';
  apiKey: string;
  model: string;
  projectsDir: string;
  templateDir: string;
}

export async function loadConfig(): Promise<Config> {
  return {
    aiProvider: process.env.AI_PROVIDER as any || 'openai',
    apiKey: process.env.AI_API_KEY!,
    model: process.env.AI_MODEL || 'gpt-4o',
    projectsDir: process.env.DOCFLOW_PROJECTS_DIR || '~/Documents/Projects',
    templateDir: process.env.DOCFLOW_TEMPLATE_DIR || 'src/assets/template/docflow'
  };
}
```

## Package.json
```json
{
  "name": "docflow-cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "docflow": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsx src/index.ts",
    "release": "npm run build && npm publish"
  },
  "dependencies": {
    "@ai-sdk/anthropic": "latest",
    "@ai-sdk/openai": "latest", 
    "@clack/prompts": "^0.7.0",
    "ai": "latest",
    "commander": "^12.1.0",
    "dotenv": "^16.0.0",
    "fs-extra": "^11.0.0",
    "picocolors": "^1.0.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.0",
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Dependencies
- Runtime: Node.js (ESM), TypeScript (strict)
- Libraries: `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@clack/prompts`, `commander`, `fs-extra`, `picocolors`, `dotenv`
- Env: `AI_PROVIDER`, `AI_API_KEY` (required), `AI_MODEL`, `DOCFLOW_PROJECTS_DIR`, `DOCFLOW_TEMPLATE_DIR`

## Progress
- Implemented: menu, fail-fast, intro streaming, name suggestion, template copy, tracking file init, Help
- Pending: exploration/refinement, spec/context file generation, summary confirm/edit

## Conversation Flow States

```typescript
type ConversationPhase = 
  | 'introduction'     // Initial project idea gathering
  | 'exploration'      // Asking clarifying questions
  | 'refinement'       // Refining features and specs
  | 'confirmation'     // Confirming project details
  | 'generation';      // Creating files

// Transitions based on AI understanding
introduction → exploration (when basic idea understood)
exploration → refinement (when enough context gathered)
refinement → confirmation (when specs are ready)
confirmation → generation (when user approves)
```

## Example AI Context Building

```typescript
// As conversation progresses, build context:
{
  overview: {
    name: "Habit Tracker",
    purpose: "Help users build and maintain positive habits",
    features: ["habit creation", "daily tracking", "streaks"],
    users: "Individuals wanting to build better habits",
    success: "Users maintain habits for 30+ days"
  },
  
  stack: {
    frontend: ["Next.js", "TypeScript", "Tailwind"],
    backend: ["Convex"],
    infrastructure: ["Vercel"]
  },
  
  specs: [
    {
      type: "feature",
      name: "habit-crud",
      description: "Create, read, update, delete habits",
      acceptance: [
        "User can create new habit with name and frequency",
        "User can view all their habits",
        "User can edit habit details",
        "User can delete habits"
      ],
      priority: 1
    }
  ]
}
```

## Key Features

1. **Pure Conversation**: No menus, wizards, or static prompts
2. **Streaming Responses**: Natural feel with streaming AI responses
3. **Context Aware**: AI maintains context throughout conversation
4. **Smart Defaults**: AI suggests sensible defaults based on project type
5. **Flexible Override**: User can override any suggestion
6. **Complete Generation**: Creates full DocFlow structure ready for Cursor

## CLI UX

- Running `docflow` with no arguments opens a Clack-powered menu:
  - New: Start a new project conversation
  - Help: Show quick usage and environment variables
  - Exit: Quit

## Decision Log
- 2024-12-28: Spec created for implementation
- 2024-12-28: Using streaming for natural conversation feel
- 2024-12-28: JSON structure for AI to generate specs programmatically
- 2024-12-28: Separate prompts for different phases for better control
- 2024-12-29: **IMPLEMENTED** Enhanced system prompts in `/src/prompts/system-prompts.ts`
- 2024-12-29: **IMPLEMENTED** Phase-specific prompts for each conversation stage
- 2024-12-29: **IMPLEMENTED** Improved ProjectContext type structure in `/src/types/conversation.ts`
- 2024-12-29: **IMPLEMENTED** Validation system in ConversationManager
- 2024-12-29: **IMPLEMENTED** Project-setup enforcement as first spec
- 2024-12-29: **IMPLEMENTED** Removed budget/timeline constraints as requested
- 2025-09-17: Initialized CLI scaffolding (entrypoint, config, conversation stub, types, prompts); removed invalid `@vercel/ai` dep in favor of `ai` SDK.
- 2025-09-17: Enforce fail-fast: missing `AI_API_KEY` causes immediate error; no manual fallback workflow.