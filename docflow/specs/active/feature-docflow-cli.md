# Feature: DocFlow CLI

## Context
Create a conversational CLI tool that helps users generate DocFlow project structures through natural dialogue with an AI agent. Instead of static prompts or wizards, users have a conversation about their project idea, and the AI helps shape it into properly structured specs and initial backlog items.

## User Story
As a developer
I want to describe my project idea conversationally
So that I can quickly scaffold a DocFlow project with well-thought-out specs

## Acceptance Criteria
- [ ] Running `docflow` or `docflow new` starts an interactive AI session
- [ ] AI engages in natural conversation to understand the project
- [ ] AI asks clarifying questions based on the conversation context
- [ ] AI helps refine vague ideas into concrete specs
- [ ] AI generates all DocFlow structure files from templates
- [ ] AI creates initial backlog items based on conversation
- [ ] AI suggests project name based on discussion
- [ ] User can override suggested name
- [ ] Project folder created in configurable location
- [ ] Summary displayed before creation with confirm/edit option
- [ ] Generated project ready to open in Cursor

## Technical Notes

### Approach
1. Use Vercel AI SDK (latest) for LLM integration
2. Clack for terminal UI elements (spinners, prompts when needed)
3. Pure conversational flow - no menus or static prompts
4. Stream responses for natural feel
5. Maintain conversation context for intelligent follow-ups

### Architecture
```typescript
// Core flow
1. Start conversation → AI introduces itself and asks about project
2. Exploration phase → AI asks questions, helps refine idea
3. Spec generation → AI creates specs from conversation
4. Project details → AI suggests name, confirms location
5. Generation → Create files and folder structure
6. Completion → Summary and next steps
```

### Key Components
- **ConversationManager**: Handles AI dialogue and context
- **SpecGenerator**: Converts conversation into spec files
- **ProjectScaffolder**: Creates folder structure and files
- **TemplateManager**: Manages DocFlow templates
- **ConfigManager**: Handles env vars and settings

### Data Model
```typescript
interface ProjectContext {
  // Built during conversation
  overview: {
    name?: string
    purpose: string
    features: string[]
    users: string
    success: string
  }
  
  stack: {
    frontend?: string[]
    backend?: string[]
    database?: string[]
    infrastructure?: string[]
  }
  
  specs: Array<{
    type: 'feature' | 'bug' | 'idea'
    name: string
    description: string
    acceptance: string[]
    priority: number
  }>
  
  // Project metadata
  projectName?: string
  projectPath?: string
}

interface ConversationState {
  phase: 'introduction' | 'exploration' | 'refinement' | 'generation'
  context: ProjectContext
  messages: Message[]
}
```

### AI Integration
- Provider: OpenAI/Anthropic/Groq (configurable via env)
- Model: Configurable (default: gpt-4o or claude-3-opus)
- Temperature: 0.7 for creative conversation
- System prompt: Expert at software architecture and project planning

### Environment Variables
```bash
# Required
AI_PROVIDER=openai|anthropic|groq
AI_API_KEY=your-key
AI_MODEL=gpt-4o|claude-3-opus|etc

# Optional
DOCFLOW_PROJECTS_DIR=~/Documents/Projects  # Default location
DOCFLOW_TEMPLATE_DIR=./templates           # Template location
```

### Conversation Examples

```
$ docflow new

🚀 Welcome! I'm here to help you set up your new project with DocFlow.
   Tell me about what you're planning to build.

> I want to build a tool that helps people track their daily habits

Interesting! A habit tracker - that's a great project. Let me understand 
better what you have in mind. Are you thinking of:
- A mobile app, web app, or both?
- Individual use or with social/sharing features?
- Any specific habits in mind (exercise, reading, meditation)?

> Web app for now, individual use. Want to track any habit with streaks

Great choice starting with web! Streaks are definitely motivating. 
I'm thinking about the core features:
- Creating custom habits
- Daily check-ins
- Streak tracking and visualization
- Maybe some analytics?

What about reminders or notifications?

> Yes, email reminders would be good. And I like the analytics idea

[Conversation continues to refine the idea...]

Based on our discussion, I'll create:
- feature-habit-crud: Create, read, update, delete habits
- feature-daily-checkin: Mark habits complete each day  
- feature-streak-tracking: Calculate and display streaks
- feature-email-reminders: Daily reminder system
- feature-analytics-dashboard: Progress visualization
- idea-mobile-app: Future mobile version
- idea-social-features: Potential sharing/accountability

For the stack, I'm suggesting:
- Frontend: Next.js with TypeScript
- Backend: Convex for real-time updates
- Email: Resend for reminders

Does this capture your vision? Any adjustments?

> Looks perfect!

Excellent! Last few details:

📁 Project name suggestion: "streak-tracker"
   (Press enter to accept or type a different name)

> habit-flow

Great name! Creating "habit-flow" in ~/Documents/Projects/

[Creates all files and structure]

✅ Project created successfully!

Next steps:
1. cd ~/Documents/Projects/habit-flow
2. Open in Cursor
3. Run /start-session to begin development

Happy building! 🎉
```

## Dependencies
- **Uses**: DocFlow templates from /template folder
- **Uses**: Node.js fs for file operations
- **Uses**: Vercel AI SDK for LLM integration
- **Uses**: Clack for UI elements
- **Modifies**: Nothing (creates new projects only)
- **Blocks**: None

## Decision Log
- 2024-12-28: Initial spec created
- 2024-12-28: Chose conversational AI over wizard/menu approach for natural UX
- 2024-12-28: Vercel AI SDK for provider flexibility (OpenAI, Anthropic, etc.)
- 2024-12-28: Clack for minimal UI (spinners, confirms) while keeping focus on conversation
- 2024-12-28: TypeScript for type safety with AI responses and project structure