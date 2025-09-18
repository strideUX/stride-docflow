import { streamText } from 'ai';
import * as clack from '@clack/prompts';
import type { Config } from '../config/config.js';
import { getModel } from '../ai/client.js';
import type { 
  ConversationState, 
  ProjectContext, 
  GeneratedFiles,
  ProjectSpecItem 
} from '../types/conversation.js';
import { 
  SYSTEM_PROMPT, 
  SPEC_GENERATION_PROMPT, 
  PHASE_PROMPTS,
  VALIDATION_PROMPT,
  buildSpecGenerationUserPrompt,
  INTRO_SUMMARY_PROMPT,
  buildAskOneQuestionPrompt,
} from '../prompts/system-prompts.js';
import { parseModelJson } from '../utils/json.js';

export class ConversationManager {
  private state: ConversationState;
  private model: ReturnType<typeof getModel>;

  constructor(private readonly config: Config) {
    this.model = getModel(config);
    this.state = this.initializeState();
  }

  private initializeState(): ConversationState {
    return {
      phase: 'introduction',
      context: {
        name: '',
        problem: '',
        users: [],
        coreFeatures: [],
        techPreferences: {
          mustHave: [],
          avoid: []
        },
        constraints: {
          platform: ['web'] // default
        },
        specs: [],
        createdAt: new Date()
      },
      messages: []
    };
  }

  getContext(): ProjectContext {
    return this.state.context;
  }

  async runIntroduction(): Promise<void> {
    clack.note('Tell me about what you are planning to build.');
    const userIdea = (await clack.text({ message: 'Your idea:' })) as unknown as string;
    if (clack.isCancel(userIdea)) throw new Error('Cancelled');

    this.state.messages.push({ role: 'user', content: userIdea });
    this.state.context.problem = userIdea;

    // Short, single-sentence summary only
    const stream = await streamText({ 
      model: this.model,
      system: this.buildSystemPrompt('introduction'),
      messages: [...this.state.messages, { role: 'user', content: INTRO_SUMMARY_PROMPT }],
      temperature: 0.3,
    });
    const summary = (await stream.text).trim();
    console.log('\n' + summary + '\n');
    this.state.messages.push({ role: 'assistant', content: summary });
    this.state.phase = 'exploration';
  }

  async runExplorationLoop(rounds: number = 3): Promise<void> {
    const systemPrompt = this.buildSystemPrompt('exploration');
    for (let i = 0; i < rounds; i += 1) {
      const topic = i === 0 ? 'the core problem to solve' : i === 1 ? 'the core features' : 'the preferred tech stack';
      const askOne = buildAskOneQuestionPrompt(topic);
      const stream = await streamText({ 
        model: this.model, 
        system: systemPrompt,
        messages: [...this.state.messages, { role: 'user', content: askOne }],
        temperature: 0.3,
      });
      const question = (await stream.text).trim();
      console.log('\n' + question + '\n');
      const answer = (await clack.text({ message: 'Your answer:' })) as unknown as string;
      if (clack.isCancel(answer)) throw new Error('Cancelled');
      this.state.messages.push({ role: 'assistant', content: question });
      this.state.messages.push({ role: 'user', content: answer });
      this.extractContextFromMessages();
    }
    
    this.state.phase = 'refinement';
  }

  async runRefinement(): Promise<void> {
    const systemPrompt = this.buildSystemPrompt('refinement');
    
    // Ask AI to break down into features
    const prompt = PHASE_PROMPTS.refinement + '\nBased on our conversation, what are the core features needed for MVP?';
    const stream = await streamText({ 
      model: this.model, 
      system: systemPrompt,
      messages: [...this.state.messages, { role: 'user', content: prompt }],
      temperature: 0.7
    });
    
    const features = (await stream.text).trim();
    console.log('\n' + features + '\n');
    
    const confirmation = (await clack.text({ message: 'Does this look right? Any changes?' })) as unknown as string;
    if (clack.isCancel(confirmation)) throw new Error('Cancelled');
    
    this.state.messages.push({ role: 'assistant', content: features });
    this.state.messages.push({ role: 'user', content: confirmation });
    
    this.state.phase = 'confirmation';
  }

  async validateSpecs(): Promise<boolean> {
    const validationPrompt = VALIDATION_PROMPT + '\n\nContext:\n' + JSON.stringify(this.state.context, null, 2);
    
    const stream = await streamText({
      model: this.model,
      messages: [{ role: 'user', content: validationPrompt }],
      temperature: 0.3
    });
    
    const response = await stream.text;
    
    if (response.includes('INVALID') || response.includes('FAIL')) {
      console.log('\n⚠️  Some issues need clarification:');
      console.log(response);
      return false;
    }
    
    return true;
  }

