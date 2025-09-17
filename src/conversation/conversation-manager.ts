import { streamText } from 'ai';
import * as clack from '@clack/prompts';
import type { Config } from '../config/config.js';
import { getModel } from '../ai/client.js';
import type { ConversationState, ProjectContext, GeneratedBundle } from '../types/conversation.js';
import { SYSTEM_PROMPT, SPEC_GENERATION_PROMPT, buildSpecGenerationUserPrompt } from '../prompts/system-prompts.js';

export class ConversationManager {
  private state: ConversationState;
  private model: ReturnType<typeof getModel>;

  constructor(private readonly config: Config) {
    this.model = getModel(config);
    this.state = {
      phase: 'introduction',
      context: {
        overview: { purpose: '', features: [], users: '', success: '' },
        stack: {},
        specs: [],
      },
      messages: [],
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

    const stream = await streamText({
      model: this.model,
      system: SYSTEM_PROMPT.replace('{context}', JSON.stringify(this.state.context)).replace('{phase}', this.state.phase),
      messages: this.state.messages,
    });

    for await (const text of stream.textStream) {
      process.stdout.write(text);
    }

    const result = await stream.response;
    const content = await result.text();
    this.state.messages.push({ role: 'assistant', content });
    this.state.phase = 'exploration';
  }

  async suggestProjectName(): Promise<string> {
    const prompt = 'Based on our conversation so far, suggest a concise kebab-case project name only.';
    const stream = await streamText({ model: this.model, messages: [...this.state.messages, { role: 'user', content: prompt }] });
    const text = await stream.text;
    return text.trim().split(/\s+/)[0].replace(/[^a-z0-9-]/g, '').toLowerCase();
  }

  async generateSpecsBundle(): Promise<GeneratedBundle> {
    const contextJson = JSON.stringify(this.state.context);
    const user = buildSpecGenerationUserPrompt(contextJson);
    const stream = await streamText({
      model: this.model,
      system: SPEC_GENERATION_PROMPT,
      messages: [...this.state.messages, { role: 'user', content: user }],
    });
    const raw = await stream.text;
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '');
    const parsed = JSON.parse(cleaned) as GeneratedBundle;
    return parsed;
  }
}


