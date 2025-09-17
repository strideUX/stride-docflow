import { streamText } from 'ai';
import * as clack from '@clack/prompts';
import type { Config } from '../config/config.js';
import { getModel } from '../ai/client.js';
import type { ConversationState, ProjectContext, GeneratedBundle } from '../types/conversation.js';
import { SYSTEM_PROMPT, SPEC_GENERATION_PROMPT, buildSpecGenerationUserPrompt } from '../prompts/system-prompts.js';
import { parseModelJson } from '../utils/json.js';

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
    // Light summary only
    const stream = await streamText({ model: this.model, messages: [...this.state.messages, { role: 'user', content: 'In one short paragraph, summarize my idea in plain language, then stop.' }] });
    const summary = (await stream.text).trim();
    // eslint-disable-next-line no-console
    console.log('\n' + summary + '\n');
    this.state.messages.push({ role: 'assistant', content: summary });
    this.state.phase = 'exploration';
  }

  async runExplorationLoop(rounds: number = 3): Promise<void> {
    for (let i = 0; i < rounds; i += 1) {
      const prompt = 'Ask ONE short clarifying question. No bullets, no extras.';
      const stream = await streamText({ model: this.model, messages: [...this.state.messages, { role: 'user', content: prompt }] });
      const question = (await stream.text).trim();
      // eslint-disable-next-line no-console
      console.log('\n' + question + '\n');
      const answer = (await clack.text({ message: 'Your answer:' })) as unknown as string;
      if (clack.isCancel(answer)) throw new Error('Cancelled');
      this.state.messages.push({ role: 'assistant', content: question });
      this.state.messages.push({ role: 'user', content: answer });
    }
    this.state.phase = 'refinement';
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
    const stream = await streamText({ model: this.model, system: SPEC_GENERATION_PROMPT, messages: [...this.state.messages, { role: 'user', content: user }] });
    const raw = await stream.text;
    const parsed = parseModelJson<GeneratedBundle>(raw);
    return parsed;
  }
}