  async suggestProjectName(): Promise<string> {
    if (this.state.context.name) {
      return this.state.context.name;
    }
    
    const prompt = 'Based on our conversation, suggest a concise kebab-case project name (just the name, nothing else).';
    const stream = await streamText({ 
      model: this.model, 
      messages: [...this.state.messages, { role: 'user', content: prompt }],
      temperature: 0.5
    });
    
    const text = await stream.text;
    const name = text.trim().split(/\s+/)[0].replace(/[^a-z0-9-]/g, '').toLowerCase();
    this.state.context.name = name;
    return name;
  }

  async generateSpecsBundle(): Promise<GeneratedFiles> {
    // Ensure we have feature-project-setup as first spec
    this.ensureProjectSetupSpec();
    
    // Validate before generation
    const isValid = await this.validateSpecs();
    if (!isValid) {
      throw new Error('Specs validation failed. Please refine the project details.');
    }
    
    const user = buildSpecGenerationUserPrompt(this.state.context);
    const stream = await streamText({ 
      model: this.model, 
      system: SPEC_GENERATION_PROMPT, 
      messages: [...this.state.messages, { role: 'user', content: user }],
      temperature: 0.3 // Lower for structured output
    });
    
    const raw = await stream.text;
    const parsed = parseModelJson<GeneratedFiles>(raw);
    
    // Ensure project-setup is first
    if (parsed.specs && parsed.specs.length > 0 && parsed.specs[0].name !== 'project-setup') {
      const setupSpec = parsed.specs.find(s => s.name === 'project-setup');
      if (setupSpec) {
        parsed.specs = [setupSpec, ...parsed.specs.filter(s => s.name !== 'project-setup')];
      } else {
        // Create default project-setup if missing
        parsed.specs.unshift(this.createDefaultProjectSetupSpec());
      }
    }
    
    return parsed;
  }

  private buildSystemPrompt(phase: string): string {
    return SYSTEM_PROMPT
      .replace('{context}', JSON.stringify(this.state.context, null, 2))
      .replace('{phase}', phase);
  }

  private extractContextFromMessages(): void {
    // This would ideally use another AI call to extract structured data
    // For now, basic extraction based on keywords
    const lastMessages = this.state.messages.slice(-4);
    
    for (const msg of lastMessages) {
      const content = msg.content.toLowerCase();
      
      // Extract tech preferences
      if (content.includes('react') || content.includes('next')) {
        this.state.context.techPreferences.frontend = 'React/Next.js';
      }
      if (content.includes('node') || content.includes('express')) {
        this.state.context.techPreferences.backend = 'Node.js';
      }
      
      // Extract platform
      if (content.includes('mobile')) {
        this.state.context.constraints.platform = ['mobile'];
      } else if (content.includes('web')) {
        this.state.context.constraints.platform = ['web'];
      }
      
      // Extract users
      if (content.includes('developer')) {
        this.state.context.users.push('developers');
      }
      if (content.includes('business') || content.includes('company')) {
        this.state.context.users.push('businesses');
      }
    }
  }

  private ensureProjectSetupSpec(): void {
    if (this.state.context.specs.length === 0 || this.state.context.specs[0].name !== 'project-setup') {
      const projectSetup: ProjectSpecItem = {
        type: 'feature',
        name: 'project-setup',
        description: 'Initialize the project with core dependencies and structure',
        userStory: 'As a developer, I want a properly configured development environment so I can start building features',
        acceptanceCriteria: [
          'Project initialized in current directory (not subdirectory)',
          'TypeScript configured',
          'Core dependencies installed',
          'Basic folder structure created',
          'Development server runs without errors',
          'Git repository initialized'
        ],
        priority: 1,
        mvp: true,
        dependencies: []
      };
      
      // Add as first spec
      this.state.context.specs.unshift(projectSetup);
    }
  }

  private createDefaultProjectSetupSpec(): any {
    return {
      type: 'feature',
      name: 'project-setup',
      priority: 1,
      description: 'Initialize the project with all core dependencies',
      userStory: 'As a developer, I want a properly configured environment so I can start building',
      acceptanceCriteria: [
        'Project initialized in current directory',
        'Core framework and dependencies installed',
        'TypeScript configured',
        'Development server runs'
      ],
      dependencies: [],
      mvp: true
    };
  }
}
