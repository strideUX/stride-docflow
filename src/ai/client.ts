import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { Config } from '../config/config.js';

export type ModelLike = ReturnType<ReturnType<typeof createOpenAI>> | ReturnType<ReturnType<typeof createAnthropic>>;

export function getModel(config: Config): ModelLike {
  if (config.aiProvider === 'openai') {
    const openai = createOpenAI({ apiKey: config.apiKey });
    return openai(config.model);
  }
  if (config.aiProvider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey: config.apiKey });
    return anthropic(config.model);
  }
  // groq uses OpenAI-compatible API
  const openaiGroq = createOpenAI({ apiKey: config.apiKey, baseURL: 'https://api.groq.com/openai/v1' });
  return openaiGroq(config.model);
}


