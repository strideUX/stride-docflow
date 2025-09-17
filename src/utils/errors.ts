import * as clack from '@clack/prompts';

export function reportError(error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : String(error);
  const prefix = context ? `${context}: ` : '';
  const detail = process.env.DEBUG ? `\n\n${String(error instanceof Error ? error.stack : error)}` : '';
  clack.outro(`❌ ${prefix}${message}${detail}`);
}


