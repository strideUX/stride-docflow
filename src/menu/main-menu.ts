import * as clack from '@clack/prompts';
import { showSplash } from '../ui/splash.js';

export type MainChoice = 'new' | 'help' | 'exit';

export async function showMainMenu(): Promise<MainChoice> {
  await showSplash();
  const choice = await clack.select<{ value: MainChoice }>({
    message: '🧭  What would you like to do?',
    options: [
      { label: 'Create new project', value: 'new' },
      { label: 'Help', value: 'help' },
      { label: 'Exit', value: 'exit' },
    ],
  });
  if (clack.isCancel(choice)) return 'exit';
  return choice as MainChoice;
}

export async function showHelp(): Promise<void> {
  clack.note(
    [
      'DocFlow CLI (early alpha)',
      '',
      'Commands:',
      '  docflow             Launch menu (New, Help, Exit)',
      '  docflow new         Start a new project conversation',
      '  docflow --help      Show Commander help',
      '',
      'Environment:',
      '  AI_PROVIDER         openai | anthropic | groq (default: openai)',
      '  AI_API_KEY          required',
      '  AI_MODEL            e.g., gpt-4o (default), claude-3-opus',
      '  DOCFLOW_PROJECTS_DIR  base directory for new projects',
      '  DOCFLOW_TEMPLATE_DIR  template root to copy from',
    ].join('\n')
  );
}


