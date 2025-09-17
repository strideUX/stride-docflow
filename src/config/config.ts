import os from 'os';
import path from 'path';

export interface Config {
  aiProvider: 'openai' | 'anthropic' | 'groq';
  apiKey?: string;
  model: string;
  projectsDir: string;
  templateDir: string;
}

function expandHomeDirDir(inputPath: string): string {
  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

export async function loadConfig(): Promise<Config> {
  const projectsDir = expandHomeDirDir(
    process.env.DOCFLOW_PROJECTS_DIR || '~/Documents/Projects'
  );
  const templateDir = expandHomeDirDir(
    process.env.DOCFLOW_TEMPLATE_DIR || path.join(process.cwd(), 'src', 'assets', 'template', 'docflow')
  );

  if (!process.env.AI_API_KEY) {
    throw new Error('AI_API_KEY is required but not set. Please export AI_API_KEY and try again.');
  }

  return {
    aiProvider: (process.env.AI_PROVIDER as Config['aiProvider']) || 'openai',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-4o',
    projectsDir,
    templateDir,
  };
}


